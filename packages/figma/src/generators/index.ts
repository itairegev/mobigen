/**
 * Code Generators
 * Generates React Native code from Figma designs
 */

import type { DesignTokens, ConvertedComponent } from '../types';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STYLE GENERATOR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface StyleResult {
  className: string;
  inlineStyle?: Record<string, string | number>;
}

export class StyleGenerator {
  /**
   * Generate NativeWind classes and inline styles from component
   */
  generate(component: ConvertedComponent): StyleResult {
    const classes: string[] = [];
    const inlineStyle: Record<string, string | number> = {};

    // Layout
    if (component.layout) {
      if (component.layout.flexDirection === 'row') classes.push('flex-row');
      if (component.layout.flexDirection === 'column') classes.push('flex-col');
      if (component.layout.justifyContent) classes.push(this.mapJustify(component.layout.justifyContent));
      if (component.layout.alignItems) classes.push(this.mapAlign(component.layout.alignItems));
      if (component.layout.gap) {
        const gapClass = this.mapSpacing(component.layout.gap, 'gap');
        if (gapClass) classes.push(gapClass);
      }
    }

    // Size
    if (component.size) {
      if (component.size.width === 'full') classes.push('w-full');
      else if (typeof component.size.width === 'number') {
        const widthClass = this.mapSize(component.size.width, 'w');
        if (widthClass) classes.push(widthClass);
        else inlineStyle.width = component.size.width;
      }

      if (component.size.height === 'full') classes.push('h-full');
      else if (typeof component.size.height === 'number') {
        const heightClass = this.mapSize(component.size.height, 'h');
        if (heightClass) classes.push(heightClass);
        else inlineStyle.height = component.size.height;
      }
    }

    // Background
    if (component.background?.backgroundColor) {
      const bgClass = this.mapColor(component.background.backgroundColor, 'bg');
      if (bgClass) classes.push(bgClass);
      else inlineStyle.backgroundColor = component.background.backgroundColor;
    }

    // Border
    if (component.border) {
      if (component.border.borderRadius) {
        const roundedClass = this.mapBorderRadius(component.border.borderRadius);
        if (roundedClass) classes.push(roundedClass);
        else inlineStyle.borderRadius = component.border.borderRadius;
      }
      if (component.border.borderWidth) classes.push('border');
    }

    // Spacing
    if (component.spacing?.padding) {
      const pClass = this.mapSpacing(component.spacing.padding, 'p');
      if (pClass) classes.push(pClass);
    }

    // Typography
    if (component.typography) {
      if (component.typography.fontSize) {
        const textClass = this.mapFontSize(component.typography.fontSize);
        if (textClass) classes.push(textClass);
        else inlineStyle.fontSize = component.typography.fontSize;
      }
      if (component.typography.fontWeight) {
        const weightClass = this.mapFontWeight(component.typography.fontWeight);
        if (weightClass) classes.push(weightClass);
      }
      if (component.typography.textAlign) {
        classes.push(`text-${component.typography.textAlign}`);
      }
    }

    return {
      className: classes.join(' '),
      inlineStyle: Object.keys(inlineStyle).length > 0 ? inlineStyle : undefined,
    };
  }

  private mapJustify(value: string): string {
    const map: Record<string, string> = {
      'flex-start': 'justify-start',
      'flex-end': 'justify-end',
      'center': 'justify-center',
      'space-between': 'justify-between',
    };
    return map[value] || 'justify-start';
  }

  private mapAlign(value: string): string {
    const map: Record<string, string> = {
      'flex-start': 'items-start',
      'flex-end': 'items-end',
      'center': 'items-center',
      'stretch': 'items-stretch',
    };
    return map[value] || 'items-stretch';
  }

  private mapSpacing(value: number, prefix: string): string | null {
    const scale: Record<number, string> = {
      4: '1', 8: '2', 12: '3', 16: '4', 20: '5', 24: '6', 32: '8', 40: '10', 48: '12',
    };
    return scale[value] ? `${prefix}-${scale[value]}` : null;
  }

  private mapSize(value: number, prefix: string): string | null {
    const scale: Record<number, string> = {
      16: '4', 24: '6', 32: '8', 48: '12', 64: '16', 96: '24', 128: '32',
    };
    return scale[value] ? `${prefix}-${scale[value]}` : null;
  }

  private mapColor(hex: string, prefix: string): string | null {
    const colors: Record<string, string> = {
      '#FFFFFF': 'white', '#000000': 'black',
      '#F3F4F6': 'gray-100', '#E5E7EB': 'gray-200', '#6B7280': 'gray-500',
    };
    return colors[hex.toUpperCase()] ? `${prefix}-${colors[hex.toUpperCase()]}` : null;
  }

  private mapBorderRadius(value: number): string | null {
    const scale: Record<number, string> = {
      2: 'rounded-sm', 4: 'rounded', 6: 'rounded-md', 8: 'rounded-lg',
      12: 'rounded-xl', 16: 'rounded-2xl', 9999: 'rounded-full',
    };
    return scale[value] || null;
  }

