import type { TemplateVersion } from './types';

/**
 * Parse semver version string
 */
export function parseVersion(version: string): {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
} {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
  if (!match) {
    throw new Error(`Invalid version format: ${version}`);
  }

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4],
  };
}

/**
 * Compare two semver versions
 * Returns: -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareVersions(a: string, b: string): number {
  const versionA = parseVersion(a);
  const versionB = parseVersion(b);

  if (versionA.major !== versionB.major) {
    return versionA.major > versionB.major ? 1 : -1;
  }

  if (versionA.minor !== versionB.minor) {
    return versionA.minor > versionB.minor ? 1 : -1;
  }

  if (versionA.patch !== versionB.patch) {
    return versionA.patch > versionB.patch ? 1 : -1;
  }

  // Handle prerelease versions
  if (versionA.prerelease && !versionB.prerelease) return -1;
  if (!versionA.prerelease && versionB.prerelease) return 1;
  if (versionA.prerelease && versionB.prerelease) {
    return versionA.prerelease > versionB.prerelease ? 1 : -1;
  }

  return 0;
}

/**
 * Check if version is compatible with required version
 */
export function isVersionCompatible(
  currentVersion: string,
  requiredVersion: string
): boolean {
  return compareVersions(currentVersion, requiredVersion) >= 0;
}

/**
 * Increment version based on change type
 */
export function incrementVersion(
  currentVersion: string,
  type: 'major' | 'minor' | 'patch'
): string {
  const version = parseVersion(currentVersion);

  switch (type) {
    case 'major':
      return `${version.major + 1}.0.0`;
    case 'minor':
      return `${version.major}.${version.minor + 1}.0`;
    case 'patch':
      return `${version.major}.${version.minor}.${version.patch + 1}`;
  }
}

/**
 * Determine version increment type based on changes
 */
export function suggestVersionIncrement(changes: {
  breaking: boolean;
  features: boolean;
  fixes: boolean;
}): 'major' | 'minor' | 'patch' {
  if (changes.breaking) {
    return 'major';
  }
  if (changes.features) {
    return 'minor';
  }
  return 'patch';
}

/**
 * Format version history entry
 */
export function formatVersionHistory(version: TemplateVersion): string {
  const lines: string[] = [];

  lines.push(`## ${version.version}`);
  lines.push('');

  if (version.breaking) {
    lines.push('⚠️ **BREAKING CHANGES**');
    lines.push('');
  }

  if (version.added && version.added.length > 0) {
    lines.push('### Added');
    version.added.forEach((item) => lines.push(`- ${item}`));
    lines.push('');
  }

  if (version.changed && version.changed.length > 0) {
    lines.push('### Changed');
    version.changed.forEach((item) => lines.push(`- ${item}`));
    lines.push('');
  }

  if (version.fixed && version.fixed.length > 0) {
    lines.push('### Fixed');
    version.fixed.forEach((item) => lines.push(`- ${item}`));
    lines.push('');
  }

  if (version.deprecated && version.deprecated.length > 0) {
    lines.push('### Deprecated');
    version.deprecated.forEach((item) => lines.push(`- ${item}`));
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Generate changelog from version history
 */
export function generateChangelog(versions: TemplateVersion[]): string {
  const sortedVersions = [...versions].sort((a, b) =>
    compareVersions(b.version, a.version)
  );

  const lines: string[] = ['# Changelog', ''];

  sortedVersions.forEach((version) => {
    lines.push(formatVersionHistory(version));
  });

  return lines.join('\n');
}

/**
 * Validate version number format
 */
export function validateVersion(version: string): {
  valid: boolean;
  error?: string;
} {
  try {
    parseVersion(version);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid version format',
    };
  }
}
