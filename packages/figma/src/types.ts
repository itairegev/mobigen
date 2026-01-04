/**
 * Figma Integration Types
 * Core type definitions for Figma import functionality
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FIGMA API TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface FigmaFile {
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
  document: FigmaDocument;
  components: Record<string, FigmaComponent>;
  styles: Record<string, FigmaStyle>;
}

export interface FigmaDocument {
  id: string;
  name: string;
  type: 'DOCUMENT';
  children: FigmaNode[];
}

export type FigmaNode = FigmaFrame | FigmaComponent | FigmaText | FigmaRectangle | FigmaVector;

export interface FigmaBaseNode {
  id: string;
  name: string;
  type: string;
  visible?: boolean;
  locked?: boolean;
  children?: FigmaNode[];
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  fills?: FigmaFill[];
  strokes?: FigmaStroke[];
  effects?: FigmaEffect[];
  opacity?: number;
}

export interface FigmaFrame extends FigmaBaseNode {
  type: 'FRAME' | 'GROUP' | 'COMPONENT' | 'INSTANCE';
  layoutMode?: 'HORIZONTAL' | 'VERTICAL' | 'NONE';
  primaryAxisSizingMode?: 'FIXED' | 'AUTO';
  counterAxisSizingMode?: 'FIXED' | 'AUTO';
  primaryAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
  counterAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'BASELINE';
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  itemSpacing?: number;
  cornerRadius?: number;
  cornerSmoothing?: number;
}

export interface FigmaComponent {
  key: string;
  name: string;
  description: string;
  documentationLinks?: string[];
}

export interface FigmaText extends FigmaBaseNode {
  type: 'TEXT';
  characters: string;
  style?: FigmaTextStyle;
}

export interface FigmaRectangle extends FigmaBaseNode {
  type: 'RECTANGLE';
  cornerRadius?: number;
}

export interface FigmaVector extends FigmaBaseNode {
  type: 'VECTOR' | 'LINE' | 'ELLIPSE' | 'POLYGON' | 'STAR' | 'BOOLEAN_OPERATION';
}

export interface FigmaFill {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'IMAGE';
  visible?: boolean;
  opacity?: number;
  color?: FigmaColor;
  imageRef?: string;
}

export interface FigmaStroke {
  type: 'SOLID' | 'GRADIENT_LINEAR';
  color?: FigmaColor;
  opacity?: number;
}

export interface FigmaEffect {
  type: 'DROP_SHADOW' | 'INNER_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR';
  visible?: boolean;
  color?: FigmaColor;
  offset?: { x: number; y: number };
  radius?: number;
  spread?: number;
}

export interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface FigmaTextStyle {
  fontFamily: string;
  fontPostScriptName?: string;
  fontWeight: number;
  fontSize: number;
  textAlignHorizontal?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
  textAlignVertical?: 'TOP' | 'CENTER' | 'BOTTOM';
  letterSpacing?: number;
  lineHeightPx?: number;
  lineHeightPercent?: number;
}

export interface FigmaStyle {
  key: string;
  name: string;
  styleType: 'FILL' | 'TEXT' | 'EFFECT' | 'GRID';
  description?: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DESIGN TOKENS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface DesignTokens {
  colors: ColorToken[];
  typography: TypographyToken[];
  spacing: SpacingToken[];
  effects: EffectToken[];
  metadata: {
    extractedAt: string;
    figmaFileKey: string;
    sourcePages: string[];
    version: string;
  };
}

export interface ColorToken {
  name: string;
  value: string;
  rgb: { r: number; g: number; b: number };
  opacity: number;
  usage?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'semantic';
}

export interface TypographyToken {
  name: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}

export interface SpacingToken {
  name: string;
  value: number;
  usage?: 'padding' | 'margin' | 'gap';
}

export interface EffectToken {
  name: string;
  type: 'shadow' | 'blur';
  value: {
    x?: number;
    y?: number;
    blur: number;
    spread?: number;
    color?: string;
    opacity?: number;
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONVERTED COMPONENTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface ConvertedComponent {
  id: string;
  name: string;
  type: 'Frame' | 'Text' | 'Image' | 'Button' | 'Container';
  text?: string;
  source?: string;
  children?: ConvertedComponent[];
  layout?: {
    flexDirection?: 'row' | 'column';
    justifyContent?: string;
    alignItems?: string;
    gap?: number;
  };
  size?: {
    width?: number | 'auto' | 'full';
    height?: number | 'auto' | 'full';
  };
  background?: {
    backgroundColor?: string;
  };
  border?: {
    borderWidth?: number;
    borderRadius?: number;
    borderColor?: string;
  };
  spacing?: {
    padding?: number;
    paddingHorizontal?: number;
    paddingVertical?: number;
    paddingTop?: number;
    paddingRight?: number;
    paddingBottom?: number;
    paddingLeft?: number;
  };
  typography?: {
    fontSize?: number;
    fontWeight?: string;
    fontFamily?: string;
    lineHeight?: number;
    letterSpacing?: number;
    textAlign?: string;
    color?: string;
  };
  effects?: {
    shadowColor?: string;
    shadowOffset?: { width: number; height: number };
    shadowOpacity?: number;
    shadowRadius?: number;
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ASSET TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type AssetType = 'image' | 'icon' | 'vector' | 'logo' | 'illustration';
export type AssetFormat = 'svg' | 'png' | 'jpg' | 'webp';

export interface Asset {
  id: string;
  type: AssetType;
  format: AssetFormat;
  figmaNodeId: string;
  localPath: string;
  s3Key?: string;
  s3Url?: string;
  dimensions: { width: number; height: number; scale?: number };
  metadata: {
    originalName: string;
    semanticName: string;
    fileSize: number;
    hasTransparency: boolean;
    sourceNodeType: string;
  };
  extractedAt: Date;
  uploadedAt?: Date;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// IMPORT RESULT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface FigmaImportResult {
  tokens: DesignTokens;
  components: ConvertedComponent[];
  assets: Asset[];
  generatedFiles: {
    path: string;
    content: string;
    type: 'theme' | 'component' | 'screen' | 'asset';
  }[];
  metadata: {
    figmaUrl: string;
    fileKey: string;
    importedAt: Date;
    frameCount: number;
    tokenCount: number;
    componentCount: number;
    assetCount: number;
    duration: number;
  };
}
