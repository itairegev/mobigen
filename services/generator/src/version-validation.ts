/**
 * Version Validation Utilities
 *
 * Utilities for validating semantic versions and compatibility checks
 */

import {
  parseVersion,
  formatVersion,
  isValidVersion,
  compareVersions,
  calculateRuntimeVersion,
  areVersionsCompatible,
  type SemanticVersion,
  type VersionType,
} from './version-manager';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface CompatibilityCheck {
  compatible: boolean;
  reason?: string;
  runtimeVersion1: string;
  runtimeVersion2: string;
}

/**
 * Validate version string format
 */
export function validateVersionFormat(version: string): ValidationResult {
  if (!version || typeof version !== 'string') {
    return {
      valid: false,
      error: 'Version must be a non-empty string',
    };
  }

  if (!isValidVersion(version)) {
    return {
      valid: false,
      error: 'Invalid semantic version format. Expected: major.minor.patch (e.g., 1.0.0)',
    };
  }

  try {
    const semver = parseVersion(version);

    if (semver.major < 0 || semver.minor < 0 || semver.patch < 0) {
      return {
        valid: false,
        error: 'Version numbers must be non-negative',
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Failed to parse version',
    };
  }
}

/**
 * Validate version increment
 */
export function validateVersionIncrement(
  currentVersion: string,
  newVersion: string,
  expectedType?: VersionType
): ValidationResult {
  // Validate both versions
  const currentValidation = validateVersionFormat(currentVersion);
  if (!currentValidation.valid) {
    return {
      valid: false,
      error: `Invalid current version: ${currentValidation.error}`,
    };
  }

  const newValidation = validateVersionFormat(newVersion);
  if (!newValidation.valid) {
    return {
      valid: false,
      error: `Invalid new version: ${newValidation.error}`,
    };
  }

  // Check that new version is greater
  const comparison = compareVersions(newVersion, currentVersion);
  if (comparison <= 0) {
    return {
      valid: false,
      error: `New version ${newVersion} must be greater than current version ${currentVersion}`,
    };
  }

  // If expected type is specified, validate the increment type
  if (expectedType) {
    const current = parseVersion(currentVersion);
    const next = parseVersion(newVersion);

    switch (expectedType) {
      case 'major':
        if (next.major !== current.major + 1 || next.minor !== 0 || next.patch !== 0) {
          return {
            valid: false,
            error: `Major version increment must change major by 1 and reset minor and patch to 0. Expected: ${current.major + 1}.0.0`,
          };
        }
        break;

      case 'minor':
        if (next.major !== current.major || next.minor !== current.minor + 1 || next.patch !== 0) {
          return {
            valid: false,
            error: `Minor version increment must keep major same, increment minor by 1, and reset patch to 0. Expected: ${current.major}.${current.minor + 1}.0`,
          };
        }
        break;

      case 'patch':
        if (next.major !== current.major || next.minor !== current.minor || next.patch !== current.patch + 1) {
          return {
            valid: false,
            error: `Patch version increment must keep major and minor same and increment patch by 1. Expected: ${current.major}.${current.minor}.${current.patch + 1}`,
          };
        }
        break;
    }
  }

  return { valid: true };
}

/**
 * Check compatibility between two versions
 */
export function checkCompatibility(
  version1: string,
  version2: string
): CompatibilityCheck {
  // Validate versions
  const v1Validation = validateVersionFormat(version1);
  const v2Validation = validateVersionFormat(version2);

  if (!v1Validation.valid || !v2Validation.valid) {
    return {
      compatible: false,
      reason: 'One or both versions are invalid',
      runtimeVersion1: '',
      runtimeVersion2: '',
    };
  }

  const runtime1 = calculateRuntimeVersion(version1);
  const runtime2 = calculateRuntimeVersion(version2);

  const compatible = areVersionsCompatible(version1, version2);

  return {
    compatible,
    reason: compatible
      ? 'Versions share the same runtime version'
      : `Different runtime versions (${runtime1} vs ${runtime2})`,
    runtimeVersion1: runtime1,
    runtimeVersion2: runtime2,
  };
}

/**
 * Detect version increment type
 */
export function detectVersionType(
  currentVersion: string,
  newVersion: string
): VersionType | null {
  try {
    const current = parseVersion(currentVersion);
    const next = parseVersion(newVersion);

    if (next.major > current.major) {
      return 'major';
    } else if (next.minor > current.minor && next.major === current.major) {
      return 'minor';
    } else if (next.patch > current.patch && next.major === current.major && next.minor === current.minor) {
      return 'patch';
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Suggest next version based on type
 */
export function suggestNextVersion(
  currentVersion: string,
  type: VersionType
): string | null {
  try {
    const semver = parseVersion(currentVersion);

    switch (type) {
      case 'major':
        return formatVersion({ major: semver.major + 1, minor: 0, patch: 0 });
      case 'minor':
        return formatVersion({ major: semver.major, minor: semver.minor + 1, patch: 0 });
      case 'patch':
        return formatVersion({ major: semver.major, minor: semver.minor, patch: semver.patch + 1 });
    }
  } catch {
    return null;
  }
}

/**
 * Validate version range
 */
export function isVersionInRange(
  version: string,
  minVersion?: string,
  maxVersion?: string
): ValidationResult {
  const versionValidation = validateVersionFormat(version);
  if (!versionValidation.valid) {
    return versionValidation;
  }

  if (minVersion) {
    const minValidation = validateVersionFormat(minVersion);
    if (!minValidation.valid) {
      return {
        valid: false,
        error: `Invalid minimum version: ${minValidation.error}`,
      };
    }

    if (compareVersions(version, minVersion) < 0) {
      return {
        valid: false,
        error: `Version ${version} is below minimum version ${minVersion}`,
      };
    }
  }

  if (maxVersion) {
    const maxValidation = validateVersionFormat(maxVersion);
    if (!maxValidation.valid) {
      return {
        valid: false,
        error: `Invalid maximum version: ${maxValidation.error}`,
      };
    }

    if (compareVersions(version, maxVersion) > 0) {
      return {
        valid: false,
        error: `Version ${version} is above maximum version ${maxVersion}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Get version summary
 */
export function getVersionSummary(version: string): {
  version: string;
  major: number;
  minor: number;
  patch: number;
  runtimeVersion: string;
  isStable: boolean;
  isPreRelease: boolean;
} | null {
  try {
    const semver = parseVersion(version);
    const runtimeVersion = calculateRuntimeVersion(version);

    return {
      version,
      major: semver.major,
      minor: semver.minor,
      patch: semver.patch,
      runtimeVersion,
      isStable: semver.major >= 1,
      isPreRelease: semver.major === 0,
    };
  } catch {
    return null;
  }
}

/**
 * Batch validate multiple versions
 */
export function validateVersions(versions: string[]): {
  valid: string[];
  invalid: Array<{ version: string; error: string }>;
} {
  const valid: string[] = [];
  const invalid: Array<{ version: string; error: string }> = [];

  for (const version of versions) {
    const result = validateVersionFormat(version);
    if (result.valid) {
      valid.push(version);
    } else {
      invalid.push({
        version,
        error: result.error || 'Unknown error',
      });
    }
  }

  return { valid, invalid };
}

/**
 * Sort versions in ascending order
 */
export function sortVersions(versions: string[], ascending = true): string[] {
  return versions.slice().sort((a, b) => {
    const comparison = compareVersions(a, b);
    return ascending ? comparison : -comparison;
  });
}

/**
 * Get latest version from array
 */
export function getLatestVersion(versions: string[]): string | null {
  if (versions.length === 0) {
    return null;
  }

  const sorted = sortVersions(versions, false);
  return sorted[0];
}
