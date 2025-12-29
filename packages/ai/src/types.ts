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
  | 'qa'
  // Build and Validation agents
  | 'build-validator'           // Validates build success (prebuild, metro, native config)
  | 'apk-builder'               // Builds Android APK via EAS or local gradle
  | 'web-deployer'              // Deploys web preview using Expo Web
  // Specialized QA/Testing agents
  | 'accessibility-auditor'
  | 'performance-profiler'
  | 'security-scanner'
  | 'e2e-test-generator'
  | 'preview-generator'
  | 'device-tester'
  // 2025 Specialized Testing Agents (with unique MCP tools)
  | 'ui-interaction-tester'   // Device control, element interaction, gestures
  | 'visual-regression-tester' // Screenshot comparison, baseline management
  | 'flow-validator'           // User journey verification, state machine testing
  | 'exploratory-tester';      // AI-powered crawling, anomaly detection

// Per-agent timeout configuration (in milliseconds)
// Complex agents like product-manager and architect need more time
export const AGENT_TIMEOUTS: Record<AgentRole, number> = {
  'orchestrator': 900000,           // 15 min - coordinates entire workflow
  'product-manager': 600000,        // 10 min - creates detailed PRD (reads many files)
  'technical-architect': 600000,    // 10 min - designs architecture (explores codebase)
  'ui-ux-expert': 600000,           // 10 min - design system (complex theme generation)
  'lead-developer': 180000,         // 3 min - task breakdown
  'developer': 300000,              // 5 min - implementation
  'intent-analyzer': 60000,         // 1 min - quick analysis
  'validator': 180000,              // 3 min - run validations
  'error-fixer': 180000,            // 3 min - fix errors
  'qa': 180000,                     // 3 min - quality assessment
  'build-validator': 600000,        // 10 min - prebuild + bundle checks (expo prebuild is slow)
  'apk-builder': 900000,            // 15 min - Android APK build can be slow
  'web-deployer': 300000,           // 5 min - Expo web export and deploy
  'accessibility-auditor': 120000,  // 2 min
  'performance-profiler': 180000,   // 3 min
  'security-scanner': 180000,       // 3 min
  'e2e-test-generator': 180000,     // 3 min
  'preview-generator': 120000,      // 2 min
  'device-tester': 600000,          // 10 min - device cloud tests
  'ui-interaction-tester': 300000,  // 5 min
  'visual-regression-tester': 300000, // 5 min
  'flow-validator': 300000,         // 5 min
  'exploratory-tester': 600000,     // 10 min - AI crawling
};

// Per-agent max turns configuration
// Complex agents that read/write many files need more turns
export const AGENT_MAX_TURNS: Record<AgentRole, number> = {
  'orchestrator': 200,              // Coordinates many agents
  'product-manager': 100,           // Creates detailed PRD with many reads
  'technical-architect': 100,       // Designs architecture with codebase exploration
  'ui-ux-expert': 100,              // Generates many theme/style files
  'lead-developer': 80,             // Breaks down into many tasks
  'developer': 150,                 // Implements many files
  'intent-analyzer': 30,            // Quick analysis
  'validator': 50,                  // Runs validation commands
  'error-fixer': 80,                // May need to fix multiple files
  'qa': 50,                         // Quality assessment
  'build-validator': 80,            // Build validation (multiple long-running commands)
  'apk-builder': 50,                // APK build (mostly waiting for build commands)
  'web-deployer': 50,               // Web export and deploy
  'accessibility-auditor': 50,      // Audit checks
  'performance-profiler': 50,       // Performance checks
  'security-scanner': 50,           // Security scans
  'e2e-test-generator': 80,         // Generates test files
  'preview-generator': 30,          // Quick preview setup
  'device-tester': 100,             // Device testing takes many turns
  'ui-interaction-tester': 80,      // UI tests
  'visual-regression-tester': 80,   // Visual tests
  'flow-validator': 80,             // Flow validation
  'exploratory-tester': 150,        // AI crawling needs many turns
};

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
  parallel?: boolean; // Can agents in this phase run in parallel?
  service?: 'backend' | 'storage' | 'testing'; // Uses a service instead of agents
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
  stages: Record<string, ValidationStage>;
  summary: string;
  totalErrors?: number;
  totalWarnings?: number;
}

