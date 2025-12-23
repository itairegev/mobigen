/**
 * AI-Driven Orchestrator
 *
 * This orchestrator uses the Claude Agent SDK with the Task tool to dynamically
 * spawn subagents. Unlike the legacy orchestrator which had hardcoded sequential
 * phases, this AI orchestrator decides which agents to invoke and when.
 *
 * Key features:
 * - Dynamic agent selection based on task requirements
 * - Parallel execution of independent agents (up to 5 concurrent)
 * - Session continuity across agent invocations
 * - File-based agent definitions (loaded from agents/ folder)
 */

import {
  query,
  ParallelExecutionManager,
  createTaskTools,
  type AgentExecutor,
  type SDKMessage,
} from '@anthropic-ai/claude-agent-sdk';
import {
  getDefaultRegistry,
  type DynamicAgentDefinition,
} from '@mobigen/ai';
import type { WhiteLabelConfig, GenerationResult } from '@mobigen/ai';
import { TemplateManager, type ProjectMetadata, type TemplateContext } from '@mobigen/storage';
import { emitProgress } from './api';
import { flagForHumanReview } from './session-manager';
import { createQAHooks } from './hooks/index';
import { createLogger, type GenerationLogger } from './logger';
import * as path from 'path';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';

// ============================================================================
// CONFIGURATION
// ============================================================================

function resolveMobigenRoot(): string {
  if (process.env.MOBIGEN_ROOT) {
    return process.env.MOBIGEN_ROOT;
  }

  const cwd = process.cwd();
  if (cwd.endsWith('services/generator') || cwd.endsWith('services\\generator')) {
    return path.resolve(cwd, '../..');
  }

  if (fs.existsSync(path.join(cwd, 'templates-bare'))) {
    return cwd;
  }

  const oneUp = path.resolve(cwd, '..');
  if (fs.existsSync(path.join(oneUp, 'templates-bare'))) {
    return oneUp;
  }

  const twoUp = path.resolve(cwd, '../..');
  if (fs.existsSync(path.join(twoUp, 'templates-bare'))) {
    return twoUp;
  }

  console.warn(`[ai-orchestrator] Could not find templates-bare directory.`);
  return cwd;
}

const MOBIGEN_ROOT = resolveMobigenRoot();
const TEMPLATES_BARE_DIR = path.join(MOBIGEN_ROOT, 'templates-bare');
const TEMPLATES_WORKING_DIR = path.join(MOBIGEN_ROOT, 'templates');
const PROJECTS_DIR = path.join(MOBIGEN_ROOT, 'projects');
const AGENTS_DIR = path.join(MOBIGEN_ROOT, 'agents');

// Log paths at startup
console.log(`[ai-orchestrator] ┌─────────────────────────────────────────────`);
console.log(`[ai-orchestrator] │ AI Orchestrator Configuration:`);
console.log(`[ai-orchestrator] │   MOBIGEN_ROOT: ${MOBIGEN_ROOT}`);
console.log(`[ai-orchestrator] │   AGENTS_DIR:   ${AGENTS_DIR}`);
console.log(`[ai-orchestrator] │   PROJECTS_DIR: ${PROJECTS_DIR}`);
console.log(`[ai-orchestrator] └─────────────────────────────────────────────`);

// Initialize template manager
const templateManager = new TemplateManager({
  bareRepoDir: TEMPLATES_BARE_DIR,
  workingCopyDir: TEMPLATES_WORKING_DIR,
  projectsDir: PROJECTS_DIR,
});

// Initialize agent registry
const agentRegistry = getDefaultRegistry(MOBIGEN_ROOT);

// Initialize parallel execution manager (max 5 concurrent)
const executionManager = new ParallelExecutionManager({
  maxConcurrent: 5,
  defaultTimeoutMs: 300000, // 5 minutes
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function countProjectFiles(projectPath: string): Promise<number> {
  let count = 0;
  const srcPath = path.join(projectPath, 'src');

  async function walkDir(dir: string): Promise<void> {
    try {
      const entries = await fsPromises.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walkDir(fullPath);
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
          count++;
        }
      }
    } catch {
      // Directory doesn't exist
    }
  }

  await walkDir(srcPath);
  return count;
}

