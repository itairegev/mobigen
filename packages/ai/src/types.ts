// SDKMessage type from Claude Agent SDK
export type SDKMessage = {
  type: 'system' | 'assistant' | 'tool' | 'result';
  subtype?: 'init';
  session_id?: string;
  message?: { content: Array<{ type: string; text?: string }> };
  tool_name?: string;
  tool_input?: Record<string, unknown>;
};

// Agent role in the hierarchy
export type AgentRole =
  | 'orchestrator'
  | 'product-manager'
  | 'technical-architect'
  | 'ui-ux-expert'
  | 'lead-developer'
  | 'developer'
  | 'intent-analyzer'
  | 'validator'
  | 'error-fixer'
  | 'qa';

// AgentDefinition type
export type AgentDefinition = {
  role: AgentRole;
  description: string;
  prompt: string;
  tools?: string[];
  model?: 'sonnet' | 'opus' | 'haiku' | 'inherit';
  canDelegate?: AgentRole[]; // Agents this agent can delegate to
  outputSchema?: Record<string, unknown>; // Expected output format
};

// Pipeline phase definition
export type PipelinePhase = {
  name: string;
  agents: AgentRole[];
  description: string;
  required: boolean;
};

// Generation pipeline configuration
export interface PipelineConfig {
  phases: PipelinePhase[];
  maxRetries: number;
  parallelExecution: boolean;
}

// Agent output types
export interface PRDOutput {
  appName: string;
  description: string;
  targetUsers: string[];
  coreFeatures: Feature[];
  userStories: UserStory[];
  acceptanceCriteria: string[];
  constraints: string[];
  successMetrics: string[];
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  priority: 'must-have' | 'should-have' | 'nice-to-have';
  complexity: 'low' | 'medium' | 'high';
}

export interface UserStory {
  id: string;
  persona: string;
  action: string;
  benefit: string;
  acceptanceCriteria: string[];
}

export interface ArchitectureOutput {
  template: string;
  templateReason: string;
  techStack: TechStackDecision[];
  dataModels: DataModel[];
  apiEndpoints: APIEndpoint[];
  fileStructure: FileStructureNode[];
  dependencies: DependencyDecision[];
  securityConsiderations: string[];
}

export interface TechStackDecision {
  category: string;
  choice: string;
  reason: string;
  alternatives: string[];
}

export interface DataModel {
  name: string;
  fields: { name: string; type: string; required: boolean }[];
  relationships: { target: string; type: 'one-to-one' | 'one-to-many' | 'many-to-many' }[];
}

export interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  auth: boolean;
}

export interface FileStructureNode {
  path: string;
  type: 'file' | 'directory';
  purpose: string;
  children?: FileStructureNode[];
}

export interface DependencyDecision {
  package: string;
  version: string;
  reason: string;
  category: 'core' | 'ui' | 'state' | 'networking' | 'storage' | 'testing' | 'dev';
}

export interface UIDesignOutput {
  colorPalette: ColorPalette;
  typography: TypographySpec;
  components: ComponentSpec[];
  screens: ScreenSpec[];
  navigationFlow: NavigationSpec;
  animations: AnimationSpec[];
  accessibilityNotes: string[];
}

export interface ColorPalette {
  primary: ColorScale;
  secondary: ColorScale;
  neutral: ColorScale;
  semantic: { success: string; warning: string; error: string; info: string };
}

export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface TypographySpec {
  fontFamily: { heading: string; body: string; mono: string };
  sizes: Record<string, { size: number; lineHeight: number }>;
  weights: Record<string, number>;
}

export interface ComponentSpec {
  name: string;
  description: string;
  variants: string[];
  props: { name: string; type: string; required: boolean; default?: unknown }[];
  testId: string;
}

export interface ScreenSpec {
  name: string;
  route: string;
  components: string[];
  layout: string;
  interactions: string[];
}

export interface NavigationSpec {
  type: 'stack' | 'tabs' | 'drawer' | 'mixed';
  routes: { name: string; screen: string; icon?: string }[];
  deepLinks: { path: string; screen: string }[];
}

export interface AnimationSpec {
  name: string;
  trigger: string;
  type: 'transition' | 'gesture' | 'loading';
  duration: number;
}

export interface TaskBreakdown {
  tasks: DevelopmentTask[];
  estimatedComplexity: 'low' | 'medium' | 'high';
  criticalPath: string[];
  parallelizableTasks: string[][];
}

export interface DevelopmentTask {
  id: string;
  title: string;
  description: string;
  type: 'feature' | 'component' | 'service' | 'config' | 'test';
  priority: number;
  dependencies: string[];
  files: string[];
  acceptanceCriteria: string[];
  assignedTo?: AgentRole;
}

export interface ValidationResult {
  passed: boolean;
  tier: 'tier1' | 'tier2' | 'tier3';
  stages: Record<string, { passed: boolean; errors: ValidationError[] }>;
  summary: string;
}

export interface ValidationError {
  file: string;
  line?: number;
  column?: number;
  message: string;
  severity: 'error' | 'warning';
  rule?: string;
  fixSuggestion?: string;
}

export interface QAReport {
  overallScore: number;
  categories: QACategory[];
  recommendations: string[];
  readyForProduction: boolean;
  blockers: string[];
}

export interface QACategory {
  name: string;
  score: number;
  findings: QAFinding[];
}

export interface QAFinding {
  severity: 'critical' | 'major' | 'minor' | 'info';
  description: string;
  location?: string;
  recommendation: string;
}

// Generation result types
export interface GenerationResult {
  files: string[];
  logs: SDKMessage[];
  success: boolean;
  sessionId?: string;
  requiresReview?: boolean;
  prd?: PRDOutput;
  architecture?: ArchitectureOutput;
  uiDesign?: UIDesignOutput;
  taskBreakdown?: TaskBreakdown;
  validation?: ValidationResult;
  qaReport?: QAReport;
}

export interface WhiteLabelConfig {
  appName: string;
  bundleId: { ios: string; android: string };
  branding: {
    displayName: string;
    primaryColor: string;
    secondaryColor: string;
    logo?: { light: string; dark: string };
    splash?: { backgroundColor: string; image: string };
  };
  storeMetadata?: {
    shortDescription: string;
    fullDescription: string;
    keywords: string[];
    category: string;
    screenshots: string[];
  };
  identifiers: {
    projectId: string;
    easProjectId: string;
    awsResourcePrefix: string;
    analyticsKey: string;
  };
}

// Hook types
export type HookCallback = (
  input: PreToolUseHookInput | PostToolUseHookInput,
  toolUseId: string,
  context: { signal?: AbortSignal }
) => Promise<HookOutput>;

export interface PreToolUseHookInput {
  hook_event_name: 'PreToolUse';
  tool_name: string;
  tool_input: Record<string, unknown>;
}

export interface PostToolUseHookInput {
  hook_event_name: 'PostToolUse';
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_output?: unknown;
}

export interface HookOutput {
  hookSpecificOutput?: {
    hookEventName?: string;
    permissionDecision?: 'allow' | 'deny';
    permissionDecisionReason?: string;
    validationErrors?: Array<{ file: string; line?: number; message: string }>;
    message?: string;
  };
}

export interface HookConfig {
  PreToolUse?: Array<{
    matcher: string;
    hooks: HookCallback[];
  }>;
  PostToolUse?: Array<{
    matcher: string;
    hooks: HookCallback[];
  }>;
  SubagentStop?: Array<{
    matcher: string;
    hooks: HookCallback[];
  }>;
}
