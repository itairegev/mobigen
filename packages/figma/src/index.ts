/**
 * Mobigen Figma Integration
 *
 * Complete Figma design import for React Native apps
 *
 * @packageDocumentation
 */

// Core types
export * from './types';

// Figma API Client
export { FigmaClient } from './client';
export type { FigmaClientConfig, GetFileOptions, GetImagesOptions } from './client';

// URL Parser
export { FigmaUrlParser } from './parser';
export type { ParsedFigmaUrl, ValidationResult } from './parser';

// Token Extraction
export { TokenExtractor } from './extractors/tokens';
export type { TokenExtractionConfig } from './extractors/tokens';

// Component Conversion
export { ComponentConverter } from './extractors/components';
export type { ConversionConfig } from './extractors/components';

// Asset Extraction
export { AssetExtractor, AssetUploader } from './extractors/assets';
export type { AssetExtractionOptions, AssetUploadOptions } from './extractors/assets';

// Code Generation
export { StyleGenerator, ThemeGenerator, ComponentGenerator } from './generators';
export type { StyleResult, ThemeConfig, GeneratedFile } from './generators';

// UI Components & Hooks
export {
  useFigmaImport,
  useImportProgress,
  useFigmaAuth,
} from './ui';
export type {
  ImportStep,
  ImportWizardProps,
  FrameInfo,
  ImportProgress,
  UrlValidationResult,
  ImportWizardState,
} from './ui';
