/**
 * Component Converter
 * Converts Figma frames to React Native component structures
 */

import type { FigmaNode, FigmaFrame, ConvertedComponent } from '../../types';

export interface ConversionConfig {
  includeHidden?: boolean;
  flattenGroups?: boolean;
  detectButtons?: boolean;
  detectLists?: boolean;
}

export class ComponentConverter {
  private config: Required<ConversionConfig>;

  constructor(config?: ConversionConfig) {
    this.config = {
      includeHidden: config?.includeHidden ?? false,
      flattenGroups: config?.flattenGroups ?? true,
      detectButtons: config?.detectButtons ?? true,
      detectLists: config?.detectLists ?? true,
    };
  }

  /**
   * Convert a Figma frame to a React Native component tree
   */
  convert(node: FigmaNode): ConvertedComponent {
    return this.convertNode(node);
  }

  /**
   * Convert a single node
   */
  private convertNode(node: FigmaNode): ConvertedComponent {
    // Skip hidden nodes unless configured otherwise
    if (!this.config.includeHidden && node.visible === false) {
      return this.createEmptyComponent(node);
    }

    const componentType = this.inferComponentType(node);
    const component: ConvertedComponent = {
      id: node.id,
      name: node.name,
      type: componentType,
    };

    // Extract layout properties for frames
    if ('layoutMode' in node) {
      component.layout = this.extractLayout(node);
    }

    // Extract size
    if (node.absoluteBoundingBox) {
      component.size = {
        width: node.absoluteBoundingBox.width,
        height: node.absoluteBoundingBox.height,
      };
    }

    // Extract background
    if ('fills' in node && node.fills && node.fills.length > 0) {
      const solidFill = node.fills.find(f => f.type === 'SOLID' && f.visible !== false);
      if (solidFill?.color) {
        component.background = {
          backgroundColor: this.colorToHex(solidFill.color),
        };
      }
    }

    // Extract border
    if ('cornerRadius' in node || ('strokes' in node && node.strokes?.length)) {
      component.border = {};
      if ('cornerRadius' in node) {
        component.border.borderRadius = node.cornerRadius;
      }
      if ('strokes' in node && node.strokes?.length) {
        const stroke = node.strokes[0];
        if (stroke.color) {
          component.border.borderColor = this.colorToHex(stroke.color);
          component.border.borderWidth = 1;
        }
      }
    }

    // Extract spacing
    if ('paddingTop' in node) {
      component.spacing = {
        paddingTop: node.paddingTop,
        paddingRight: node.paddingRight,
        paddingBottom: node.paddingBottom,
        paddingLeft: node.paddingLeft,
      };
    }

    // Extract text content
    if (node.type === 'TEXT' && 'characters' in node) {
      component.text = node.characters;
      if ('style' in node && node.style) {
        component.typography = {
          fontSize: node.style.fontSize,
          fontWeight: String(node.style.fontWeight),
          fontFamily: node.style.fontFamily,
          lineHeight: node.style.lineHeightPx,
          letterSpacing: node.style.letterSpacing,
          textAlign: this.mapTextAlign(node.style.textAlignHorizontal),
        };
      }
    }

    // Extract effects
    if ('effects' in node && node.effects?.length) {
      const shadow = node.effects.find(e => e.type === 'DROP_SHADOW' && e.visible !== false);
      if (shadow) {
        component.effects = {
          shadowColor: shadow.color ? this.colorToHex(shadow.color) : '#000000',
          shadowOffset: { width: shadow.offset?.x || 0, height: shadow.offset?.y || 0 },
          shadowOpacity: shadow.color?.a || 0.25,
          shadowRadius: shadow.radius || 4,
        };
      }
    }

    // Convert children recursively
    if ('children' in node && node.children) {
      component.children = node.children
        .filter(child => this.config.includeHidden || child.visible !== false)
        .map(child => this.convertNode(child));
    }

    return component;
  }

  /**
   * Infer component type from node properties
   */
  private inferComponentType(node: FigmaNode): ConvertedComponent['type'] {
    const name = node.name.toLowerCase();

    // Text nodes
    if (node.type === 'TEXT') {
      return 'Text';
    }

    // Detect buttons
    if (this.config.detectButtons) {
      if (name.includes('button') || name.includes('btn') || name.includes('cta')) {
        return 'Button';
      }
    }

    // Image detection (nodes with image fills)
    if ('fills' in node && node.fills?.some(f => f.type === 'IMAGE')) {
      return 'Image';
    }

    // Default to Frame/Container
    return 'Frame';
  }

  /**
   * Extract layout properties
   */
  private extractLayout(node: FigmaFrame): ConvertedComponent['layout'] {
    const layout: ConvertedComponent['layout'] = {};

    if (node.layoutMode === 'HORIZONTAL') {
      layout.flexDirection = 'row';
    } else if (node.layoutMode === 'VERTICAL') {
      layout.flexDirection = 'column';
    }

    if (node.primaryAxisAlignItems) {
      layout.justifyContent = this.mapAxisAlign(node.primaryAxisAlignItems);
    }

    if (node.counterAxisAlignItems) {
      layout.alignItems = this.mapCounterAxisAlign(node.counterAxisAlignItems);
    }

    if (node.itemSpacing) {
      layout.gap = node.itemSpacing;
    }

    return layout;
  }

  /**
   * Map Figma axis alignment to flexbox
   */
  private mapAxisAlign(align?: string): string {
    const map: Record<string, string> = {
      MIN: 'flex-start',
      CENTER: 'center',
      MAX: 'flex-end',
      SPACE_BETWEEN: 'space-between',
    };
    return map[align || 'MIN'] || 'flex-start';
  }

  /**
   * Map counter axis alignment
   */
  private mapCounterAxisAlign(align?: string): string {
    const map: Record<string, string> = {
      MIN: 'flex-start',
      CENTER: 'center',
      MAX: 'flex-end',
      BASELINE: 'baseline',
    };
    return map[align || 'MIN'] || 'stretch';
  }

  /**
   * Map text alignment
   */
  private mapTextAlign(align?: string): string {
    const map: Record<string, string> = {
      LEFT: 'left',
      CENTER: 'center',
      RIGHT: 'right',
      JUSTIFIED: 'justify',
    };
    return map[align || 'LEFT'] || 'left';
  }

  /**
   * Convert Figma color to hex
   */
  private colorToHex(color: { r: number; g: number; b: number; a?: number }): string {
    const toHex = (n: number) =>
      Math.round(n * 255)
        .toString(16)
        .padStart(2, '0');
    return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`.toUpperCase();
  }

  /**
   * Create empty component placeholder
   */
  private createEmptyComponent(node: FigmaNode): ConvertedComponent {
    return {
      id: node.id,
      name: node.name,
      type: 'Frame',
    };
  }
}

export default ComponentConverter;
