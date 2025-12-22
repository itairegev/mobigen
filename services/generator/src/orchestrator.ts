import { query } from '@anthropic-ai/claude-agent-sdk';
import { mobigenAgents, generationPipeline, agentModelConfig } from '@mobigen/ai';
import type {
  WhiteLabelConfig,
  GenerationResult,
  SDKMessage,
  AgentRole,
  PRDOutput,
  ArchitectureOutput,
  UIDesignOutput,
  TaskBreakdown,
  ValidationResult,
  QAReport,
} from '@mobigen/ai';
import { TemplateManager, type ProjectMetadata, type TemplateContext } from '@mobigen/storage';
import { emitProgress } from './api';
import { flagForHumanReview } from './session-manager';
import { createQAHooks } from './hooks/index';
import { createLogger, type GenerationLogger } from './logger';
import * as path from 'path';
import * as fs from 'fs';

// Configuration for paths
const MOBIGEN_ROOT = process.env.MOBIGEN_ROOT || process.cwd();
const TEMPLATES_BARE_DIR = path.join(MOBIGEN_ROOT, 'templates-bare');
const TEMPLATES_WORKING_DIR = path.join(MOBIGEN_ROOT, 'templates');
const PROJECTS_DIR = path.join(MOBIGEN_ROOT, 'projects');

// Initialize template manager
const templateManager = new TemplateManager({
  bareRepoDir: TEMPLATES_BARE_DIR,
  workingCopyDir: TEMPLATES_WORKING_DIR,
  projectsDir: PROJECTS_DIR,
});

// Phase execution context passed between agents
interface PipelineContext {
  userPrompt: string;
  projectId: string;
  projectPath: string;
  config: WhiteLabelConfig;
  sessionId?: string;
  metadata?: ProjectMetadata;
  generationVersion: number;

  // Template context - what the template already provides
  templateContext?: TemplateContext;

  // Outputs from each phase
  intent?: {
    category: string;
    template: string;
    appName: string;
    features: string[];
    complexity: 'low' | 'medium' | 'high';
  };
  prd?: PRDOutput;
  architecture?: ArchitectureOutput;
  uiDesign?: UIDesignOutput;
  taskBreakdown?: TaskBreakdown;
  validation?: ValidationResult;
  qaReport?: QAReport;
}

// Helper to format template context for agent prompts
function formatTemplateContext(ctx: TemplateContext): string {
  const sections: string[] = [];

  sections.push(`TEMPLATE: ${ctx.name} (${ctx.category})`);
  sections.push(`DESCRIPTION: ${ctx.description}`);
  sections.push(`FEATURES: ${ctx.features.join(', ')}`);

  if (ctx.screens.length > 0) {
    sections.push('\nEXISTING SCREENS:');
    for (const screen of ctx.screens) {
      sections.push(`  - ${screen.name} (${screen.path})`);
      if (screen.components.length > 0) {
        sections.push(`    Uses: ${screen.components.join(', ')}`);
      }
    }
  }

  if (ctx.components.length > 0) {
    sections.push('\nEXISTING COMPONENTS:');
    for (const comp of ctx.components) {
      const propsStr = comp.props ? ` [props: ${comp.props.join(', ')}]` : '';
      sections.push(`  - ${comp.name}${propsStr}`);
    }
  }

  if (ctx.hooks.length > 0) {
    sections.push('\nEXISTING HOOKS:');
    for (const hook of ctx.hooks) {
      const returnsStr = hook.returns ? ` -> { ${hook.returns.join(', ')} }` : '';
      sections.push(`  - ${hook.name}${returnsStr}`);
    }
  }

  if (ctx.types.length > 0) {
    sections.push('\nEXISTING TYPES:');
    for (const type of ctx.types) {
      const fieldsStr = type.fields ? ` { ${type.fields.join(', ')} }` : '';
      sections.push(`  - ${type.name}${fieldsStr}`);
    }
  }

  if (ctx.services.length > 0) {
    sections.push('\nEXISTING SERVICES:');
    for (const svc of ctx.services) {
      const methodsStr = svc.methods ? `: ${svc.methods.join(', ')}` : '';
      sections.push(`  - ${svc.name}${methodsStr}`);
    }
  }

  sections.push('\nINSTALLED DEPENDENCIES:');
  const deps = Object.entries(ctx.dependencies).slice(0, 15);
  sections.push(`  ${deps.map(([k, v]) => `${k}@${v}`).join(', ')}`);

  return sections.join('\n');
}

