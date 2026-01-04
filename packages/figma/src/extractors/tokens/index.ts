/**
 * Design Token Extractor
 * Extracts colors, typography, spacing, and effects from Figma files
 */

import type {
  FigmaFile,
  FigmaNode,
  FigmaColor,
  FigmaTextStyle,
  DesignTokens,
  ColorToken,
  TypographyToken,
  SpacingToken,
  EffectToken,
} from '../../types';

export interface TokenExtractionConfig {
  extractColors?: boolean;
  extractTypography?: boolean;
  extractSpacing?: boolean;
  extractEffects?: boolean;
  colorClustering?: boolean;
  minColorUsage?: number;
}

export class TokenExtractor {
  private config: Required<TokenExtractionConfig>;

  constructor(config?: TokenExtractionConfig) {
    this.config = {
      extractColors: config?.extractColors ?? true,
      extractTypography: config?.extractTypography ?? true,
      extractSpacing: config?.extractSpacing ?? true,
      extractEffects: config?.extractEffects ?? true,
      colorClustering: config?.colorClustering ?? true,
      minColorUsage: config?.minColorUsage ?? 1,
    };
  }

  /**
   * Extract all design tokens from a Figma file
   */
  async extract(file: FigmaFile): Promise<DesignTokens> {
    const colors: ColorToken[] = [];
    const typography: TypographyToken[] = [];
    const spacing: SpacingToken[] = [];
    const effects: EffectToken[] = [];

    // Traverse the document tree
    this.traverseNodes(file.document.children, {
      onColor: color => colors.push(color),
      onTypography: typo => typography.push(typo),
      onSpacing: space => spacing.push(space),
      onEffect: effect => effects.push(effect),
    });

    // Deduplicate and cluster
    const uniqueColors = this.deduplicateColors(colors);
    const uniqueTypography = this.deduplicateTypography(typography);
    const uniqueSpacing = this.deduplicateSpacing(spacing);
    const uniqueEffects = this.deduplicateEffects(effects);

    return {
      colors: uniqueColors,
      typography: uniqueTypography,
      spacing: uniqueSpacing,
      effects: uniqueEffects,
      metadata: {
        extractedAt: new Date().toISOString(),
        figmaFileKey: '',
        sourcePages: [],
        version: '1.0',
      },
    };
  }

