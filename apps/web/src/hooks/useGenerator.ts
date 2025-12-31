'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  GenerationPhase,
  GenerationProgress,
  GenerationResult,
  ProjectConfig,
} from '@/lib/types';

const GENERATOR_URL = process.env.NEXT_PUBLIC_GENERATOR_URL || 'http://localhost:4000';
const SIMULATION_MODE = process.env.NEXT_PUBLIC_SIMULATION_MODE === 'true';

// Types for API responses
interface JobSummary {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  progress: number;
  currentPhase: string | null;
  currentAgent: string | null;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  retryCount: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  errorMessage: string | null;
}

interface PhaseSummary {
  name: string;
  status: string;
  icon: string;
}

interface ProgressResponse {
  success: boolean;
  projectId: string;
  jobId: string;
  status: string;
  progress: number;
  phases: PhaseSummary[];
  summary: {
    currentPhase: string | null;
    currentAgent: string | null;
    phases: Array<{
      name: string;
      status: 'pending' | 'running' | 'completed' | 'failed';
      tasks: number;
      completed: number;
      failed: number;
    }>;
    errors: Array<{ code: string; message: string; file?: string }>;
    canResume: boolean;
  } | null;
  timing: {
    startedAt: string | null;
    completedAt: string | null;
    durationMs: number | null;
  };
}

interface FailedTask {
  id: string;
  phase: string;
  agentId: string;
  errorMessage: string | null;
  errorDetails: Record<string, unknown> | null;
  retryCount: number;
  durationMs: number | null;
}

interface FailedTasksResponse {
  success: boolean;
  projectId: string;
  totalFailedTasks: number;
  jobsWithFailures: number;
  failures: Array<{
    jobId: string;
    jobStatus: string;
    tasks: FailedTask[];
  }>;
}

interface UseGeneratorOptions {
  projectId: string;
  autoConnect?: boolean;
}

interface UseGeneratorReturn {
  isConnected: boolean;
  isGenerating: boolean;
  isLoading: boolean;
  phases: GenerationPhase[];
  currentPhaseIndex: number;
  filesGenerated: string[];
  progress: number;
  result: GenerationResult | null;
  error: string | null;
  // New fields
  jobId: string | null;
  jobStatus: string | null;
  canResume: boolean;
  failedTasks: FailedTask[];
  jobHistory: JobSummary[];
  // Actions
  startGeneration: (prompt: string, config: ProjectConfig) => Promise<void>;
  resumeGeneration: (phase?: string) => Promise<void>;
  refreshProgress: () => Promise<void>;
  fetchJobHistory: () => Promise<void>;
  fetchFailedTasks: () => Promise<void>;
  disconnect: () => void;
}

// Map phase names from API to our phase IDs
const PHASE_ID_MAP: Record<string, string> = {
  'analysis': 'analysis',
  'planning': 'product-definition',
  'design': 'architecture',
  'task-breakdown': 'planning',
  'implementation': 'implementation',
  'validation': 'validation',
  'qa': 'quality-assurance',
};

const PHASE_NAME_MAP: Record<string, string> = {
  'setup': 'Project Setup',
  'analysis': 'Intent Analysis',
  'planning': 'Product Definition',
  'design': 'Technical Architecture',
  'ui-design': 'UI/UX Design',
  'task-breakdown': 'Task Planning',
  'implementation': 'Implementation',
  'validation': 'Validation',
  'qa': 'Quality Assurance',
};