export interface ValidationStage {
  name: string;
  passed: boolean;
  duration?: number;
  errors: ValidationError[];
  warnings?: ValidationError[];
}

export interface ValidationError {
  file: string;
  line?: number;
  column?: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  rule?: string;
  fixable?: boolean;
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
  weight: number;
  findings: QAFinding[];
}

export interface QAFinding {
  id: string;
  category: string;
  severity: 'critical' | 'major' | 'minor' | 'suggestion';
  title: string;
  description: string;
  location?: string;
  recommendation: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// ENHANCED QA TYPES
// ═══════════════════════════════════════════════════════════════════════════

// Accessibility Audit Types
export interface AccessibilityAuditResult {
  score: number; // 0-100
  wcagLevel: 'A' | 'AA' | 'AAA' | 'non-compliant';
  violations: AccessibilityViolation[];
  warnings: AccessibilityWarning[];
  passed: AccessibilityCheck[];
  summary: string;
}

export interface AccessibilityViolation {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  wcagCriteria: string;
  element: string;
  file: string;
  line?: number;
  fix: string;
}

export interface AccessibilityWarning {
  id: string;
  description: string;
  element: string;
  file: string;
  suggestion: string;
}

export interface AccessibilityCheck {
  id: string;
  description: string;
  count: number;
}

// Performance Profiling Types
export interface PerformanceReport {
  bundleAnalysis: BundleAnalysis;
  renderAnalysis: RenderAnalysis;
  memoryAnalysis: MemoryAnalysis;
  startupAnalysis: StartupAnalysis;
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  optimizations: PerformanceOptimization[];
  estimatedImpact: string;
}

export interface BundleAnalysis {
  totalSize: number; // bytes
  jsSize: number;
  assetsSize: number;
  nativeSize: number;
  largestModules: ModuleSize[];
  unusedExports: string[];
  duplicateDependencies: string[];
}

export interface ModuleSize {
  name: string;
  size: number;
  percentage: number;
  category: 'dependency' | 'app-code' | 'asset';
}

export interface RenderAnalysis {
  unnecessaryRerenders: RerenderIssue[];
  missingMemoization: string[];
  inlineFunctions: InlineFunctionIssue[];
  largeListOptimizations: string[];
}

export interface RerenderIssue {
  component: string;
  file: string;
  cause: string;
  fix: string;
}

export interface InlineFunctionIssue {
  component: string;
  file: string;
  line: number;
  suggestion: string;
}

export interface MemoryAnalysis {
  potentialLeaks: MemoryLeak[];
  largeAllocations: string[];
  subscriptionCleanup: SubscriptionIssue[];
}

export interface MemoryLeak {
  type: 'event-listener' | 'subscription' | 'timer' | 'closure';
  file: string;
  description: string;
  fix: string;
}

export interface SubscriptionIssue {
  file: string;
  line: number;
  description: string;
}

export interface StartupAnalysis {
  heavyInitializations: string[];
  blockingOperations: string[];
  lazyLoadCandidates: string[];
  estimatedStartupTime: string;
}

export interface PerformanceOptimization {
  type: 'bundle' | 'render' | 'memory' | 'startup';
  priority: 'high' | 'medium' | 'low';
  description: string;
  file?: string;
  estimatedImpact: string;
  implementation: string;
}

// Security Scanning Types
export interface SecurityReport {
  score: number; // 0-100
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'none';
  vulnerabilities: SecurityVulnerability[];
  secretsFound: SecretExposure[];
  dependencyAudit: DependencyAudit;
  securityChecks: SecurityCheck[];
  recommendations: string[];
}

export interface SecurityVulnerability {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'injection' | 'auth' | 'crypto' | 'storage' | 'network' | 'other';
  title: string;
  description: string;
  file: string;
  line?: number;
  cwe?: string; // Common Weakness Enumeration
  fix: string;
}

export interface SecretExposure {
  type: 'api-key' | 'password' | 'token' | 'private-key' | 'credential';
  file: string;
  line: number;
  pattern: string;
  severity: 'critical' | 'high';
  recommendation: string;
}

export interface DependencyAudit {
  totalDependencies: number;
  vulnerableDependencies: VulnerableDependency[];
  outdatedDependencies: OutdatedDependency[];
  licensingIssues: string[];
}

export interface VulnerableDependency {
  package: string;
  version: string;
  vulnerability: string;
  severity: 'critical' | 'high' | 'moderate' | 'low';
  fixVersion?: string;
  advisory?: string;
}

export interface OutdatedDependency {
  package: string;
  current: string;
  latest: string;
  type: 'major' | 'minor' | 'patch';
}

export interface SecurityCheck {
  name: string;
  passed: boolean;
  details?: string;
}

// E2E Test Generation Types
export interface E2ETestSuite {
  framework: 'maestro' | 'detox' | 'appium';
  tests: E2ETest[];
  coverage: TestCoverage;
  missingTestIds: MissingTestId[];
}

export interface E2ETest {
  name: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  type: 'navigation' | 'form' | 'interaction' | 'integration';
  file: string;
  content: string;
  steps: E2ETestStep[];
}

export interface E2ETestStep {
  action: string;
  target?: string;
  value?: string;
  assertion?: string;
}

export interface TestCoverage {
  screens: { covered: number; total: number };
  criticalPaths: { covered: number; total: number };
  interactions: { covered: number; total: number };
}

export interface MissingTestId {
  component: string;
  file: string;
  line: number;
  suggestedId: string;
}

// Device Testing Types
export type DeviceProvider = 'aws-device-farm' | 'browserstack' | 'firebase-test-lab' | 'maestro-cloud' | 'sauce-labs' | 'lambdatest' | 'local';

export interface DeviceTestConfig {
  provider: DeviceProvider;
  platforms: ('ios' | 'android')[];
  devices: DeviceSpec[];
  parallel: boolean;
  timeout: number;
  retries: number;
}

export interface DeviceSpec {
  platform: 'ios' | 'android';
  name: string;
  osVersion: string;
  formFactor?: 'phone' | 'tablet';
}

export interface DeviceTestResult {
  device: DeviceSpec;
  status: 'passed' | 'failed' | 'error' | 'timeout';
  duration: number;
  tests: DeviceTestCaseResult[];
  logs?: string;
  video?: string;
  screenshots?: string[];
  artifacts?: DeviceArtifact[];
}

export interface DeviceTestCaseResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  screenshot?: string;
}