  /**
   * Traverse nodes and extract tokens
   */
  private traverseNodes(
    nodes: FigmaNode[],
    callbacks: {
      onColor: (color: ColorToken) => void;
      onTypography: (typo: TypographyToken) => void;
      onSpacing: (space: SpacingToken) => void;
      onEffect: (effect: EffectToken) => void;
    }
  ): void {
    for (const node of nodes) {
      // Extract colors from fills
      if (this.config.extractColors && 'fills' in node && node.fills) {
        for (const fill of node.fills) {
          if (fill.type === 'SOLID' && fill.color) {
            callbacks.onColor(this.extractColor(fill.color, node.name));
          }
        }
      }

      // Extract typography
      if (this.config.extractTypography && node.type === 'TEXT' && 'style' in node && node.style) {
        callbacks.onTypography(this.extractTypography(node.style, node.name));
      }

      // Extract spacing from frames
      if (this.config.extractSpacing && 'paddingTop' in node) {
        const spacing = this.extractSpacing(node);
        spacing.forEach(s => callbacks.onSpacing(s));
      }

      // Extract effects
      if (this.config.extractEffects && 'effects' in node && node.effects) {
        for (const effect of node.effects) {
          if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
            callbacks.onEffect(this.extractEffect(effect, node.name));
          }
        }
      }

      // Recurse into children
      if ('children' in node && node.children) {
        this.traverseNodes(node.children, callbacks);
      }
    }
  }

  /**
   * Extract a color token
   */
  private extractColor(color: FigmaColor, nodeName: string): ColorToken {
    const hex = this.rgbaToHex(color.r, color.g, color.b);
    return {
      name: this.generateColorName(hex, nodeName),
      value: hex,
      rgb: { r: Math.round(color.r * 255), g: Math.round(color.g * 255), b: Math.round(color.b * 255) },
      opacity: color.a,
    };
  }

  /**
   * Extract typography token
   */
  private extractTypography(style: FigmaTextStyle, nodeName: string): TypographyToken {
    return {
      name: this.generateTypographyName(style, nodeName),
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      lineHeight: style.lineHeightPx || style.fontSize * 1.5,
      letterSpacing: style.letterSpacing,
    };
  }

  /**
   * Extract spacing tokens
   */
  private extractSpacing(node: any): SpacingToken[] {
    const tokens: SpacingToken[] = [];

    const spacings = [
      node.paddingTop,
      node.paddingRight,
      node.paddingBottom,
      node.paddingLeft,
      node.itemSpacing,
    ].filter(s => s !== undefined && s > 0);

    const unique = [...new Set(spacings)];
    for (const value of unique) {
      tokens.push({
        name: `spacing-${value}`,
        value,
      });
    }

    return tokens;
  }

  /**
   * Extract effect token
   */
  private extractEffect(effect: any, nodeName: string): EffectToken {
    return {
      name: `shadow-${nodeName}`.toLowerCase().replace(/\s+/g, '-'),
      type: 'shadow',
      value: {
        x: effect.offset?.x || 0,
        y: effect.offset?.y || 0,
        blur: effect.radius || 0,
        spread: effect.spread || 0,
        color: effect.color ? this.rgbaToHex(effect.color.r, effect.color.g, effect.color.b) : '#000000',
        opacity: effect.color?.a || 0.25,
      },
    };
  }

  /**
   * Convert RGBA to hex
   */
  private rgbaToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) =>
      Math.round(n * 255)
        .toString(16)
        .padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }

  /**
   * Generate color name from hex value
   */
  private generateColorName(hex: string, nodeName: string): string {
    const name = nodeName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `color-${name}-${hex.slice(1, 5)}`;
  }

  /**
   * Generate typography name
   */
  private generateTypographyName(style: FigmaTextStyle, nodeName: string): string {
    const weight = style.fontWeight >= 700 ? 'bold' : style.fontWeight >= 500 ? 'medium' : 'regular';
    const size = style.fontSize <= 12 ? 'xs' : style.fontSize <= 14 ? 'sm' : style.fontSize <= 16 ? 'base' : style.fontSize <= 20 ? 'lg' : style.fontSize <= 24 ? 'xl' : '2xl';
    return `text-${size}-${weight}`;
  }

  /**
   * Deduplicate colors
   */
  private deduplicateColors(colors: ColorToken[]): ColorToken[] {
    const seen = new Map<string, ColorToken>();
    for (const color of colors) {
      if (!seen.has(color.value)) {
        seen.set(color.value, color);
      }
    }
    return Array.from(seen.values());
  }

  /**
   * Deduplicate typography
   */
  private deduplicateTypography(typography: TypographyToken[]): TypographyToken[] {
    const seen = new Map<string, TypographyToken>();
    for (const typo of typography) {
      const key = `${typo.fontFamily}-${typo.fontSize}-${typo.fontWeight}`;
      if (!seen.has(key)) {
        seen.set(key, typo);
      }
    }
    return Array.from(seen.values());
  }

  /**
   * Deduplicate spacing
   */
  private deduplicateSpacing(spacing: SpacingToken[]): SpacingToken[] {
    const seen = new Map<number, SpacingToken>();
    for (const space of spacing) {
      if (!seen.has(space.value)) {
        seen.set(space.value, space);
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.value - b.value);
  }

  /**
   * Deduplicate effects
   */
  private deduplicateEffects(effects: EffectToken[]): EffectToken[] {
    const seen = new Map<string, EffectToken>();
    for (const effect of effects) {
      const key = `${effect.value.blur}-${effect.value.x}-${effect.value.y}`;
      if (!seen.has(key)) {
        seen.set(key, effect);
      }
    }
    return Array.from(seen.values());
  }
}

export default TokenExtractor;