export function useGenerator({ projectId, autoConnect = true }: UseGeneratorOptions): UseGeneratorReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [phases, setPhases] = useState<GenerationPhase[]>([
    { id: 'setup', name: 'Project Setup', status: 'pending' },
    { id: 'analysis', name: 'Intent Analysis', status: 'pending', agent: 'intent-analyzer' },
    { id: 'product-definition', name: 'Product Definition', status: 'pending', agent: 'product-manager' },
    { id: 'architecture', name: 'Technical Architecture', status: 'pending', agent: 'technical-architect' },
    { id: 'ui-design', name: 'UI/UX Design', status: 'pending', agent: 'ui-ux-expert' },
    { id: 'planning', name: 'Task Planning', status: 'pending', agent: 'lead-developer' },
    { id: 'implementation', name: 'Implementation', status: 'pending', agent: 'developer' },
    { id: 'validation', name: 'Validation', status: 'pending', agent: 'validator' },
    { id: 'quality-assurance', name: 'Quality Assurance', status: 'pending', agent: 'qa' },
  ]);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(-1);
  const [filesGenerated, setFilesGenerated] = useState<string[]>([]);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // New state
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [canResume, setCanResume] = useState(false);
  const [failedTasks, setFailedTasks] = useState<FailedTask[]>([]);
  const [jobHistory, setJobHistory] = useState<JobSummary[]>([]);

  const socketRef = useRef<Socket | null>(null);

  // Calculate progress
  const completedPhases = phases.filter((p) => p.status === 'completed').length;
  const progress = phases.length > 0 ? (completedPhases / phases.length) * 100 : 0;

  // Fetch existing progress from API
  const refreshProgress = useCallback(async () => {
    try {
      const response = await fetch(`${GENERATOR_URL}/api/projects/${projectId}/progress`);
      if (!response.ok) {
        if (response.status === 404) {
          // No existing job - that's fine
          setIsLoading(false);
          return;
        }
        throw new Error('Failed to fetch progress');
      }

      const data: ProgressResponse = await response.json();

      if (data.success) {
        setJobId(data.jobId);
        setJobStatus(data.status);
        setCanResume(data.summary?.canResume || false);

        // Update phases based on API response
        if (data.summary?.phases) {
          setPhases(prev => {
            const updated = [...prev];
            // Mark setup as completed if we have any progress
            if (data.progress > 0) {
              const setupIdx = updated.findIndex(p => p.id === 'setup');
              if (setupIdx !== -1) updated[setupIdx] = { ...updated[setupIdx], status: 'completed' };
            }

            // Update phases from API
            for (const apiPhase of data.summary!.phases) {
              const phaseId = PHASE_ID_MAP[apiPhase.name] || apiPhase.name;
              const idx = updated.findIndex(p => p.id === phaseId);
              if (idx !== -1) {
                updated[idx] = {
                  ...updated[idx],
                  status: apiPhase.status as GenerationPhase['status'],
                  message: apiPhase.failed > 0 ? `${apiPhase.failed} failed tasks` : undefined,
                };
              }
            }
            return updated;
          });
        }

        // Set generating state based on job status
        setIsGenerating(data.status === 'running');

        // If job completed or failed, fetch result
        if (data.status === 'completed' || data.status === 'failed') {
          // Mark all phases complete if job completed
          if (data.status === 'completed') {
            setPhases(prev => prev.map(p => ({ ...p, status: 'completed' })));
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch progress:', err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Fetch job history
  const fetchJobHistory = useCallback(async () => {
    try {
      const response = await fetch(`${GENERATOR_URL}/api/projects/${projectId}/jobs?limit=10`);
      if (!response.ok) return;

      const data = await response.json();
      if (data.success) {
        setJobHistory(data.jobs);
      }
    } catch (err) {
      console.error('Failed to fetch job history:', err);
    }
  }, [projectId]);

  // Fetch failed tasks
  const fetchFailedTasks = useCallback(async () => {
    try {
      const response = await fetch(`${GENERATOR_URL}/api/projects/${projectId}/failed-tasks`);
      if (!response.ok) return;

      const data: FailedTasksResponse = await response.json();
      if (data.success && data.failures.length > 0) {
        // Flatten all failed tasks
        const allFailed = data.failures.flatMap(f => f.tasks);
        setFailedTasks(allFailed);
      }
    } catch (err) {
      console.error('Failed to fetch failed tasks:', err);
    }
  }, [projectId]);

  // Handle phase update
  const handlePhaseUpdate = useCallback((phaseId: string, status: 'running' | 'completed' | 'error', message?: string) => {
    setPhases((prev) => {
      const phaseIndex = prev.findIndex((p) => p.id === phaseId);
      if (phaseIndex === -1) return prev;

      return prev.map((p, idx) => {
        if (idx < phaseIndex) {
          return { ...p, status: 'completed' };
        }
        if (idx === phaseIndex) {
          return { ...p, status, message };
        }
        return p;
      });
    });

    const phaseIndex = phases.findIndex((p) => p.id === phaseId);
    if (phaseIndex !== -1) {
      setCurrentPhaseIndex(phaseIndex);
    }
  }, [phases]);

  // Handle progress events from WebSocket
  const handleProgress = useCallback((data: GenerationProgress) => {
    const { stage, data: progressData } = data;

    switch (stage) {
      case 'phase':
        if (progressData.phase) {
          const phaseId = PHASE_ID_MAP[progressData.phase] || progressData.phase;
          handlePhaseUpdate(phaseId, 'running');
        }
        break;

      case 'cloning':
        handlePhaseUpdate('setup', 'running', `Cloning ${progressData.template} template...`);
        break;

      case 'template-context':
        handlePhaseUpdate('setup', 'completed', 'Template loaded');
        break;

      case 'task':
        setPhases((prev) =>
          prev.map((p) =>
            p.id === 'implementation'
              ? { ...p, message: `Task ${progressData.index}/${progressData.total}: ${progressData.title}` }
              : p
          )
        );
        break;

      case 'validation-attempt':
        setPhases((prev) =>
          prev.map((p) =>
            p.id === 'validation'
              ? { ...p, message: `Validation attempt ${progressData.attempt}` }
              : p
          )
        );
        break;

      case 'fixing':
        setPhases((prev) =>
          prev.map((p) =>
            p.id === 'validation'
              ? { ...p, message: `Fixing errors (attempt ${progressData.attempt})` }
              : p
          )
        );
        break;

      // New: Handle agent-specific progress
      case 'agent:start':
      case 'agent:attempt':
        if (progressData.phase) {
          const phaseId = PHASE_ID_MAP[progressData.phase] || progressData.phase;
          const message = progressData.attempt && progressData.attempt > 1
            ? `Retry ${progressData.attempt}/${progressData.maxRetries}`
            : `Running ${progressData.agent}...`;
          handlePhaseUpdate(phaseId, 'running', message);
        }
        break;

      case 'agent:complete':
        if (progressData.phase) {
          const phaseId = PHASE_ID_MAP[progressData.phase] || progressData.phase;
          handlePhaseUpdate(phaseId, 'completed');
        }
        break;

      case 'agent:error':
        if (progressData.phase) {
          const phaseId = PHASE_ID_MAP[progressData.phase] || progressData.phase;
          handlePhaseUpdate(phaseId, 'error', progressData.error || 'Error occurred');
        }
        break;

      // Handle agent success (same as complete but from within executeAgent)
      case 'agent:success':
        if (progressData.phase) {
          const phaseId = PHASE_ID_MAP[progressData.phase as string] || (progressData.phase as string);
          const filesCount = (progressData.filesModified as number) || 0;
          handlePhaseUpdate(phaseId, 'completed', filesCount > 0 ? `${filesCount} files modified` : undefined);
        }
        break;

      // Handle agent failed (final failure after all retries)
      case 'agent:failed':
        if (progressData.phase) {
          const phaseId = PHASE_ID_MAP[progressData.phase] || progressData.phase;
          handlePhaseUpdate(phaseId, 'error', progressData.error || `Failed after ${progressData.totalAttempts || 3} attempts`);
          setCanResume(true);
        }
        break;

      // Handle agent waiting (before retry)
      case 'agent:waiting':
        if (progressData.phase) {
          const phaseId = PHASE_ID_MAP[progressData.phase as string] || (progressData.phase as string);
          const waitSeconds = Math.round(((progressData.waitTime as number) || 10000) / 1000);
          const reason = progressData.reason === 'rate_limit' ? 'rate limit' : String(progressData.reason || 'retry');
          handlePhaseUpdate(phaseId, 'running', `Waiting ${waitSeconds}s (${reason})...`);
        }
        break;

      // Handle feedback loop events
      case 'feedback:start':
        handlePhaseUpdate('validation', 'running', `Fixing ${progressData.errorCount || progressData.errors} errors...`);
        break;

      case 'feedback:success':
      case 'feedback:complete':
        if (progressData.success) {
          handlePhaseUpdate('validation', 'completed', `Fixed ${progressData.filesFixed || progressData.filesModified || 0} files`);
        }
        break;

      // Handle fix-specific events
      case 'fix:start':
        handlePhaseUpdate('validation', 'running', `Auto-fixing ${progressData.autoFixable || progressData.errorCount} errors...`);
        break;

      case 'fix:waiting':
        {
          const waitSec = Math.round(((progressData.waitTime as number) || 10000) / 1000);
          handlePhaseUpdate('validation', 'running', `Waiting ${waitSec}s before retry (${String(progressData.reason || 'cooldown')})...`);
        }
        break;

      case 'fix:retry':
        handlePhaseUpdate('validation', 'running', `Retrying ${progressData.agent}...`);
        break;

      case 'fix:success':
        handlePhaseUpdate('validation', 'completed', `${progressData.filesModified || 0} files fixed`);
        break;

      case 'fix:failed':
      case 'fix:skipped':
        handlePhaseUpdate('validation', 'error', String(progressData.error || progressData.reason || 'Fix failed'));
        break;

      // Handle phase-level failure
      case 'phase:failed':
        if (progressData.phase) {
          const phaseId = PHASE_ID_MAP[progressData.phase] || progressData.phase;
          handlePhaseUpdate(phaseId, 'error', 'Phase failed');
          if (progressData.canResume) {
            setCanResume(true);
          }
        }
        break;

      case 'phase:start':
        if (progressData.phase) {
          const phaseId = PHASE_ID_MAP[progressData.phase as string] || (progressData.phase as string);
          const agents = progressData.agents as string[] | undefined;
          handlePhaseUpdate(phaseId, 'running', agents ? `Running ${agents.join(', ')}` : undefined);
        }
        break;

      case 'phase:complete':
        if (progressData.phase) {
          const phaseId = PHASE_ID_MAP[progressData.phase] || progressData.phase;
          handlePhaseUpdate(phaseId, progressData.success ? 'completed' : 'error');
        }
        break;

      // Handle pipeline lifecycle events
      case 'pipeline:start':
        setIsGenerating(true);
        setError(null);
        // Reset phases to pending when pipeline starts
        setPhases(prev => prev.map(p => ({ ...p, status: p.id === 'setup' ? 'completed' : 'pending', message: undefined })));
        break;

      case 'pipeline:complete':
        setIsGenerating(false);
        if (progressData.success) {
          setPhases(prev => prev.map(p => ({ ...p, status: 'completed' })));
        }
        setCanResume(!progressData.success);
        // Refresh data after completion
        fetchJobHistory();
        break;

      case 'pipeline:error':
        setIsGenerating(false);
        setError(progressData.error || 'Pipeline failed');
        setCanResume(true);
        fetchFailedTasks();
        break;

      // Handle pipeline status updates
      case 'pipeline:status':
        if (progressData.phases) {
          setPhases(prev => {
            const updated = [...prev];
            for (const apiPhase of progressData.phases as Array<{ name: string; status: string; icon: string }>) {
              const phaseId = PHASE_ID_MAP[apiPhase.name] || apiPhase.name;
              const idx = updated.findIndex(p => p.id === phaseId);
              if (idx !== -1) {
                let status: GenerationPhase['status'] = 'pending';
                if (apiPhase.status === 'completed') status = 'completed';
                else if (apiPhase.status === 'running') status = 'running';
                else if (apiPhase.status === 'failed') status = 'error';
                updated[idx] = { ...updated[idx], status };
              }
            }
            return updated;
          });
        }
        break;

      case 'error':
        setError(progressData.error || 'An error occurred');
        setIsGenerating(false);
        // Refresh to get latest state
        refreshProgress();
        fetchFailedTasks();
        break;

      case 'complete':
        setPhases((prev) => prev.map((p) => ({ ...p, status: 'completed' })));
        setIsGenerating(false);
        if (progressData.filesGenerated) {
          setFilesGenerated((prev) => [...new Set([...prev, ...(prev.length < progressData.filesGenerated! ? Array(progressData.filesGenerated! - prev.length).fill('generated-file') : [])])]);
        }
        break;

      default:
        // Handle SDK messages
        if ('tool_name' in progressData && (progressData.tool_name === 'Write' || progressData.tool_name === 'Edit')) {
          const toolInput = progressData.tool_input as Record<string, unknown> | undefined;
          const filePath = toolInput?.file_path as string;
          if (filePath) {
            setFilesGenerated((prev) => [...new Set([...prev, filePath])]);
          }
        }
    }
  }, [handlePhaseUpdate, refreshProgress, fetchFailedTasks]);

  // Connect to socket
  useEffect(() => {
    if (!autoConnect || !projectId) return;

    // Fetch existing progress first
    refreshProgress();
    fetchJobHistory();

    const socket = io(GENERATOR_URL, {
      transports: ['websocket', 'polling'],
      // Reconnection settings
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      // Timeout settings to match server
      timeout: 60000,
      // Enable credentials for CORS
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('[useGenerator] WebSocket connected');
      setIsConnected(true);
      socket.emit('subscribe', projectId);
    });

    socket.on('disconnect', (reason) => {
      console.log('[useGenerator] WebSocket disconnected:', reason);
      setIsConnected(false);
      // If disconnected during generation, try to refresh progress
      if (reason === 'io server disconnect' || reason === 'transport close') {
        // Server initiated disconnect or transport failure - will auto-reconnect
      }
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('[useGenerator] WebSocket reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      socket.emit('subscribe', projectId);
      // Refresh progress after reconnection
      refreshProgress();
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('[useGenerator] WebSocket reconnection attempt', attemptNumber);
    });

    socket.on('connect_error', (error) => {
      console.error('[useGenerator] WebSocket connection error:', error.message);
    });

    socket.on('generation:progress', handleProgress);

    socket.on('generation:complete', (genResult: GenerationResult) => {
      setResult(genResult);
      setIsGenerating(false);
      setPhases((prev) => prev.map((p) => ({ ...p, status: 'completed' })));
      fetchJobHistory(); // Refresh history after completion
    });

    socket.on('generation:error', (errorData: { error: string }) => {
      setError(errorData.error);
      setIsGenerating(false);
      refreshProgress();
      fetchFailedTasks();
    });

    socket.on('generation:resumed', () => {
      setIsGenerating(true);
      setError(null);
      refreshProgress();
    });

    socket.on('generation:paused', () => {
      setIsGenerating(false);
      setCanResume(true);
    });

    socketRef.current = socket;

    return () => {
      socket.emit('unsubscribe', projectId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [projectId, autoConnect, handleProgress, refreshProgress, fetchJobHistory, fetchFailedTasks]);

  // Simulate generation for development/demo mode
  const simulateGeneration = useCallback(async () => {
    const phaseIds = [
      'setup', 'analysis', 'product-definition', 'architecture',
      'ui-design', 'planning', 'implementation', 'validation', 'quality-assurance'
    ];

    for (let i = 0; i < phaseIds.length; i++) {
      setCurrentPhaseIndex(i);
      setPhases((prev) =>
        prev.map((p, idx) => ({
          ...p,
          status: idx < i ? 'completed' : idx === i ? 'running' : 'pending',
          message: idx === i ? 'Processing...' : p.message,
        }))
      );

      await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));

      if (i === 6) {
        setFilesGenerated([
          'src/app/(tabs)/index.tsx',
          'src/components/CustomComponent.tsx',
          'src/hooks/useCustomHook.ts',
          'src/services/api.ts',
          'src/types/index.ts',
        ]);
      }
    }

    setPhases((prev) => prev.map((p) => ({ ...p, status: 'completed', message: 'Done' })));
    setResult({
      files: [
        'src/app/(tabs)/index.tsx',
        'src/components/CustomComponent.tsx',
        'src/hooks/useCustomHook.ts',
        'src/services/api.ts',
        'src/types/index.ts',
      ],
      success: true,
      qaReport: {
        overallScore: 85,
        readyForProduction: true,
        recommendations: ['Add more unit tests', 'Optimize images'],
      },
    });
    setIsGenerating(false);
  }, []);

  // Start generation
  const startGeneration = useCallback(async (prompt: string, config: ProjectConfig) => {
    setIsGenerating(true);
    setError(null);
    setResult(null);
    setFilesGenerated([]);
    setFailedTasks([]);
    setPhases((prev) => prev.map((p) => ({ ...p, status: 'pending', message: undefined })));
    setCurrentPhaseIndex(-1);

    if (SIMULATION_MODE || !socketRef.current?.connected) {
      console.log('Running in simulation mode');
      await simulateGeneration();
      return;
    }

    try {
      const response = await fetch(`${GENERATOR_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          prompt,
          config,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start generation');
      }

      const data = await response.json();
      if (data.jobId) {
        setJobId(data.jobId);
      }
    } catch (err) {
      console.log('Falling back to simulation mode due to error:', err);
      await simulateGeneration();
    }
  }, [projectId, simulateGeneration]);

  // Resume generation
  const resumeGeneration = useCallback(async (phase?: string) => {
    setError(null);
    setIsGenerating(true);

    try {
      const endpoint = phase
        ? `${GENERATOR_URL}/api/projects/${projectId}/resume-from-phase`
        : `${GENERATOR_URL}/api/projects/${projectId}/resume`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: phase ? JSON.stringify({ phase }) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to resume generation');
      }

      setCanResume(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume');
      setIsGenerating(false);
    }
  }, [projectId]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('unsubscribe', projectId);
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, [projectId]);

  return {
    isConnected,
    isGenerating,
    isLoading,
    phases,
    currentPhaseIndex,
    filesGenerated,
    progress,
    result,
    error,
    jobId,
    jobStatus,
    canResume,
    failedTasks,
    jobHistory,
    startGeneration,
    resumeGeneration,
    refreshProgress,
    fetchJobHistory,
    fetchFailedTasks,
    disconnect,
  };
}