// Helper to run a single agent
async function runAgent(
  role: AgentRole,
  prompt: string,
  context: PipelineContext,
  result: GenerationResult,
  options: {
    allowedTools?: string[];
    permissionMode?: 'acceptEdits' | 'plan' | 'bypassPermissions';
    hooks?: unknown;
  } = {}
): Promise<string> {
  const agent = mobigenAgents[role];
  const model = agentModelConfig[role];
  let output = '';
  let messageCount = 0;

  console.log(`[orchestrator] ┌─────────────────────────────────────────────`);
  console.log(`[orchestrator] │ Agent: ${role}`);
  console.log(`[orchestrator] │ Model: ${model}`);
  console.log(`[orchestrator] │ Prompt length: ${prompt.length} chars`);
  console.log(`[orchestrator] │ Has session ID: ${!!context.sessionId}`);
  console.log(`[orchestrator] └─────────────────────────────────────────────`);
  const startTime = Date.now();

  try {
    console.log(`[orchestrator] Calling query() for ${role}...`);
    for await (const message of query({
      prompt,
      options: {
        resume: context.sessionId,
        agents: { [role]: agent },
        allowedTools: options.allowedTools || agent.tools,
        permissionMode: options.permissionMode,
        hooks: options.hooks,
        model,
        systemPrompt: `You are ${agent.description}
Working directory: ${MOBIGEN_ROOT}
Project directory: ${context.projectPath}
${agent.prompt}`,
        cwd: MOBIGEN_ROOT,
      },
    })) {
      messageCount++;
      console.log(`[orchestrator] ${role} message #${messageCount}: type=${message.type}, subtype=${message.subtype || 'N/A'}`);

      // Capture session ID
      if (message.type === 'system' && message.subtype === 'init' && !context.sessionId) {
        context.sessionId = message.session_id;
        console.log(`[orchestrator] Captured session ID: ${message.session_id?.substring(0, 20)}...`);
      }

      // Track file changes
      if (message.type === 'tool' && (message.tool_name === 'Write' || message.tool_name === 'Edit')) {
        const filePath = message.tool_input?.file_path as string;
        if (filePath && !result.files.includes(filePath)) {
          result.files.push(filePath);
        }
      }

      // Capture output from assistant messages
      if (message.type === 'assistant' && message.message) {
        const textBlock = message.message.content.find((b: { type: string }) => b.type === 'text');
        if (textBlock && 'text' in textBlock) {
          output += textBlock.text;
        }
      }

      await emitProgress(context.projectId, role, message);
      result.logs.push(message as SDKMessage);
    }

    const elapsed = Date.now() - startTime;
    console.log(`[orchestrator] ✓ Agent ${role} completed: ${messageCount} messages, ${elapsed}ms, output: ${output.length} chars`);
  } catch (error) {
    const elapsed = Date.now() - startTime;
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[orchestrator] Agent ${role} failed after ${elapsed}ms: ${errMsg}`);

    // Emit error event for this agent
    await emitProgress(context.projectId, role, {
      type: 'error',
      error: errMsg,
      agent: role,
      duration: elapsed,
    });

    // Also emit a general error event
    await emitProgress(context.projectId, 'error', {
      error: `Agent ${role} failed: ${errMsg}`,
      agent: role,
    });

    // Re-throw to let orchestrator handle it
    throw error;
  }

  return output;
}

// Parse JSON from agent output
function parseJSON<T>(output: string, fallback: T): T {
  try {
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T;
    }
  } catch {
    console.error('Failed to parse agent output as JSON');
  }
  return fallback;
}

// Commit changes after a phase
async function commitPhase(
  context: PipelineContext,
  phase: string,
  agent: AgentRole
): Promise<string> {
  try {
    const commitHash = await templateManager.recordGeneration(context.projectId, {
      version: context.generationVersion,
      prompt: context.userPrompt,
      phase,
      agent,
    });
    return commitHash;
  } catch (error) {
    console.error(`Failed to commit phase ${phase}:`, error);
    return '';
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN ORCHESTRATOR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function generateApp(
  userPrompt: string,
  projectId: string,
  config: WhiteLabelConfig
): Promise<GenerationResult> {
  const projectPath = path.join(PROJECTS_DIR, projectId);

  // Ensure project directory exists before creating logger
  if (!fs.existsSync(projectPath)) {
    fs.mkdirSync(projectPath, { recursive: true });
    console.log(`[orchestrator] Created project directory: ${projectPath}`);
  }

  // Create logger for this generation run
  const logger = createLogger(projectId, projectPath);
  logger.info('Starting app generation', { userPrompt: userPrompt.substring(0, 100) + '...', config });

  const context: PipelineContext = {
    userPrompt,
    projectId,
    projectPath,
    config,
    generationVersion: 1,
  };

  const result: GenerationResult = {
    files: [],
    logs: [],
    success: false,
  };

  await emitProgress(projectId, 'starting', { phases: generationPipeline.phases.length });

  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 0: PROJECT SETUP (Clone template)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    logger.phaseStart('setup', 'Project Setup & Template Selection');
    await emitProgress(projectId, 'phase', { phase: 'setup', index: 0 });

    // First, do quick intent analysis to select template
    logger.agentStart('intent-analyzer', 'setup');
    const quickIntentOutput = await runAgent(
      'intent-analyzer',
      `Quickly analyze this request and select the best template:

USER REQUEST: ${userPrompt}

Available templates: base, ecommerce, loyalty, news, ai-assistant

Output JSON with just: { "template": "base", "category": "..." }`,
      context,
      result
    );

    logger.agentEnd('intent-analyzer', true, 'setup');
    const quickIntent = parseJSON(quickIntentOutput, { template: 'base', category: 'custom' });
    const selectedTemplate = quickIntent.template || 'base';
    logger.info('Template selected', { template: selectedTemplate, category: quickIntent.category });

    // Clone template to create project
    await emitProgress(projectId, 'cloning', { template: selectedTemplate });
    logger.info('Cloning template to project', { template: selectedTemplate, projectPath });

    context.metadata = await templateManager.cloneToProject(
      selectedTemplate,
      projectId,
      {
        appName: config.appName,
        bundleId: config.bundleId.ios,
      }
    );

    // Check if this is a subsequent generation (project already exists)
    const existingMetadata = await templateManager.getProjectMetadata(projectId);
    if (existingMetadata) {
      context.generationVersion = existingMetadata.generationHistory.length + 1;
    }

    // Get template context - what the template already provides
    context.templateContext = await templateManager.getTemplateContext(selectedTemplate) || undefined;
    await emitProgress(projectId, 'template-context', {
      template: selectedTemplate,
      screens: context.templateContext?.screens.length || 0,
      components: context.templateContext?.components.length || 0,
      hooks: context.templateContext?.hooks.length || 0,
    });
    logger.info('Template context loaded', {
      screens: context.templateContext?.screens.length || 0,
      components: context.templateContext?.components.length || 0,
      hooks: context.templateContext?.hooks.length || 0,
      types: context.templateContext?.types.length || 0,
    });
    logger.phaseEnd('setup', true);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 1: INTENT ANALYSIS (detailed)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    logger.phaseStart('intent-analysis', 'Detailed Intent Analysis');
    await emitProgress(projectId, 'phase', { phase: 'analysis', index: 1 });

    // Format template context for intent analysis
    const templateCtxForIntent = context.templateContext
      ? `\n\nSELECTED TEMPLATE PROVIDES:
${formatTemplateContext(context.templateContext)}

Analyze what ADDITIONAL features are needed beyond what the template provides.`
      : '';

    logger.agentStart('intent-analyzer', 'intent-analysis');
    const intentOutput = await runAgent(
      'intent-analyzer',
      `Analyze this mobile app request in detail:

USER REQUEST: ${userPrompt}

APP CONFIG:
- App Name: ${config.appName}
- Display Name: ${config.branding.displayName}
- Primary Color: ${config.branding.primaryColor}
- Secondary Color: ${config.branding.secondaryColor}

SELECTED TEMPLATE: ${selectedTemplate}
${templateCtxForIntent}

Provide detailed analysis with:
- Features the template already provides (from template context)
- ADDITIONAL features that need to be built
- Customizations needed to existing template features
- Complexity assessment based on what needs to be ADDED (not total app complexity)`,
      context,
      result
    );

    logger.agentEnd('intent-analyzer', true, 'intent-analysis');
    logger.agentOutput('intent-analyzer', intentOutput, 'intent-analysis');

    context.intent = parseJSON(intentOutput, {
      category: quickIntent.category || 'custom',
      template: selectedTemplate,
      appName: config.appName,
      features: [],
      complexity: 'medium' as const,
    });

    // Save intent analysis artifact
    logger.saveArtifact('intent-analysis', context.intent, 'json');
    logger.info('Intent analysis complete', {
      category: context.intent.category,
      features: context.intent.features.length,
      complexity: context.intent.complexity,
    });
    logger.phaseEnd('intent-analysis', true);

    console.log('[orchestrator] ════════════════════════════════════════════════════');
    console.log('[orchestrator] TRANSITIONING FROM PHASE 1 TO PHASE 2');
    console.log('[orchestrator] ════════════════════════════════════════════════════');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 2: PRODUCT MANAGEMENT
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    console.log('[orchestrator] Starting Phase 2: Product Management');
    logger.phaseStart('product-definition', 'Product Requirements Document');
    await emitProgress(projectId, 'phase', { phase: 'product-definition', index: 2 });

    // Format template context for PRD
    const templateCtxForPRD = context.templateContext
      ? `\n\nTEMPLATE ALREADY PROVIDES:
${formatTemplateContext(context.templateContext)}

IMPORTANT: The template already has working screens, components, hooks, and types.
Focus your PRD on what ADDITIONAL features and customizations are needed beyond what the template provides.
Do NOT re-specify features that already exist in the template.`
      : '';

    console.log('[orchestrator] About to call product-manager agent...');
    logger.agentStart('product-manager', 'product-definition');
    const prdOutput = await runAgent(
      'product-manager',
      `Create a Product Requirements Document based on this analysis:

INTENT ANALYSIS:
${JSON.stringify(context.intent, null, 2)}

ORIGINAL REQUEST: ${userPrompt}

APP INFO:
- Name: ${config.appName}
- Target platforms: iOS and Android
${templateCtxForPRD}

Create a PRD that focuses on ADDITIONAL features and customizations needed.
Identify what the template already provides vs. what needs to be built.`,
      context,
      result
    );

    console.log('[orchestrator] product-manager agent completed, output length:', prdOutput.length);
    logger.agentEnd('product-manager', true, 'product-definition');
    logger.agentOutput('product-manager', prdOutput, 'product-definition');

    context.prd = parseJSON(prdOutput, {
      appName: config.appName,
      description: userPrompt,
      targetUsers: [],
      coreFeatures: [],
      userStories: [],
      acceptanceCriteria: [],
      constraints: [],
      successMetrics: [],
    });
    result.prd = context.prd;

    // Save PRD artifact
    logger.savePRD(context.prd);
    logger.info('PRD generated', {
      features: context.prd.coreFeatures.length,
      userStories: context.prd.userStories.length,
    });

    // Commit PRD phase
    await commitPhase(context, 'product-definition', 'product-manager');
    logger.phaseEnd('product-definition', true);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 3: TECHNICAL ARCHITECTURE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    logger.phaseStart('architecture', 'Technical Architecture Design');
    await emitProgress(projectId, 'phase', { phase: 'architecture', index: 3 });

    // Format template context for Architecture
    const templateCtxForArch = context.templateContext
      ? `\n\nTEMPLATE ALREADY PROVIDES:
${formatTemplateContext(context.templateContext)}

IMPORTANT: Build on top of the existing template architecture.
- Reuse existing types and extend them if needed
- Add new hooks that follow the same patterns
- Add new components that match the existing style
- Only add dependencies that aren't already installed`
      : '';

    logger.agentStart('technical-architect', 'architecture');
    const archOutput = await runAgent(
      'technical-architect',
      `Design the technical architecture based on this PRD:

PRD:
${JSON.stringify(context.prd, null, 2)}

TEMPLATE: ${context.intent?.template || 'base'}
PROJECT PATH: ${context.projectPath}
${templateCtxForArch}

Design ADDITIONAL data models, API endpoints, and dependencies needed.
Extend existing types rather than recreating them.
Follow the patterns already established in the template.`,
      context,
      result
    );

    logger.agentEnd('technical-architect', true, 'architecture');
    logger.agentOutput('technical-architect', archOutput, 'architecture');

    context.architecture = parseJSON(archOutput, {
      template: context.intent?.template || 'base',
      templateReason: '',
      techStack: [],
      dataModels: [],
      apiEndpoints: [],
      fileStructure: [],
      dependencies: [],
      securityConsiderations: [],
    });
    result.architecture = context.architecture;

    // Save architecture artifact
    logger.saveArchitecture(context.architecture);
    logger.info('Architecture designed', {
      dataModels: context.architecture.dataModels.length,
      apiEndpoints: context.architecture.apiEndpoints.length,
      dependencies: context.architecture.dependencies.length,
    });

    // Commit architecture phase
    await commitPhase(context, 'architecture', 'technical-architect');
    logger.phaseEnd('architecture', true);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 4: UI/UX DESIGN
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    logger.phaseStart('ui-design', 'UI/UX Design System');
    await emitProgress(projectId, 'phase', { phase: 'ui-design', index: 4 });

    // Format template context for UI/UX
    const templateCtxForUI = context.templateContext
      ? `\n\nTEMPLATE ALREADY PROVIDES:
${formatTemplateContext(context.templateContext)}

IMPORTANT: The template already has a working design system.
- Keep existing color patterns and extend with branding colors
- Reuse existing components where possible
- Only design NEW components that don't already exist
- Maintain visual consistency with existing screens`
      : '';

    logger.agentStart('ui-ux-expert', 'ui-design');
    const uiOutput = await runAgent(
      'ui-ux-expert',
      `Create the UI/UX design system:

PRD:
${JSON.stringify(context.prd, null, 2)}

ARCHITECTURE:
${JSON.stringify(context.architecture, null, 2)}

BRANDING:
- Primary Color: ${config.branding.primaryColor}
- Secondary Color: ${config.branding.secondaryColor}
- Display Name: ${config.branding.displayName}

PROJECT PATH: ${context.projectPath}
${templateCtxForUI}

Extend the existing design system with branding customizations.
Design only NEW screens and components not already in the template.
Use NativeWind/Tailwind patterns consistent with existing code.`,
      context,
      result
    );

    logger.agentEnd('ui-ux-expert', true, 'ui-design');
    logger.agentOutput('ui-ux-expert', uiOutput, 'ui-design');

    // Default color scale for fallback
    const defaultColorScale = {
      50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db', 400: '#9ca3af',
      500: '#6b7280', 600: '#4b5563', 700: '#374151', 800: '#1f2937', 900: '#111827',
    };

    context.uiDesign = parseJSON(uiOutput, {
      colorPalette: {
        primary: { ...defaultColorScale },
        secondary: { ...defaultColorScale },
        neutral: { ...defaultColorScale },
        semantic: { success: '#10b981', warning: '#f59e0b', error: '#ef4444', info: '#3b82f6' },
      },
      typography: {
        fontFamily: { heading: 'System', body: 'System', mono: 'Courier' },
        sizes: {},
        weights: {},
      },
      components: [],
      screens: [],
      navigationFlow: { type: 'stack' as const, routes: [], deepLinks: [] },
      animations: [],
      accessibilityNotes: [],
    });
    result.uiDesign = context.uiDesign;

    // Save UI design artifact
    logger.saveUIDesign(context.uiDesign);
    logger.info('UI design complete', {
      screens: context.uiDesign.screens.length,
      components: context.uiDesign.components.length,
    });

    // Commit UI design phase
    await commitPhase(context, 'ui-design', 'ui-ux-expert');
    logger.phaseEnd('ui-design', true);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 5: TASK PLANNING
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    logger.phaseStart('planning', 'Task Planning & Breakdown');
    await emitProgress(projectId, 'phase', { phase: 'planning', index: 5 });

    // Format template context for Lead Developer
    const templateCtxForLead = context.templateContext
      ? `\n\nTEMPLATE ALREADY PROVIDES:
${formatTemplateContext(context.templateContext)}

IMPORTANT: The template is already a working app.
- Do NOT create tasks for existing screens/components/hooks
- Focus tasks on MODIFICATIONS and ADDITIONS only
- Tasks should extend existing files, not recreate them
- Use existing patterns for new code`
      : '';

    logger.agentStart('lead-developer', 'planning');
    const taskOutput = await runAgent(
      'lead-developer',
      `Break down the implementation into development tasks:

ARCHITECTURE:
${JSON.stringify(context.architecture, null, 2)}

UI DESIGN:
${JSON.stringify(context.uiDesign, null, 2)}

PROJECT PATH: ${context.projectPath}
${templateCtxForLead}

Create tasks for MODIFICATIONS and NEW features only.
Do not create tasks for functionality that already exists.
Each task should specify whether it's modifying or creating a file.`,
      context,
      result
    );

    logger.agentEnd('lead-developer', true, 'planning');
    logger.agentOutput('lead-developer', taskOutput, 'planning');

    context.taskBreakdown = parseJSON(taskOutput, {
      tasks: [],
      estimatedComplexity: 'medium' as const,
      criticalPath: [],
      parallelizableTasks: [],
    });
    result.taskBreakdown = context.taskBreakdown;

    // Save task breakdown artifact
    logger.saveTaskBreakdown(context.taskBreakdown);
    logger.info('Task breakdown complete', {
      tasks: context.taskBreakdown.tasks.length,
      complexity: context.taskBreakdown.estimatedComplexity,
      criticalPath: context.taskBreakdown.criticalPath.length,
    });
    logger.phaseEnd('planning', true);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 6: IMPLEMENTATION
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    logger.phaseStart('implementation', 'Code Implementation');
    await emitProgress(projectId, 'phase', { phase: 'implementation', index: 6 });

    const qaHooks = createQAHooks(projectId);
    const tasks = context.taskBreakdown?.tasks || [];

    // Sort tasks by priority and dependencies
    const sortedTasks = [...tasks].sort((a, b) => a.priority - b.priority);
    logger.info('Starting implementation', { totalTasks: sortedTasks.length });

    // Execute tasks sequentially (respecting dependencies)
    for (let i = 0; i < sortedTasks.length; i++) {
      const task = sortedTasks[i];
      await emitProgress(projectId, 'task', {
        taskId: task.id,
        title: task.title,
        index: i + 1,
        total: sortedTasks.length
      });

      logger.info(`Task ${i + 1}/${sortedTasks.length}: ${task.title}`, {
        taskId: task.id,
        type: task.type,
        files: task.files,
      });
      logger.agentStart('developer', 'implementation');

      await runAgent(
        'developer',
        `Implement this development task:

TASK: ${task.title}
DESCRIPTION: ${task.description}
TYPE: ${task.type}
FILES: ${task.files.join(', ')}

ACCEPTANCE CRITERIA:
${task.acceptanceCriteria.map((c, j) => `${j + 1}. ${c}`).join('\n')}

CONTEXT:
- Template: ${context.architecture?.template || 'base'}
- Project path: ${context.projectPath}

Implement the task following React Native + Expo patterns.`,
        context,
        result,
        {
          allowedTools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'],
          permissionMode: 'acceptEdits',
          hooks: qaHooks,
        }
      );

      logger.agentEnd('developer', true, 'implementation');
      logger.success(`Task completed: ${task.title}`);

      // Commit after each task
      await commitPhase(context, `task-${task.id}`, 'developer');
    }

    logger.info('Implementation complete', { filesModified: result.files.length });
    logger.phaseEnd('implementation', true);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 7: VALIDATION (with retry loop)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    logger.phaseStart('validation', 'Code Validation');
    await emitProgress(projectId, 'phase', { phase: 'validation', index: 7 });

    let validationPassed = false;
    let attempts = 0;

    while (!validationPassed && attempts < generationPipeline.maxRetries) {
      attempts++;
      logger.info(`Validation attempt ${attempts}/${generationPipeline.maxRetries}`);
      await emitProgress(projectId, 'validation-attempt', { attempt: attempts });

      // Run validator
      logger.agentStart('validator', 'validation');
      const validationOutput = await runAgent(
        'validator',
        `Validate the generated app in ${context.projectPath}

Run all validation tiers:
- Tier 1: TypeScript, ESLint, Prettier
- Tier 2: Expo prebuild, Metro bundle
- Tier 3: Unit tests, E2E tests

Report structured validation result.`,
        context,
        result,
        { allowedTools: ['Bash', 'Read', 'Grep'] }
      );

      logger.agentEnd('validator', true, 'validation');
      logger.agentOutput('validator', validationOutput, 'validation');

      context.validation = parseJSON(validationOutput, {
        passed: false,
        tier: 'tier1' as const,
        stages: {},
        summary: 'Validation not completed',
      });

      validationPassed = context.validation.passed;

      if (validationPassed) {
        logger.success('Validation passed');
      } else {
        logger.warn('Validation failed', {
          stages: Object.keys(context.validation.stages || {}),
          summary: context.validation.summary,
        });
      }

      // If failed, run error-fixer
      if (!validationPassed && attempts < generationPipeline.maxRetries) {
        logger.info('Running error-fixer agent');
        await emitProgress(projectId, 'fixing', { attempt: attempts });

        const errors = Object.values(context.validation.stages || {})
          .flatMap(stage => stage.errors || []);

        logger.agentStart('error-fixer', 'validation');
        await runAgent(
          'error-fixer',
          `Fix these validation errors:

${JSON.stringify(errors, null, 2)}

Apply minimal fixes to resolve each error.
Project path: ${context.projectPath}`,
          context,
          result,
          {
            allowedTools: ['Read', 'Edit', 'Bash', 'Grep'],
            permissionMode: 'acceptEdits',
          }
        );

        logger.agentEnd('error-fixer', true, 'validation');
        logger.info('Error fixes applied');

        // Commit fixes
        await commitPhase(context, `error-fix-attempt-${attempts}`, 'error-fixer');
      }
    }

    result.validation = context.validation;

    // Save validation result artifact
    logger.saveValidation(context.validation);
    logger.info('Validation complete', { passed: validationPassed, attempts });

    // Commit validation phase
    await commitPhase(context, 'validation', 'validator');
    logger.phaseEnd('validation', validationPassed);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 8: QA ASSESSMENT
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    logger.phaseStart('qa', 'Quality Assurance');
    await emitProgress(projectId, 'phase', { phase: 'quality-assurance', index: 8 });

    logger.agentStart('qa', 'qa');
    const qaOutput = await runAgent(
      'qa',
      `Perform final quality assessment of the app in ${context.projectPath}

Evaluate:
- Code quality (25%)
- UI/UX quality (25%)
- Accessibility (15%)
- Performance (15%)
- Security (10%)
- Testing (10%)

Provide overall score and production readiness assessment.`,
      context,
      result,
      { allowedTools: ['Read', 'Grep', 'Glob', 'Bash'] }
    );

    logger.agentEnd('qa', true, 'qa');
    logger.agentOutput('qa', qaOutput, 'qa');

    context.qaReport = parseJSON(qaOutput, {
      overallScore: 0,
      categories: [],
      recommendations: [],
      readyForProduction: false,
      blockers: [],
    });
    result.qaReport = context.qaReport;

    // Save QA report artifact
    logger.saveQAReport(context.qaReport);
    logger.info('QA assessment complete', {
      overallScore: context.qaReport.overallScore,
      readyForProduction: context.qaReport.readyForProduction,
      blockers: context.qaReport.blockers.length,
    });

    // Commit QA phase
    await commitPhase(context, 'quality-assurance', 'qa');
    logger.phaseEnd('qa', context.qaReport.readyForProduction);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // FINALIZE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    result.success = validationPassed && (context.qaReport?.readyForProduction || false);
    result.sessionId = context.sessionId;

    if (!result.success) {
      result.requiresReview = true;
      logger.warn('Generation requires human review', {
        validationPassed,
        qaScore: context.qaReport?.overallScore,
        readyForProduction: context.qaReport?.readyForProduction,
      });
      await flagForHumanReview(projectId, result.logs);
    } else {
      logger.success('Generation completed successfully!');
    }

    // Print final summary
    logger.printSummary({
      success: result.success,
      files: result.files,
      requiresReview: result.requiresReview,
    });

    await emitProgress(projectId, 'complete', {
      success: result.success,
      filesGenerated: result.files.length,
      qaScore: context.qaReport?.overallScore || 0,
      template: context.intent?.template,
      templateVersion: context.metadata?.templateVersion,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error('Pipeline failed', { error: errorMessage });
    console.error(`[orchestrator] Pipeline failed:`, errorMessage);
    if (errorStack) {
      console.error(`[orchestrator] Stack trace:`, errorStack);
      logger.error('Stack trace', { stack: errorStack });
    }

    // Save error artifact
    logger.saveArtifact('pipeline-error', {
      error: errorMessage,
      stack: errorStack,
      projectId,
      timestamp: new Date().toISOString(),
    }, 'json');

    result.success = false;
    result.requiresReview = true;

    // Print error summary
    logger.printSummary({
      success: false,
      files: result.files,
      requiresReview: true,
    });

    await emitProgress(projectId, 'error', { error: errorMessage, stack: errorStack });
    await flagForHumanReview(projectId, result.logs);
  }

  return result;
}

// Export for external use
export { templateManager, runAgent, parseJSON, PROJECTS_DIR };
export type { PipelineContext };
