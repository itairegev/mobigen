export type ValidationTier = 'tier1' | 'tier2' | 'tier3';

export interface ValidationError {
  file: string;
  line?: number;
  column?: number;
  message: string;
  severity: 'error' | 'warning';
  rule?: string;
}

export interface ValidationResult {
  tier: ValidationTier;
  passed: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  duration: number;
  stages: Record<string, StageResult>;
}

export interface StageResult {
  name: string;
  passed: boolean;
  duration: number;
  errors: ValidationError[];
  output?: string;
}

export interface ValidatorConfig {
  projectPath: string;
  tier: ValidationTier;
  timeout?: number;
  cwd?: string;
}

export interface Validator {
  name: string;
  tier: ValidationTier;
  run(config: ValidatorConfig): Promise<StageResult>;
}