async function listProjectFiles(projectPath: string): Promise<string[]> {
  const files: string[] = [];
  const srcPath = path.join(projectPath, 'src');

  async function walkDir(dir: string): Promise<void> {
    try {
      const entries = await fsPromises.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walkDir(fullPath);
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') ||
                   entry.name.endsWith('.json') || entry.name.endsWith('.js')) {
          files.push(fullPath);
        }
      }
    } catch {
      // Directory doesn't exist
    }
  }

  await walkDir(srcPath);

  const rootFiles = ['app.json', 'package.json', 'tsconfig.json', 'tailwind.config.js'];
  for (const file of rootFiles) {
    const filePath = path.join(projectPath, file);
    if (fs.existsSync(filePath)) {
      files.push(filePath);
    }
  }

  return files;
}

// ============================================================================
// SUCCESS EVALUATION
// ============================================================================

interface SuccessSignals {
  isSuccess: boolean;
  fileCount: number;
  hasGeneratedFiles: boolean;
  hasErrors: boolean;
  errorCount: number;
  hasValidationPass: boolean;
  hasCompletionKeywords: boolean;
  hasFailureKeywords: boolean;
  taskSuccessRate: number;
  reasoning: string;
}

/**
 * Evaluates success based on multiple signals rather than just keywords
 */
function evaluateSuccess(
  logs: SDKMessage[],
  trackedFiles: string[],
  actualFileCount: number,
  logger: GenerationLogger
): SuccessSignals {
  const signals: SuccessSignals = {
    isSuccess: false,
    fileCount: Math.max(trackedFiles.length, actualFileCount),
    hasGeneratedFiles: false,
    hasErrors: false,
    errorCount: 0,
    hasValidationPass: false,
    hasCompletionKeywords: false,
    hasFailureKeywords: false,
    taskSuccessRate: 0,
    reasoning: '',
  };

  // Signal 1: Check if files were generated
  signals.hasGeneratedFiles = signals.fileCount > 0;

  // Signal 2: Count errors in logs
  let taskCount = 0;
  let taskSuccessCount = 0;

  for (const log of logs) {
    // Check for error messages
    if (log.type === 'tool' && log.tool_result && !log.tool_result.success) {
      signals.errorCount++;
    }

    // Check Task tool results
    if (log.type === 'tool' && log.tool_name === 'Task') {
      taskCount++;
      if (log.tool_result?.success) {
        taskSuccessCount++;
        const output = log.tool_result.output as Record<string, unknown>;
        if (output?.status === 'completed') {
          taskSuccessCount++; // Extra credit for completed status
        }
      }
    }

    // Check for validation results in assistant messages
    if (log.type === 'assistant' && log.message) {
      const content = log.message.content
        .filter((b: { type: string }) => b.type === 'text')
        .map((b: { text?: string }) => b.text || '')
        .join('');

      const lowerContent = content.toLowerCase();

      // Check for validation pass indicators
      if (lowerContent.includes('validation passed') ||
          lowerContent.includes('all checks passed') ||
          lowerContent.includes('no errors found') ||
          lowerContent.includes('typescript: pass') ||
          lowerContent.includes('eslint: pass')) {
        signals.hasValidationPass = true;
      }

      // Check for completion keywords
      if (lowerContent.includes('success') ||
          lowerContent.includes('completed') ||
          lowerContent.includes('generation complete') ||
          lowerContent.includes('app is ready') ||
          lowerContent.includes('finished generating') ||
          lowerContent.includes('all tasks complete')) {
        signals.hasCompletionKeywords = true;
      }

      // Check for failure keywords
      if (lowerContent.includes('failed') ||
          lowerContent.includes('error') ||
          lowerContent.includes('could not') ||
          lowerContent.includes('unable to')) {
        signals.hasFailureKeywords = true;
      }
    }
  }

  signals.hasErrors = signals.errorCount > 0;
  signals.taskSuccessRate = taskCount > 0 ? taskSuccessCount / taskCount : 1;

  // Decision logic: Use weighted signals
  let score = 0;
  const reasons: string[] = [];

  // Positive signals
  if (signals.hasGeneratedFiles) {
    score += 3;
    reasons.push(`+3: Generated ${signals.fileCount} files`);
  }

  if (signals.hasValidationPass) {
    score += 2;
    reasons.push('+2: Validation passed');
  }

  if (signals.hasCompletionKeywords) {
    score += 1;
    reasons.push('+1: Completion keywords found');
  }

  if (signals.taskSuccessRate >= 0.8) {
    score += 2;
    reasons.push(`+2: High task success rate (${Math.round(signals.taskSuccessRate * 100)}%)`);
  } else if (signals.taskSuccessRate >= 0.5) {
    score += 1;
    reasons.push(`+1: Moderate task success rate (${Math.round(signals.taskSuccessRate * 100)}%)`);
  }

  // Negative signals
  if (signals.hasFailureKeywords && !signals.hasCompletionKeywords) {
    score -= 2;
    reasons.push('-2: Failure keywords without completion');
  }

  if (signals.errorCount > 3) {
    score -= 2;
    reasons.push(`-2: Multiple errors (${signals.errorCount})`);
  } else if (signals.errorCount > 0) {
    score -= 1;
    reasons.push(`-1: Some errors (${signals.errorCount})`);
  }

  // Threshold: score >= 3 is success
  signals.isSuccess = score >= 3;
  signals.reasoning = reasons.join('; ');

  logger.info('Success evaluation', {
    score,
    threshold: 3,
    signals: {
      fileCount: signals.fileCount,
      errorCount: signals.errorCount,
      taskSuccessRate: `${Math.round(signals.taskSuccessRate * 100)}%`,
      hasValidationPass: signals.hasValidationPass,
      hasCompletionKeywords: signals.hasCompletionKeywords,
    },
  });

  return signals;
}

