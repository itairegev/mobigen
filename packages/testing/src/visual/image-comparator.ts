/**
 * Image Comparator
 *
 * Compares two images and generates a diff image showing visual changes.
 * Uses pixelmatch for pixel-by-pixel comparison.
 */

import * as fs from 'fs';
import * as path from 'path';

// Types for optional dependencies
interface PNGInstance {
  width: number;
  height: number;
  data: Buffer;
  pack(): NodeJS.ReadableStream;
}

interface PNGConstructor {
  new (options?: { width?: number; height?: number }): PNGInstance;
}

type PixelmatchFn = (
  img1: Buffer,
  img2: Buffer,
  output: Buffer,
  width: number,
  height: number,
  options?: Record<string, unknown>
) => number;

// Dynamic imports for optional dependencies
let PNG: PNGConstructor | null = null;
let pixelmatch: PixelmatchFn | null = null;

async function loadDependencies() {
  if (!PNG) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pngjs = require('pngjs');
      PNG = pngjs.PNG;
    } catch {
      console.warn('[visual] pngjs not installed. Visual testing will be limited.');
    }
  }

  if (!pixelmatch) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pm = require('pixelmatch');
      pixelmatch = pm.default || pm;
    } catch {
      console.warn('[visual] pixelmatch not installed. Visual testing will be limited.');
    }
  }
}

export interface ImageComparisonResult {
  match: boolean;
  diffCount: number;
  diffPercentage: number;
  diffImagePath?: string;
  width: number;
  height: number;
  threshold: number;
  error?: string;
}

export interface ComparisonOptions {
  threshold?: number; // 0-1, lower = more sensitive (default 0.1)
  includeAA?: boolean; // Include anti-aliased pixels (default false)
  alpha?: number; // Blending factor of unchanged pixels in diff (default 0.1)
  diffColor?: [number, number, number, number]; // RGBA for diff pixels
  outputDiff?: boolean; // Generate diff image (default true)
  outputPath?: string; // Path for diff image
}

/**
 * Compare two images and return the difference
 */
export async function compareImages(
  baselinePath: string,
  currentPath: string,
  options: ComparisonOptions = {}
): Promise<ImageComparisonResult> {
  await loadDependencies();

  const {
    threshold = 0.1,
    includeAA = false,
    alpha = 0.1,
    diffColor = [255, 0, 0, 255],
    outputDiff = true,
    outputPath,
  } = options;

  // Check if dependencies are available
  if (!PNG || !pixelmatch) {
    return {
      match: false,
      diffCount: -1,
      diffPercentage: -1,
      width: 0,
      height: 0,
      threshold,
      error: 'Visual testing dependencies not installed (pngjs, pixelmatch)',
    };
  }

  // Check if files exist
  if (!fs.existsSync(baselinePath)) {
    return {
      match: false,
      diffCount: -1,
      diffPercentage: -1,
      width: 0,
      height: 0,
      threshold,
      error: `Baseline image not found: ${baselinePath}`,
    };
  }

  if (!fs.existsSync(currentPath)) {
    return {
      match: false,
      diffCount: -1,
      diffPercentage: -1,
      width: 0,
      height: 0,
      threshold,
      error: `Current image not found: ${currentPath}`,
    };
  }

  try {
    // Read images
    const baseline = await readPng(baselinePath);
    const current = await readPng(currentPath);

    // Check dimensions match
    if (baseline.width !== current.width || baseline.height !== current.height) {
      return {
        match: false,
        diffCount: -1,
        diffPercentage: 100,
        width: Math.max(baseline.width, current.width),
        height: Math.max(baseline.height, current.height),
        threshold,
        error: `Image dimensions don't match: baseline(${baseline.width}x${baseline.height}) vs current(${current.width}x${current.height})`,
      };
    }

    const { width, height } = baseline;
    const totalPixels = width * height;

    // Create diff image buffer
    const diff = new PNG({ width, height });

    // Compare images
    const diffCount = pixelmatch(
      baseline.data,
      current.data,
      diff.data,
      width,
      height,
      {
        threshold,
        includeAA,
        alpha,
        diffColor,
        diffColorAlt: [0, 255, 0, 255], // Green for anti-aliased
      }
    );

    const diffPercentage = (diffCount / totalPixels) * 100;
    const match = diffCount === 0;

    // Save diff image if requested
    let diffImagePath: string | undefined;
    if (outputDiff && diffCount > 0) {
      diffImagePath = outputPath || generateDiffPath(currentPath);
      await writePng(diff, diffImagePath);
    }

    return {
      match,
      diffCount,
      diffPercentage,
      diffImagePath,
      width,
      height,
      threshold,
    };
  } catch (error) {
    return {
      match: false,
      diffCount: -1,
      diffPercentage: -1,
      width: 0,
      height: 0,
      threshold,
      error: error instanceof Error ? error.message : 'Unknown error during comparison',
    };
  }
}

/**
 * Read a PNG file
 */
async function readPng(filePath: string): Promise<PNGInstance> {
  return new Promise((resolve, reject) => {
    if (!PNG) {
      reject(new Error('pngjs not available'));
      return;
    }

    const png = new PNG();

    fs.createReadStream(filePath)
      .pipe(png as unknown as NodeJS.WritableStream)
      .on('parsed', function (this: PNGInstance) {
        resolve(this);
      })
      .on('error', reject);
  });
}

/**
 * Write a PNG file
 */
async function writePng(
  png: PNGInstance,
  filePath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const stream = fs.createWriteStream(filePath);
    png.pack().pipe(stream);

    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

/**
 * Generate a diff image path from the current image path
 */
function generateDiffPath(currentPath: string): string {
  const parsed = path.parse(currentPath);
  return path.join(parsed.dir, `${parsed.name}.diff${parsed.ext}`);
}

/**
 * Batch compare multiple image pairs
 */
export async function batchCompare(
  pairs: Array<{ baseline: string; current: string; name: string }>,
  options: ComparisonOptions = {}
): Promise<Map<string, ImageComparisonResult>> {
  const results = new Map<string, ImageComparisonResult>();

  for (const pair of pairs) {
    const result = await compareImages(pair.baseline, pair.current, options);
    results.set(pair.name, result);
  }

  return results;
}

/**
 * Calculate overall visual diff summary
 */
export function summarizeResults(
  results: Map<string, ImageComparisonResult>
): {
  total: number;
  matched: number;
  changed: number;
  errors: number;
  overallMatch: boolean;
} {
  let matched = 0;
  let changed = 0;
  let errors = 0;

  for (const result of results.values()) {
    if (result.error) {
      errors++;
    } else if (result.match) {
      matched++;
    } else {
      changed++;
    }
  }

  return {
    total: results.size,
    matched,
    changed,
    errors,
    overallMatch: changed === 0 && errors === 0,
  };
}
