// Generation types for the web dashboard

export interface GenerationPhase {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  agent?: string;
  message?: string;
  startTime?: string;
  endTime?: string;
}

export interface GenerationProgress {
  projectId: string;
  stage: string;
  timestamp: string;
  data: GenerationProgressData;
}

export interface GenerationProgressData {
  phase?: string;
  index?: number;
  template?: string;
  taskId?: string;
  title?: string;
  total?: number;
  attempt?: number;
  success?: boolean;
  filesGenerated?: number;
  qaScore?: number;
  error?: string;
  [key: string]: unknown;
}

export interface GenerationResult {
  files: string[];
  success: boolean;
  prd?: {
    appName: string;
    description: string;
    coreFeatures: string[];
  };
  architecture?: {
    template: string;
    techStack: string[];
  };
  uiDesign?: {
    screens: Array<{ name: string; description: string }>;
  };
  validation?: {
    passed: boolean;
    summary: string;
  };
  qaReport?: {
    overallScore: number;
    readyForProduction: boolean;
    recommendations: string[];
  };
  requiresReview?: boolean;
}

export interface ProjectConfig {
  appName: string;
  bundleId: {
    ios: string;
    android: string;
  };
  branding: {
    displayName: string;
    primaryColor: string;
    secondaryColor: string;
  };
  identifiers: {
    projectId: string;
    easProjectId: string;
    awsResourcePrefix: string;
    analyticsKey: string;
  };
  // Template-specific environment variables (e.g., Shopify domain, API keys)
  envVars?: Record<string, string>;
}

// Phase definitions matching the generator orchestrator
export const GENERATION_PHASES: GenerationPhase[] = [
  { id: 'setup', name: 'Project Setup', status: 'pending' },
  { id: 'analysis', name: 'Intent Analysis', status: 'pending', agent: 'intent-analyzer' },
  { id: 'product-definition', name: 'Product Definition', status: 'pending', agent: 'product-manager' },
  { id: 'architecture', name: 'Technical Architecture', status: 'pending', agent: 'technical-architect' },
  { id: 'ui-design', name: 'UI/UX Design', status: 'pending', agent: 'ui-ux-expert' },
  { id: 'planning', name: 'Task Planning', status: 'pending', agent: 'lead-developer' },
  { id: 'implementation', name: 'Implementation', status: 'pending', agent: 'developer' },
  { id: 'validation', name: 'Validation', status: 'pending', agent: 'validator' },
  { id: 'quality-assurance', name: 'Quality Assurance', status: 'pending', agent: 'qa' },
];
