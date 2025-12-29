import type {
  TemplateConfig,
  TemplateValidationResult,
  ValidationError,
  ValidationWarning,
} from './types';

/**
 * Validate a template configuration before publishing
 */
export async function validateTemplate(
  config: TemplateConfig,
  templatePath: string
): Promise<TemplateValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // 1. Validate required fields
  if (!config.name || config.name.length < 3) {
    errors.push({
      field: 'name',
      message: 'Template name must be at least 3 characters',
      severity: 'error',
    });
  }

  if (!config.description || config.description.length < 20) {
    errors.push({
      field: 'description',
      message: 'Template description must be at least 20 characters',
      severity: 'error',
    });
  }

  // 2. Validate version format (semver)
  if (!config.version.match(/^\d+\.\d+\.\d+$/)) {
    errors.push({
      field: 'version',
      message: 'Version must follow semver format (e.g., 1.0.0)',
      severity: 'error',
    });
  }

  // 3. Validate category exists
  if (!config.category) {
    errors.push({
      field: 'category',
      message: 'Template category is required',
      severity: 'error',
    });
  }

  // 4. Validate capabilities
  if (config.capabilities.length === 0) {
    warnings.push({
      field: 'capabilities',
      message: 'No capabilities defined for this template',
      suggestion: 'Add at least one capability to help users understand what this template can do',
    });
  }

  // 5. Validate dependencies
  if (config.requiredDependencies.length === 0) {
    warnings.push({
      field: 'requiredDependencies',
      message: 'No required dependencies defined',
      suggestion: 'Ensure all necessary dependencies are listed',
    });
  }

  // 6. Validate platform support
  if (config.platforms.length === 0) {
    errors.push({
      field: 'platforms',
      message: 'At least one platform must be supported',
      severity: 'error',
    });
  }

  // 7. Validate customizable areas
  if (config.customizableAreas.length === 0) {
    warnings.push({
      field: 'customizableAreas',
      message: 'No customizable areas defined',
      suggestion: 'Define customizable areas to guide AI generation',
    });
  }

  // 8. Validate AI instructions
  for (const area of config.customizableAreas) {
    if (!area.aiInstructions || area.aiInstructions.length < 10) {
      warnings.push({
        field: `customizableAreas.${area.id}.aiInstructions`,
        message: `AI instructions for ${area.id} are too brief`,
        suggestion: 'Provide detailed instructions to help AI understand how to customize this area',
      });
    }
  }

  // 9. Validate test coverage
  if (config.testSuites.length === 0) {
    warnings.push({
      field: 'testSuites',
      message: 'No test suites defined',
      suggestion: 'Add test suites to ensure template quality',
    });
  }

  // Calculate quality score (0-100)
  const score = calculateQualityScore(config, errors, warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    score,
  };
}

/**
 * Calculate template quality score
 */
function calculateQualityScore(
  config: TemplateConfig,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): number {
  let score = 100;

  // Deduct for errors (20 points each, max 100)
  score -= Math.min(errors.length * 20, 100);

  // Deduct for warnings (5 points each, max 50)
  score -= Math.min(warnings.length * 5, 50);

  // Bonus for good documentation
  if (config.aiDescription.length > 200) score += 5;
  if (config.keywords.length >= 5) score += 5;

  // Bonus for test coverage
  if (config.testSuites.length >= 3) score += 5;
  if (config.e2eFlows.length >= 2) score += 5;

  // Bonus for customization options
  if (config.customizableAreas.length >= 5) score += 5;

  // Bonus for multi-platform support
  if (config.platforms.length >= 2) score += 5;

  return Math.max(0, Math.min(100, score));
}

/**
 * Validate template file structure
 */
export async function validateTemplateStructure(
  templatePath: string
): Promise<TemplateValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Required files
  const requiredFiles = [
    'package.json',
    'app.json',
    'template.config.ts',
    'src/app/_layout.tsx',
  ];

  // This is a stub - in real implementation, check if files exist
  // For now, just return success

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    score: 100,
  };
}

/**
 * Validate template compatibility with current Mobigen version
 */
export async function validateCompatibility(
  config: TemplateConfig,
  currentExpoVersion: string,
  currentRNVersion: string
): Promise<TemplateValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Check Expo version compatibility
  if (config.minExpoVersion) {
    const minVersion = parseVersion(config.minExpoVersion);
    const currentVersion = parseVersion(currentExpoVersion);

    if (currentVersion < minVersion) {
      errors.push({
        field: 'minExpoVersion',
        message: `Template requires Expo ${config.minExpoVersion} or higher (current: ${currentExpoVersion})`,
        severity: 'error',
      });
    }
  }

  // Check React Native version compatibility
  if (config.minRNVersion) {
    const minVersion = parseVersion(config.minRNVersion);
    const currentVersion = parseVersion(currentRNVersion);

    if (currentVersion < minVersion) {
      errors.push({
        field: 'minRNVersion',
        message: `Template requires React Native ${config.minRNVersion} or higher (current: ${currentRNVersion})`,
        severity: 'error',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    score: errors.length === 0 ? 100 : 0,
  };
}

/**
 * Parse semantic version string to number for comparison
 */
function parseVersion(version: string): number {
  const parts = version.split('.').map(Number);
  return parts[0] * 10000 + parts[1] * 100 + parts[2];
}
