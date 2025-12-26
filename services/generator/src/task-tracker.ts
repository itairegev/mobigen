/**
 * Task Tracker Service
 *
 * Tracks generation tasks in the database for:
 * - Progress monitoring (what phase we're in, what's done)
 * - Resume capabilities (pick up where we left off)
 * - Error tracking (what failed, how many retries)
 * - Feedback loop (detect errors, trigger fixes)
 *
 * Uses Prisma for database persistence with in-memory fallback.
 */

import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// TYPES
// ============================================================================

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'paused';
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
export type TaskType = 'agent_execution' | 'validation' | 'fix_attempt' | 'build_validation';

export interface GenerationJob {
  id: string;
  projectId: string;
  status: JobStatus;
  currentPhase: string | null;
  currentAgent: string | null;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  progress: number;
  errorMessage: string | null;
  retryCount: number;
  maxRetries: number;
  metadata: Record<string, unknown>;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GenerationTask {
  id: string;
  jobId: string;
  projectId: string;
  phase: string;
  agentId: string;
  taskType: TaskType;
  status: TaskStatus;
  priority: number;
  dependsOn: string[];
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  errorMessage: string | null;
  errorDetails: Record<string, unknown> | null;
  retryCount: number;
  filesModified: string[];
  durationMs: number | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskError {
  code: string;
  message: string;
  file?: string;
  line?: number;
  column?: number;
  suggestion?: string;
  autoFixable: boolean;
}

// ============================================================================
// PRISMA CLIENT (with fallback to in-memory for development)
// ============================================================================

let prisma: any = null;
let usePrisma = false;

// Try to load Prisma client
async function initPrisma(): Promise<boolean> {
  if (prisma !== null) return usePrisma;

  try {
    const dbModule = await import('@mobigen/db');
    prisma = dbModule.prisma;

    // Verify that the GenerationJob model exists
    if (prisma.generationJob) {
      usePrisma = true;
      console.log('[task-tracker] Using Prisma for database persistence');
      return true;
    } else {
      console.warn('[task-tracker] GenerationJob model not found - run db:generate and db:push');
      console.warn('[task-tracker] Using in-memory storage');
      usePrisma = false;
      return false;
    }
  } catch (error) {
    console.warn('[task-tracker] Prisma not available, using in-memory storage');
    console.warn('[task-tracker] Error:', error instanceof Error ? error.message : error);
    usePrisma = false;
    return false;
  }
}

// Initialize on module load
initPrisma().catch(() => {});

// ============================================================================
// IN-MEMORY FALLBACK STORE
// ============================================================================

const memoryJobs = new Map<string, GenerationJob>();
const memoryTasks = new Map<string, GenerationTask>();
const memoryTasksByJob = new Map<string, Set<string>>();

// ============================================================================
// HELPER: Convert Prisma model to our interface
// ============================================================================

function toJob(dbJob: any): GenerationJob {
  return {
    id: dbJob.id,
    projectId: dbJob.projectId,
    status: dbJob.status as JobStatus,
    currentPhase: dbJob.currentPhase,
    currentAgent: dbJob.currentAgent,
    totalTasks: dbJob.totalTasks,
    completedTasks: dbJob.completedTasks,
    failedTasks: dbJob.failedTasks,
    progress: dbJob.progress,
    errorMessage: dbJob.errorMessage,
    retryCount: dbJob.retryCount,
    maxRetries: dbJob.maxRetries,
    metadata: (dbJob.metadata as Record<string, unknown>) || {},
    startedAt: dbJob.startedAt,
    completedAt: dbJob.completedAt,
    createdAt: dbJob.createdAt,
    updatedAt: dbJob.updatedAt,
  };
}

function toTask(dbTask: any): GenerationTask {
  return {
    id: dbTask.id,
    jobId: dbTask.jobId,
    projectId: dbTask.projectId,
    phase: dbTask.phase,
    agentId: dbTask.agentId,
    taskType: dbTask.taskType as TaskType,
    status: dbTask.status as TaskStatus,
    priority: dbTask.priority,
    dependsOn: dbTask.dependsOn || [],
    input: (dbTask.input as Record<string, unknown>) || {},
    output: dbTask.output as Record<string, unknown> | null,
    errorMessage: dbTask.errorMessage,
    errorDetails: dbTask.errorDetails as Record<string, unknown> | null,
    retryCount: dbTask.retryCount,
    filesModified: dbTask.filesModified || [],
    durationMs: dbTask.durationMs,
    startedAt: dbTask.startedAt,
    completedAt: dbTask.completedAt,
    createdAt: dbTask.createdAt,
    updatedAt: dbTask.updatedAt,
  };
}

// ============================================================================
// JOB MANAGEMENT
// ============================================================================

export async function createJobAsync(projectId: string, metadata: Record<string, unknown> = {}): Promise<GenerationJob> {
  const now = new Date();
  const jobData = {
    id: uuidv4(),
    projectId,
    status: 'pending' as const,
    currentPhase: null,
    currentAgent: null,
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    progress: 0,
    errorMessage: null,
    retryCount: 0,
    maxRetries: 3,
    metadata,
    startedAt: null,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  if (usePrisma && prisma?.generationJob) {
    try {
      const dbJob = await prisma.generationJob.create({
        data: jobData,
      });
      console.log(`[task-tracker] Created job ${dbJob.id} in database for project ${projectId}`);
      return toJob(dbJob);
    } catch (error) {
      console.error('[task-tracker] Database error, falling back to memory:', error);
    }
  }

  // In-memory fallback
  const job: GenerationJob = jobData;
  memoryJobs.set(job.id, job);
  memoryTasksByJob.set(job.id, new Set());
  console.log(`[task-tracker] Created job ${job.id} in memory for project ${projectId}`);
  return job;
}

// Synchronous wrapper for backwards compatibility
export function createJob(projectId: string, metadata: Record<string, unknown> = {}): GenerationJob {
  const now = new Date();
  const job: GenerationJob = {
    id: uuidv4(),
    projectId,
    status: 'pending',
    currentPhase: null,
    currentAgent: null,
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    progress: 0,
    errorMessage: null,
    retryCount: 0,
    maxRetries: 3,
    metadata,
    startedAt: null,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  memoryJobs.set(job.id, job);
  memoryTasksByJob.set(job.id, new Set());

  // Also persist to database in background (with safe check)
  // Use upsert to handle restarts/retries gracefully
  if (usePrisma && prisma?.generationJob) {
    prisma.generationJob.upsert({
      where: { id: job.id },
      update: job,
      create: job,
    }).catch((err: Error) => {
      console.error('[task-tracker] Background DB write failed:', err.message);
    });
  }

  console.log(`[task-tracker] Created job ${job.id} for project ${projectId}`);
  return job;
}

export async function getJobAsync(jobId: string): Promise<GenerationJob | undefined> {
  if (usePrisma && prisma?.generationJob) {
    try {
      const dbJob = await prisma.generationJob.findUnique({ where: { id: jobId } });
      if (dbJob) return toJob(dbJob);
    } catch (error) {
      console.error('[task-tracker] Database read error:', error);
    }
  }
  return memoryJobs.get(jobId);
}

export function getJob(jobId: string): GenerationJob | undefined {
  return memoryJobs.get(jobId);
}

export async function getJobByProjectAsync(projectId: string): Promise<GenerationJob | undefined> {
  if (usePrisma && prisma?.generationJob) {
    try {
      const dbJob = await prisma.generationJob.findFirst({
        where: {
          projectId,
          status: { notIn: ['completed', 'failed'] },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (dbJob) return toJob(dbJob);
    } catch (error) {
      console.error('[task-tracker] Database read error:', error);
    }
  }

  // Fallback to memory
  for (const job of memoryJobs.values()) {
    if (job.projectId === projectId && job.status !== 'completed' && job.status !== 'failed') {
      return job;
    }
  }
  return undefined;
}

export function getJobByProject(projectId: string): GenerationJob | undefined {
  for (const job of memoryJobs.values()) {
    if (job.projectId === projectId && job.status !== 'completed' && job.status !== 'failed') {
      return job;
    }
  }
  return undefined;
}

export async function updateJobAsync(jobId: string, updates: Partial<GenerationJob>): Promise<GenerationJob | undefined> {
  const updateData = { ...updates, updatedAt: new Date() };

  if (usePrisma && prisma?.generationJob) {
    try {
      const dbJob = await prisma.generationJob.update({
        where: { id: jobId },
        data: updateData,
      });
      // Also update memory cache
      const cached = memoryJobs.get(jobId);
      if (cached) {
        Object.assign(cached, updateData);
      }
      return toJob(dbJob);
    } catch (error) {
      console.error('[task-tracker] Database update error:', error);
    }
  }

  // Fallback to memory
  const job = memoryJobs.get(jobId);
  if (!job) return undefined;
  Object.assign(job, updateData);
  return job;
}

export function updateJob(jobId: string, updates: Partial<GenerationJob>): GenerationJob | undefined {
  const job = memoryJobs.get(jobId);
  if (!job) return undefined;

  const updateData = { ...updates, updatedAt: new Date() };
  Object.assign(job, updateData);

  // Also update database in background (with safe check)
  // Use upsert to handle cases where DB create may have failed but in-memory exists
  if (usePrisma && prisma?.generationJob) {
    prisma.generationJob.upsert({
      where: { id: jobId },
      update: updateData,
      create: { ...job, ...updateData },
    }).catch((err: Error) => {
      // Only log non-trivial errors
      if (!err.message.includes('not found')) {
        console.error('[task-tracker] Background job DB upsert failed:', err.message);
      }
    });
  }

  return job;
}

export function startJob(jobId: string): GenerationJob | undefined {
  return updateJob(jobId, {
    status: 'running',
    startedAt: new Date(),
  });
}

export function completeJob(jobId: string, success: boolean, errorMessage?: string): GenerationJob | undefined {
  return updateJob(jobId, {
    status: success ? 'completed' : 'failed',
    progress: success ? 100 : memoryJobs.get(jobId)?.progress || 0,
    errorMessage: errorMessage || null,
    completedAt: new Date(),
  });
}

// ============================================================================
// TASK MANAGEMENT
// ============================================================================

export function createTask(
  jobId: string,
  projectId: string,
  phase: string,
  agentId: string,
  taskType: TaskType,
  options: {
    priority?: number;
    dependsOn?: string[];
    input?: Record<string, unknown>;
  } = {}
): GenerationTask {
  const now = new Date();
  const task: GenerationTask = {
    id: uuidv4(),
    jobId,
    projectId,
    phase,
    agentId,
    taskType,
    status: 'pending',
    priority: options.priority || 0,
    dependsOn: options.dependsOn || [],
    input: options.input || {},
    output: null,
    errorMessage: null,
    errorDetails: null,
    retryCount: 0,
    filesModified: [],
    durationMs: null,
    startedAt: null,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  memoryTasks.set(task.id, task);
  memoryTasksByJob.get(jobId)?.add(task.id);

  // Update job total tasks
  const job = memoryJobs.get(jobId);
  if (job) {
    updateJob(jobId, { totalTasks: job.totalTasks + 1 });
  }

  // Also persist to database in background (with safe check)
  // Use upsert to handle restarts/retries gracefully
  if (usePrisma && prisma?.generationTask) {
    prisma.generationTask.upsert({
      where: { id: task.id },
      update: task,
      create: task,
    }).catch((err: Error) => {
      console.error('[task-tracker] Background task DB write failed:', err.message);
    });
  }

  console.log(`[task-tracker] Created task ${task.id}: ${agentId} (${phase})`);
  return task;
}

export function getTask(taskId: string): GenerationTask | undefined {
  return memoryTasks.get(taskId);
}

export function getTasksByJob(jobId: string): GenerationTask[] {
  const taskIds = memoryTasksByJob.get(jobId);
  if (!taskIds) return [];
  return Array.from(taskIds).map(id => memoryTasks.get(id)!).filter(Boolean);
}

export async function getTasksByJobAsync(jobId: string): Promise<GenerationTask[]> {
  if (usePrisma && prisma?.generationTask) {
    try {
      const dbTasks = await prisma.generationTask.findMany({
        where: { jobId },
        orderBy: { createdAt: 'asc' },
      });
      return dbTasks.map(toTask);
    } catch (error) {
      console.error('[task-tracker] Database read error:', error);
    }
  }
  return getTasksByJob(jobId);
}

export function getTasksByPhase(jobId: string, phase: string): GenerationTask[] {
  return getTasksByJob(jobId).filter(t => t.phase === phase);
}

export function getPendingTasks(jobId: string): GenerationTask[] {
  return getTasksByJob(jobId)
    .filter(t => t.status === 'pending')
    .sort((a, b) => b.priority - a.priority);
}

export function getFailedTasks(jobId: string): GenerationTask[] {
  return getTasksByJob(jobId).filter(t => t.status === 'failed');
}

export function updateTask(taskId: string, updates: Partial<GenerationTask>): GenerationTask | undefined {
  const task = memoryTasks.get(taskId);
  if (!task) return undefined;

  const updateData = { ...updates, updatedAt: new Date() };
  Object.assign(task, updateData);

  // Also update database in background (with safe check)
  // Use upsert to handle cases where DB create may have failed but in-memory exists
  if (usePrisma && prisma?.generationTask) {
    prisma.generationTask.upsert({
      where: { id: taskId },
      update: updateData,
      create: { ...task, ...updateData },
    }).catch((err: Error) => {
      // Only log non-trivial errors (ignore "record not found" type errors)
      if (!err.message.includes('not found')) {
        console.error('[task-tracker] Background task DB upsert failed:', err.message);
      }
    });
  }

  return task;
}

export function startTask(taskId: string): GenerationTask | undefined {
  const task = memoryTasks.get(taskId);
  if (!task) return undefined;

  // Update job's current phase/agent
  updateJob(task.jobId, {
    currentPhase: task.phase,
    currentAgent: task.agentId,
  });

  return updateTask(taskId, {
    status: 'running',
    startedAt: new Date(),
  });
}

export function completeTask(
  taskId: string,
  success: boolean,
  output?: Record<string, unknown>,
  filesModified?: string[],
  errorMessage?: string,
  errorDetails?: Record<string, unknown>
): GenerationTask | undefined {
  const task = memoryTasks.get(taskId);
  if (!task) return undefined;

  const startTime = task.startedAt?.getTime() || Date.now();
  const duration = Date.now() - startTime;

  const updated = updateTask(taskId, {
    status: success ? 'completed' : 'failed',
    output: output || null,
    filesModified: filesModified || [],
    errorMessage: errorMessage || null,
    errorDetails: errorDetails || null,
    durationMs: duration,
    completedAt: new Date(),
  });

  // Update job progress
  const job = memoryJobs.get(task.jobId);
  if (job) {
    const allTasks = getTasksByJob(task.jobId);
    const completed = allTasks.filter(t => t.status === 'completed').length;
    const failed = allTasks.filter(t => t.status === 'failed').length;
    const progress = allTasks.length > 0 ? Math.round((completed / allTasks.length) * 100) : 0;

    updateJob(task.jobId, {
      completedTasks: completed,
      failedTasks: failed,
      progress,
    });
  }

  console.log(`[task-tracker] Task ${taskId} ${success ? 'completed' : 'failed'} (${duration}ms)`);
  return updated;
}

export function retryTask(taskId: string): GenerationTask | undefined {
  const task = memoryTasks.get(taskId);
  if (!task) return undefined;

  return updateTask(taskId, {
    status: 'pending',
    retryCount: task.retryCount + 1,
    startedAt: null,
    completedAt: null,
    output: null,
    errorMessage: null,
  });
}

// ============================================================================
// TASK DEPENDENCIES
// ============================================================================

export function canStartTask(taskId: string): boolean {
  const task = memoryTasks.get(taskId);
  if (!task) return false;
  if (task.status !== 'pending') return false;

  // Check if all dependencies are completed
  for (const depId of task.dependsOn) {
    const dep = memoryTasks.get(depId);
    if (!dep || dep.status !== 'completed') {
      return false;
    }
  }

  return true;
}

export function getReadyTasks(jobId: string): GenerationTask[] {
  return getPendingTasks(jobId).filter(t => canStartTask(t.id));
}

// ============================================================================
// FEEDBACK LOOP: ERROR DETECTION AND AUTO-FIX
// ============================================================================

export interface FeedbackResult {
  hasErrors: boolean;
  errors: TaskError[];
  canAutoFix: boolean;
  fixTaskId?: string;
}

export function analyzeErrors(jobId: string): FeedbackResult {
  const failedTasks = getFailedTasks(jobId);
  const errors: TaskError[] = [];
  let canAutoFix = false;

  for (const task of failedTasks) {
    if (task.errorDetails) {
      const taskErrors = extractErrors(task.errorDetails);
      errors.push(...taskErrors);
    } else if (task.errorMessage) {
      errors.push({
        code: 'UNKNOWN',
        message: task.errorMessage,
        autoFixable: false,
      });
    }
  }

  // Check if any errors are auto-fixable
  canAutoFix = errors.some(e => e.autoFixable);

  return {
    hasErrors: errors.length > 0,
    errors,
    canAutoFix,
  };
}

function extractErrors(details: Record<string, unknown>): TaskError[] {
  const errors: TaskError[] = [];

  // Parse common error formats
  if (Array.isArray(details.errors)) {
    for (const err of details.errors) {
      errors.push({
        code: err.code || 'ERROR',
        message: err.message || String(err),
        file: err.file,
        line: err.line,
        column: err.column,
        suggestion: err.suggestion || err.fix,
        autoFixable: isAutoFixable(err),
      });
    }
  }

  // TypeScript errors
  if (details.typescript && Array.isArray((details.typescript as Record<string, unknown>).errors)) {
    const tsErrors = (details.typescript as Record<string, unknown>).errors as Array<Record<string, unknown>>;
    for (const err of tsErrors) {
      errors.push({
        code: `TS${err.code || ''}`,
        message: String(err.message),
        file: err.file as string,
        line: err.line as number,
        autoFixable: true, // Most TS errors are fixable
      });
    }
  }

  // ESLint errors
  if (details.eslint && Array.isArray((details.eslint as Record<string, unknown>).errors)) {
    const eslintErrors = (details.eslint as Record<string, unknown>).errors as Array<Record<string, unknown>>;
    for (const err of eslintErrors) {
      errors.push({
        code: `ESLINT:${err.rule || ''}`,
        message: String(err.message),
        file: err.file as string,
        line: err.line as number,
        autoFixable: true,
      });
    }
  }

  return errors;
}

function isAutoFixable(error: Record<string, unknown>): boolean {
  // Common auto-fixable error patterns
  const fixablePatterns = [
    /missing import/i,
    /cannot find module/i,
    /undefined/i,
    /is not defined/i,
    /expected.*but got/i,
    /type.*is not assignable/i,
    /property.*does not exist/i,
    /unused variable/i,
    /prefer-const/i,
    /no-unused-vars/i,
  ];

  const message = String(error.message || '');
  return fixablePatterns.some(pattern => pattern.test(message));
}

export function createFixTask(
  jobId: string,
  projectId: string,
  failedTaskId: string,
  errors: TaskError[]
): GenerationTask {
  const failedTask = memoryTasks.get(failedTaskId);

  return createTask(jobId, projectId, 'fix', 'error-fixer', 'fix_attempt', {
    priority: 100, // High priority
    dependsOn: [], // No dependencies - run immediately
    input: {
      failedTaskId,
      failedPhase: failedTask?.phase,
      failedAgent: failedTask?.agentId,
      errors: errors.map(e => ({
        code: e.code,
        message: e.message,
        file: e.file,
        line: e.line,
        suggestion: e.suggestion,
      })),
    },
  });
}

// ============================================================================
// PROGRESS SUMMARY
// ============================================================================

export interface ProgressSummary {
  jobId: string;
  projectId: string;
  status: JobStatus;
  progress: number;
  currentPhase: string | null;
  currentAgent: string | null;
  phases: {
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    tasks: number;
    completed: number;
    failed: number;
  }[];
  errors: TaskError[];
  canResume: boolean;
  estimatedTimeRemaining?: number;
}

export function getProgressSummary(jobId: string): ProgressSummary | null {
  const job = memoryJobs.get(jobId);
  if (!job) return null;

  const allTasks = getTasksByJob(jobId);

  // Group by phase
  const phaseMap = new Map<string, GenerationTask[]>();
  for (const task of allTasks) {
    const existing = phaseMap.get(task.phase) || [];
    existing.push(task);
    phaseMap.set(task.phase, existing);
  }

  const phases = Array.from(phaseMap.entries()).map(([name, phaseTasks]) => {
    const completed = phaseTasks.filter(t => t.status === 'completed').length;
    const failed = phaseTasks.filter(t => t.status === 'failed').length;
    const running = phaseTasks.some(t => t.status === 'running');

    let status: 'pending' | 'running' | 'completed' | 'failed';
    if (failed > 0 && completed + failed === phaseTasks.length) {
      status = 'failed';
    } else if (completed === phaseTasks.length) {
      status = 'completed';
    } else if (running) {
      status = 'running';
    } else {
      status = 'pending';
    }

    return {
      name,
      status,
      tasks: phaseTasks.length,
      completed,
      failed,
    };
  });

  const { errors } = analyzeErrors(jobId);

  return {
    jobId,
    projectId: job.projectId,
    status: job.status,
    progress: job.progress,
    currentPhase: job.currentPhase,
    currentAgent: job.currentAgent,
    phases,
    errors,
    canResume: job.status === 'paused' || (job.status === 'failed' && job.retryCount < job.maxRetries),
  };
}

// ============================================================================
// RESUME CAPABILITIES
// ============================================================================

export function pauseJob(jobId: string): GenerationJob | undefined {
  return updateJob(jobId, { status: 'paused' });
}

export function resumeJob(jobId: string): { job: GenerationJob; nextTasks: GenerationTask[] } | null {
  const job = memoryJobs.get(jobId);
  if (!job) return null;
  if (job.status !== 'paused' && job.status !== 'failed') return null;

  // Update job status
  const updated = updateJob(jobId, {
    status: 'running',
    retryCount: job.status === 'failed' ? job.retryCount + 1 : job.retryCount,
  });
  if (!updated) return null;

  // Get next tasks to run
  const nextTasks = getReadyTasks(jobId);

  console.log(`[task-tracker] Resuming job ${jobId}, ${nextTasks.length} tasks ready`);

  return { job: updated, nextTasks };
}

// ============================================================================
// DATABASE SYNC (for loading state on restart)
// ============================================================================

export async function loadJobFromDatabase(projectId: string): Promise<GenerationJob | null> {
  if (!usePrisma || !prisma?.generationJob) return null;

  try {
    const dbJob = await prisma.generationJob.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: { tasks: true },
    });

    if (!dbJob) return null;

    // Load into memory cache
    const job = toJob(dbJob);
    memoryJobs.set(job.id, job);
    memoryTasksByJob.set(job.id, new Set());

    // Load tasks
    for (const dbTask of dbJob.tasks) {
      const task = toTask(dbTask);
      memoryTasks.set(task.id, task);
      memoryTasksByJob.get(job.id)?.add(task.id);
    }

    console.log(`[task-tracker] Loaded job ${job.id} from database with ${dbJob.tasks.length} tasks`);
    return job;
  } catch (error) {
    console.error('[task-tracker] Failed to load job from database:', error);
    return null;
  }
}

export async function syncToDatabase(): Promise<void> {
  if (!usePrisma || !prisma?.generationJob || !prisma?.generationTask) {
    console.log('[task-tracker] Database sync skipped - Prisma not available');
    return;
  }

  console.log('[task-tracker] Syncing to database...');

  // Sync all jobs
  for (const job of memoryJobs.values()) {
    try {
      await prisma.generationJob.upsert({
        where: { id: job.id },
        create: job,
        update: job,
      });
    } catch (error) {
      console.error(`[task-tracker] Failed to sync job ${job.id}:`, error);
    }
  }

  // Sync all tasks
  for (const task of memoryTasks.values()) {
    try {
      await prisma.generationTask.upsert({
        where: { id: task.id },
        create: task,
        update: task,
      });
    } catch (error) {
      console.error(`[task-tracker] Failed to sync task ${task.id}:`, error);
    }
  }

  console.log('[task-tracker] Sync complete');
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export const TaskTracker = {
  // Jobs
  createJob,
  createJobAsync,
  getJob,
  getJobAsync,
  getJobByProject,
  getJobByProjectAsync,
  updateJob,
  updateJobAsync,
  startJob,
  completeJob,
  pauseJob,
  resumeJob,

  // Tasks
  createTask,
  getTask,
  getTasksByJob,
  getTasksByJobAsync,
  getTasksByPhase,
  getPendingTasks,
  getFailedTasks,
  getReadyTasks,
  updateTask,
  startTask,
  completeTask,
  retryTask,
  canStartTask,

  // Feedback
  analyzeErrors,
  createFixTask,

  // Progress
  getProgressSummary,

  // Database
  loadJobFromDatabase,
  syncToDatabase,
};

export default TaskTracker;
