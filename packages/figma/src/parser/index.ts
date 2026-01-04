/**
 * Figma URL Parser
 * Parses and validates Figma URLs to extract file keys and node IDs
 */

export interface ParsedFigmaUrl {
  isValid: boolean;
  fileKey?: string;
  nodeId?: string;
  fileName?: string;
  pageId?: string;
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// URL patterns for Figma
const PATTERNS = {
  file: /figma\.com\/(file|design)\/([a-zA-Z0-9]+)/,
  node: /node-id=([0-9]+-[0-9]+|[0-9]+:[0-9]+)/,
  page: /page-id=([0-9]+)/,
  branch: /branch\/([a-zA-Z0-9]+)/,
};

export class FigmaUrlParser {
  /**
   * Parse a Figma URL
   */
  static parse(url: string): ParsedFigmaUrl {
    if (!url || typeof url !== 'string') {
      return { isValid: false, error: 'URL is required' };
    }

    const trimmedUrl = url.trim();

    // Basic URL validation
    if (!trimmedUrl.includes('figma.com')) {
      return { isValid: false, error: 'Not a valid Figma URL' };
    }

    // Extract file key
    const fileMatch = trimmedUrl.match(PATTERNS.file);
    if (!fileMatch || !fileMatch[2]) {
      return { isValid: false, error: 'Could not extract file key from URL' };
    }

    const result: ParsedFigmaUrl = {
      isValid: true,
      fileKey: fileMatch[2],
    };

    // Extract node ID if present
    const nodeMatch = trimmedUrl.match(PATTERNS.node);
    if (nodeMatch && nodeMatch[1]) {
      // Normalize node ID format (Figma uses both formats)
      result.nodeId = nodeMatch[1].replace('-', ':');
    }

    // Extract page ID if present
    const pageMatch = trimmedUrl.match(PATTERNS.page);
    if (pageMatch && pageMatch[1]) {
      result.pageId = pageMatch[1];
    }

    // Extract file name from URL path
    const pathParts = trimmedUrl.split('/');
    const fileIndex = pathParts.findIndex(p => p === 'file' || p === 'design');
    if (fileIndex !== -1 && pathParts[fileIndex + 2]) {
      result.fileName = decodeURIComponent(pathParts[fileIndex + 2].split('?')[0]);
    }

    return result;
  }

  /**
   * Validate a Figma URL
   */
  static validate(url: string): ValidationResult {
    const parsed = this.parse(url);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!parsed.isValid) {
      errors.push(parsed.error || 'Invalid URL');
    }

    if (!parsed.fileKey) {
      errors.push('Missing file key');
    } else if (parsed.fileKey.length < 10) {
      warnings.push('File key seems unusually short');
    }

    if (!parsed.nodeId) {
      warnings.push('No specific frame selected - will import all frames');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Extract all node IDs from a URL
   */
  static extractAllNodeIds(url: string): string[] {
    const nodeIds: string[] = [];

    // Match all node-id parameters
    const matches = url.matchAll(/node-id=([0-9]+-[0-9]+|[0-9]+:[0-9]+)/g);
    for (const match of matches) {
      nodeIds.push(match[1].replace('-', ':'));
    }

    return nodeIds;
  }

  /**
   * Build a Figma URL from components
   */
  static buildUrl(fileKey: string, options?: { nodeId?: string; fileName?: string }): string {
    let url = `https://www.figma.com/file/${fileKey}`;

    if (options?.fileName) {
      url += `/${encodeURIComponent(options.fileName)}`;
    }

    if (options?.nodeId) {
      url += `?node-id=${options.nodeId.replace(':', '-')}`;
    }

    return url;
  }
}

export default FigmaUrlParser;