  private mapFontSize(value: number): string | null {
    const scale: Record<number, string> = {
      12: 'text-xs', 14: 'text-sm', 16: 'text-base', 18: 'text-lg',
      20: 'text-xl', 24: 'text-2xl', 30: 'text-3xl', 36: 'text-4xl',
    };
    return scale[value] || null;
  }

  private mapFontWeight(value: string): string | null {
    const scale: Record<string, string> = {
      '400': 'font-normal', '500': 'font-medium', '600': 'font-semibold', '700': 'font-bold',
    };
    return scale[value] || null;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// THEME GENERATOR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface ThemeConfig {
  colors: Record<string, Record<string, string>>;
  fontSize: Record<string, [string, { lineHeight: string }]>;
  spacing: Record<string, string>;
}

export class ThemeGenerator {
  /**
   * Generate Tailwind theme config from design tokens
   */
  generate(tokens: DesignTokens): ThemeConfig {
    return {
      colors: this.generateColors(tokens.colors),
      fontSize: this.generateFontSizes(tokens.typography),
      spacing: this.generateSpacing(tokens.spacing),
    };
  }

  /**
   * Generate theme.config.ts content
   */
  generateThemeFile(tokens: DesignTokens): string {
    const config = this.generate(tokens);
    return `/**
 * Tailwind/NativeWind Theme Configuration
 * Generated from Figma design tokens
 */

module.exports = {
  theme: {
    colors: ${JSON.stringify(config.colors, null, 2)},
    fontSize: ${JSON.stringify(config.fontSize, null, 2)},
    spacing: ${JSON.stringify(config.spacing, null, 2)},
  },
};
`;
  }

  private generateColors(tokens: DesignTokens['colors']): Record<string, Record<string, string>> {
    const colors: Record<string, Record<string, string>> = {};
    for (const token of tokens) {
      const parts = token.name.split('/');
      if (parts.length === 2) {
        if (!colors[parts[0]]) colors[parts[0]] = {};
        colors[parts[0]][parts[1]] = token.value;
      } else {
        colors[token.name] = { DEFAULT: token.value };
      }
    }
    return colors;
  }

  private generateFontSizes(tokens: DesignTokens['typography']): Record<string, [string, { lineHeight: string }]> {
    const sizes: Record<string, [string, { lineHeight: string }]> = {};
    for (const token of tokens) {
      sizes[token.name] = [`${token.fontSize}px`, { lineHeight: `${token.lineHeight}px` }];
    }
    return sizes;
  }

  private generateSpacing(tokens: DesignTokens['spacing']): Record<string, string> {
    const spacing: Record<string, string> = {};
    for (const token of tokens) {
      spacing[String(token.value / 4)] = `${token.value / 16}rem`;
    }
    return spacing;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMPONENT GENERATOR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface GeneratedFile {
  filename: string;
  content: string;
}

export class ComponentGenerator {
  private styleGenerator: StyleGenerator;

  constructor() {
    this.styleGenerator = new StyleGenerator();
  }

  /**
   * Generate a React Native component file
   */
  generate(component: ConvertedComponent): GeneratedFile {
    const componentName = this.sanitizeName(component.name);
    const componentCode = this.generateComponentCode(component, 2);

    const content = `import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';

export default function ${componentName}() {
  return (
${componentCode}
  );
}
`;

    return {
      filename: `${componentName}.tsx`,
      content,
    };
  }

  private generateComponentCode(component: ConvertedComponent, indent: number): string {
    const spaces = '  '.repeat(indent);
    const { className, inlineStyle } = this.styleGenerator.generate(component);
    const tag = this.getTag(component.type);

    let props = `\n${spaces}  testID="${component.id}"`;
    if (className) props += `\n${spaces}  className="${className}"`;
    if (inlineStyle) props += `\n${spaces}  style={${JSON.stringify(inlineStyle)}}`;

    if (component.type === 'Text') {
      return `${spaces}<${tag}${props}>\n${spaces}  ${component.text || ''}\n${spaces}</${tag}>`;
    }

    if (component.type === 'Image') {
      return `${spaces}<${tag}${props}\n${spaces}  source={{ uri: '${component.source || ''}' }}\n${spaces}/>`;
    }

    if (!component.children || component.children.length === 0) {
      return `${spaces}<${tag}${props} />`;
    }

    const children = component.children
      .map(child => this.generateComponentCode(child, indent + 1))
      .join('\n');

    return `${spaces}<${tag}${props}>\n${children}\n${spaces}</${tag}>`;
  }

  private getTag(type: string): string {
    switch (type) {
      case 'Text': return 'Text';
      case 'Image': return 'Image';
      case 'Button': return 'Pressable';
      default: return 'View';
    }
  }

  private sanitizeName(name: string): string {
    const sanitized = name.replace(/[^a-zA-Z0-9]/g, '');
    return sanitized.charAt(0).toUpperCase() + sanitized.slice(1) || 'Component';
  }
}

export default { StyleGenerator, ThemeGenerator, ComponentGenerator };