// ============================================================================
// AGENT EXECUTOR
// ============================================================================

/**
 * Executes an agent using the Claude SDK
 */
const executeAgent: AgentExecutor = async (
  agent: DynamicAgentDefinition,
  prompt: string,
  context?: Record<string, unknown>
): Promise<{ result: string; filesModified?: string[]; error?: string }> => {
  const projectPath = context?.projectPath as string || PROJECTS_DIR;
  const filesModified: string[] = [];
  let result = '';

  console.log(`[ai-orchestrator] Executing agent: ${agent.id}`);
  console.log(`[ai-orchestrator] Agent model: ${agent.model || 'sonnet'}`);

  try {
    for await (const message of query({
      prompt,
      options: {
        agents: {
          [agent.id]: {
            description: agent.description,
            prompt: agent.prompt,
            tools: agent.tools,
            model: agent.model,
          },
        },
        allowedTools: agent.tools,
        model: agent.model || 'sonnet',
        systemPrompt: `You are ${agent.description}
Working directory: ${MOBIGEN_ROOT}
Project directory: ${projectPath}
${agent.prompt}`,
        cwd: MOBIGEN_ROOT,
        permissionMode: 'acceptEdits',
      },
    })) {
      // Track file changes
      if (message.type === 'tool' && (message.tool_name === 'Write' || message.tool_name === 'Edit')) {
        const filePath = message.tool_input?.file_path as string;
        if (filePath && !filesModified.includes(filePath)) {
          filesModified.push(filePath);
        }
      }

      // Capture output
      if (message.type === 'assistant' && message.message) {
        const textBlock = message.message.content.find((b: { type: string }) => b.type === 'text');
        if (textBlock && 'text' in textBlock) {
          result += textBlock.text;
        }
      }
    }

    console.log(`[ai-orchestrator] Agent ${agent.id} completed, files modified: ${filesModified.length}`);
    return { result, filesModified };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[ai-orchestrator] Agent ${agent.id} failed: ${errorMsg}`);
    return { result: '', error: errorMsg };
  }
};

// ============================================================================
// ORCHESTRATOR SYSTEM PROMPT
// ============================================================================

function buildOrchestratorPrompt(
  userPrompt: string,
  projectId: string,
  projectPath: string,
  config: WhiteLabelConfig,
  templateContext?: TemplateContext
): string {
  // Get agent catalog
  const agentCatalog = agentRegistry.generateCatalog();

  return `You are the Mobigen AI Orchestrator - a master coordinator for generating mobile apps.

## YOUR ROLE
You coordinate the app generation workflow by delegating tasks to specialized agents.
You decide which agents to invoke, in what order, and whether to run them in parallel.

## PROJECT INFORMATION
- Project ID: ${projectId}
- Project Path: ${projectPath}
- App Name: ${config.appName}
- Bundle ID (iOS): ${config.bundleId.ios}
- Bundle ID (Android): ${config.bundleId.android}
- Primary Color: ${config.branding.primaryColor}
- Secondary Color: ${config.branding.secondaryColor}

## USER REQUEST
${userPrompt}

## AVAILABLE AGENTS
${agentCatalog}

## TEMPLATE CONTEXT
${templateContext ? `
The project is based on a template that already provides:
- ${templateContext.screens.length} screens
- ${templateContext.components.length} components
- ${templateContext.hooks.length} hooks
- ${templateContext.types.length} types
- ${templateContext.services.length} services

Focus on MODIFICATIONS and ADDITIONS needed beyond the template.
` : 'No template context available - starting from scratch.'}

## YOUR TASK TOOL
Use the Task tool to spawn agents. You can:
1. Run agents sequentially by waiting for each to complete
2. Run agents in parallel by setting run_in_background=true
3. Wait for background agents with TaskOutput

## WORKFLOW GUIDELINES
1. **Analysis Phase**: Start with intent-analyzer to understand requirements
2. **Planning Phase**: Use product-manager for PRD, technical-architect for architecture
3. **Design Phase**: Use ui-ux-expert for UI/UX design
4. **Implementation Phase**:
   - Use lead-developer to break down into tasks
   - Use developer for each implementation task (can run in parallel!)
5. **Validation Phase**: Use validator to check code quality
6. **Fix Phase**: If validation fails, use error-fixer (max 3 attempts)
7. **QA Phase**: Use qa for final quality assessment

## PARALLEL EXECUTION RULES
- Run independent agents in parallel when possible (up to 5 concurrent)
- Wait for dependent phases to complete before starting the next
- Example: UI design and architecture can run in parallel after intent analysis

## OUTPUT FORMAT
After completing all phases, provide a summary with:
- Success status
- Files modified
- QA score
- Any issues or recommendations

BEGIN ORCHESTRATING THE APP GENERATION.`;
}

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

export async function generateApp(
  userPrompt: string,
  projectId: string,
  config: WhiteLabelConfig
): Promise<GenerationResult> {
  const projectPath = path.join(PROJECTS_DIR, projectId);

  // Ensure project directory exists
  if (!fs.existsSync(projectPath)) {
    fs.mkdirSync(projectPath, { recursive: true });
    console.log(`[ai-orchestrator] Created project directory: ${projectPath}`);
  }

  // Create logger
  const logger = createLogger(projectId, projectPath);
  logger.info('Starting AI-driven app generation', {
    userPrompt: userPrompt.substring(0, 100) + '...',
    config,
  });

  const result: GenerationResult = {
    files: [],
    logs: [],
    success: false,
  };

  let sessionId: string | undefined;

  await emitProgress(projectId, 'starting', { orchestratorType: 'ai-driven' });

  try {
    // Initialize agent registry
    await agentRegistry.initialize();
    logger.info('Agent registry initialized', {
      agentCount: agentRegistry.list().length,
    });

    // Clone template to project (quick intent analysis first)
    await emitProgress(projectId, 'setup', { phase: 'template-selection' });

    // Use intent-analyzer to select template
    const intentAgent = agentRegistry.get('intent-analyzer');
    if (!intentAgent) {
      throw new Error('intent-analyzer agent not found in registry');
    }

    const intentResult = await executeAgent(
      intentAgent,
      `Quickly analyze this request and select the best template:

USER REQUEST: ${userPrompt}

Available templates: base, ecommerce, loyalty, news, ai-assistant

Output JSON with: { "template": "base", "category": "..." }`,
      { projectPath }
    );

    let selectedTemplate = 'base';
    try {
      const intentJson = JSON.parse(intentResult.result.match(/\{[\s\S]*\}/)?.[0] || '{}');
      selectedTemplate = intentJson.template || 'base';
    } catch {
      logger.warn('Could not parse intent result, using base template');
    }

    logger.info('Template selected', { template: selectedTemplate });

    // Clone template
    await emitProgress(projectId, 'cloning', { template: selectedTemplate });
    const metadata = await templateManager.cloneToProject(
      selectedTemplate,
      projectId,
      {
        appName: config.appName,
        bundleId: config.bundleId.ios,
      }
    );

    // Get template context
    const templateContext = await templateManager.getTemplateContext(selectedTemplate) || undefined;
    logger.info('Template cloned', {
      template: selectedTemplate,
      screens: templateContext?.screens.length || 0,
    });

    // Create Task and TaskOutput tools
    const { taskTool, taskOutputTool } = createTaskTools({
      getAgent: (id: string) => agentRegistry.get(id),
      listAgents: () => agentRegistry.list(),
      executeAgent,
      executionManager,
    });

    // Build orchestrator prompt
    const orchestratorPrompt = buildOrchestratorPrompt(
      userPrompt,
      projectId,
      projectPath,
      config,
      templateContext
    );

    // Create QA hooks
    const qaHooks = createQAHooks(projectId);

    // Run AI orchestrator
    await emitProgress(projectId, 'orchestrating', { phase: 'ai-driven' });
    logger.info('Starting AI orchestrator loop');

    for await (const message of query({
      prompt: orchestratorPrompt,
      options: {
        model: 'opus', // Use Opus for orchestrator (most capable)
        systemPrompt: `You are the Mobigen AI Orchestrator. You coordinate app generation by delegating to specialized agents using the Task tool.`,
        cwd: MOBIGEN_ROOT,
        permissionMode: 'acceptEdits',
        maxTurns: 100, // Allow many turns for complex orchestration
        customTools: {
          Task: {
            schema: taskTool.definition.input_schema,
            handler: taskTool.handler,
            description: taskTool.definition.description,
          },
          TaskOutput: {
            schema: taskOutputTool.definition.input_schema,
            handler: taskOutputTool.handler,
            description: taskOutputTool.definition.description,
          },
        },
        hooks: qaHooks,
      },
    })) {
      // Capture session ID
      if (message.type === 'system' && message.subtype === 'init') {
        sessionId = message.session_id;
        logger.info('Session started', { sessionId: sessionId?.substring(0, 20) + '...' });
      }

      // Track file changes from tool executions
      if (message.type === 'tool') {
        if (message.tool_name === 'Write' || message.tool_name === 'Edit') {
          const filePath = message.tool_input?.file_path as string;
          if (filePath && !result.files.includes(filePath)) {
            result.files.push(filePath);
          }
        }

        // Track files from Task tool results
        if (message.tool_name === 'Task' && message.tool_result?.success) {
          const taskOutput = message.tool_result.output as Record<string, unknown>;
          const filesModified = taskOutput?.files_modified as string[];
          if (filesModified) {
            for (const file of filesModified) {
              if (!result.files.includes(file)) {
                result.files.push(file);
              }
            }
          }
        }
      }

      // Emit progress
      await emitProgress(projectId, 'orchestrator', message);
      result.logs.push(message as SDKMessage);
    }

    // Count actual files if tracking didn't work
    const actualFileCount = await countProjectFiles(projectPath);
    if (actualFileCount > 0 && result.files.length === 0) {
      result.files = await listProjectFiles(projectPath);
    }

    // Determine success using multiple signals
    const successSignals = evaluateSuccess(result.logs, result.files, actualFileCount, logger);
    result.success = successSignals.isSuccess;
    result.sessionId = sessionId;

    if (result.success) {
      logger.success('AI orchestration completed successfully!');
      logger.info('Success signals', successSignals);
    } else {
      result.requiresReview = true;
      logger.warn('AI orchestration completed with issues');
      logger.info('Success signals', successSignals);
      await flagForHumanReview(projectId, result.logs);
    }

    logger.printSummary({
      success: result.success,
      files: result.files,
      requiresReview: result.requiresReview,
    });

    await emitProgress(projectId, 'complete', {
      success: result.success,
      filesGenerated: result.files.length,
      template: selectedTemplate,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error('AI orchestration failed', { error: errorMessage });
    console.error(`[ai-orchestrator] Failed:`, errorMessage);

    if (errorStack) {
      console.error(`[ai-orchestrator] Stack:`, errorStack);
      logger.error('Stack trace', { stack: errorStack });
    }

    result.success = false;
    result.requiresReview = true;

    logger.printSummary({
      success: false,
      files: result.files,
      requiresReview: true,
    });

    await emitProgress(projectId, 'error', { error: errorMessage });
    await flagForHumanReview(projectId, result.logs);
  }

  return result;
}

// Export for external use
export {
  templateManager,
  agentRegistry,
  executionManager,
  executeAgent,
  PROJECTS_DIR,
  MOBIGEN_ROOT,
};