export interface DeviceArtifact {
  type: 'video' | 'screenshot' | 'log' | 'crash-report';
  url: string;
  timestamp: string;
}

export interface DeviceTestSession {
  id: string;
  provider: DeviceProvider;
  projectId: string;
  buildId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  results: DeviceTestResult[];
  summary: DeviceTestSummary;
}

export interface DeviceTestSummary {
  totalDevices: number;
  passedDevices: number;
  failedDevices: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration: number;
}

// Preview Generation Types
export interface PreviewConfig {
  type: 'expo-go' | 'development-build' | 'internal-distribution';
  platform: 'ios' | 'android' | 'both';
  tunnel: boolean;
  clearCache: boolean;
}

export interface PreviewResult {
  type: PreviewConfig['type'];
  status: 'ready' | 'building' | 'error';
  qrCode?: string;
  expoUrl?: string;
  webUrl?: string;
  buildId?: string;
  error?: string;
  instructions: string[];
}

// Enhanced Validation Pipeline Types
export interface ValidationPipeline {
  tiers: ValidationTier[];
  parallelTiers: boolean;
  stopOnFirstFailure: boolean;
  autoFix: boolean;
}

export interface ValidationTier {
  name: string;
  timeout: number;
  parallel: boolean;
  checks: ValidationCheck[];
  required: boolean;
}

export interface ValidationCheck {
  id: string;
  name: string;
  category: 'syntax' | 'lint' | 'type' | 'build' | 'test' | 'security' | 'accessibility' | 'performance';
  command?: string;
  timeout: number;
  required: boolean;
  autoFix: boolean;
}

export interface EnhancedValidationResult extends ValidationResult {
  accessibility?: AccessibilityAuditResult;
  performance?: PerformanceReport;
  security?: SecurityReport;
  e2eTests?: E2ETestSuite;
  deviceTests?: DeviceTestSession;
  preview?: PreviewResult;
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
