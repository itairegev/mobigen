/**
 * Cursor Renderer - Visual rendering helpers for cursors
 */

import type { CursorDecoration, SelectionDecoration } from './cursor-manager.js';

export interface RenderOptions {
  showLabel?: boolean;
  showSelection?: boolean;
  labelPosition?: 'above' | 'below' | 'inline';
  cursorWidth?: number;
  selectionOpacity?: number;
  animationDuration?: number;
}

export interface CursorStyle {
  position: 'absolute';
  width: string;
  height: string;
  backgroundColor: string;
  transform?: string;
  transition?: string;
  zIndex: number;
  pointerEvents: 'none';
}

export interface LabelStyle {
  position: 'absolute';
  backgroundColor: string;
  color: string;
  padding: string;
  borderRadius: string;
  fontSize: string;
  fontWeight: string;
  whiteSpace: 'nowrap';
  transform?: string;
  opacity?: number;
  transition?: string;
  zIndex: number;
  pointerEvents: 'none';
}

export interface SelectionStyle {
  position: 'absolute';
  backgroundColor: string;
  opacity: number;
  pointerEvents: 'none';
}

export class CursorRenderer {
  private options: Required<RenderOptions>;

  constructor(options: RenderOptions = {}) {
    this.options = {
      showLabel: options.showLabel ?? true,
      showSelection: options.showSelection ?? true,
      labelPosition: options.labelPosition || 'above',
      cursorWidth: options.cursorWidth || 2,
      selectionOpacity: options.selectionOpacity || 0.3,
      animationDuration: options.animationDuration || 100,
    };
  }

  getCursorStyle(decoration: CursorDecoration, lineHeight: number): CursorStyle {
    return {
      position: 'absolute',
      width: `${this.options.cursorWidth}px`,
      height: `${lineHeight}px`,
      backgroundColor: decoration.color,
      transition: `transform ${this.options.animationDuration}ms ease-out`,
      zIndex: 100,
      pointerEvents: 'none',
    };
  }

  getLabelStyle(decoration: CursorDecoration): LabelStyle {
    const baseStyle: LabelStyle = {
      position: 'absolute',
      backgroundColor: decoration.color,
      color: this.getContrastColor(decoration.color),
      padding: '2px 6px',
      borderRadius: '3px',
      fontSize: '11px',
      fontWeight: '500',
      whiteSpace: 'nowrap',
      opacity: decoration.isActive ? 1 : 0.6,
      transition: `opacity ${this.options.animationDuration}ms ease-out`,
      zIndex: 101,
      pointerEvents: 'none',
    };

    switch (this.options.labelPosition) {
      case 'above':
        baseStyle.transform = 'translateY(-100%)';
        break;
      case 'below':
        baseStyle.transform = 'translateY(100%)';
        break;
      case 'inline':
        baseStyle.transform = 'translateX(4px)';
        break;
    }

    return baseStyle;
  }

  getSelectionStyle(decoration: SelectionDecoration): SelectionStyle {
    return {
      position: 'absolute',
      backgroundColor: this.hexToRgba(decoration.color, this.options.selectionOpacity),
      opacity: 1,
      pointerEvents: 'none',
    };
  }

  // Generate CSS class names for cursors
  getCursorClassName(userId: string): string {
    return `remote-cursor-${userId.replace(/[^a-zA-Z0-9]/g, '')}`;
  }

  getLabelClassName(userId: string): string {
    return `remote-cursor-label-${userId.replace(/[^a-zA-Z0-9]/g, '')}`;
  }

  getSelectionClassName(userId: string): string {
    return `remote-selection-${userId.replace(/[^a-zA-Z0-9]/g, '')}`;
  }

  // Generate CSS for a user's cursor
  generateCSS(decoration: CursorDecoration, lineHeight: number): string {
    const cursorClass = this.getCursorClassName(decoration.userId);
    const labelClass = this.getLabelClassName(decoration.userId);
    const cursorStyle = this.getCursorStyle(decoration, lineHeight);
    const labelStyle = this.getLabelStyle(decoration);

    return `
      .${cursorClass} {
        position: ${cursorStyle.position};
        width: ${cursorStyle.width};
        height: ${cursorStyle.height};
        background-color: ${cursorStyle.backgroundColor};
        transition: ${cursorStyle.transition};
        z-index: ${cursorStyle.zIndex};
        pointer-events: ${cursorStyle.pointerEvents};
      }

      .${labelClass} {
        position: ${labelStyle.position};
        background-color: ${labelStyle.backgroundColor};
        color: ${labelStyle.color};
        padding: ${labelStyle.padding};
        border-radius: ${labelStyle.borderRadius};
        font-size: ${labelStyle.fontSize};
        font-weight: ${labelStyle.fontWeight};
        white-space: ${labelStyle.whiteSpace};
        transform: ${labelStyle.transform || 'none'};
        opacity: ${labelStyle.opacity};
        transition: ${labelStyle.transition};
        z-index: ${labelStyle.zIndex};
        pointer-events: ${labelStyle.pointerEvents};
      }
    `.trim();
  }

  // Generate all CSS for multiple cursors
  generateAllCSS(decorations: CursorDecoration[], lineHeight: number): string {
    return decorations.map(d => this.generateCSS(d, lineHeight)).join('\n\n');
  }

  // Helper: Get contrasting text color
  private getContrastColor(hexColor: string): string {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? '#000000' : '#ffffff';
  }

  // Helper: Convert hex to rgba
  private hexToRgba(hex: string, alpha: number): string {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // Generate unique color for user
  static generateUserColor(userId: string): string {
    // Hash the userId to get a consistent color
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash = hash & hash;
    }

    // Use HSL for better color distribution
    const hue = Math.abs(hash % 360);
    const saturation = 70 + Math.abs((hash >> 8) % 20); // 70-90%
    const lightness = 45 + Math.abs((hash >> 16) % 15);  // 45-60%

    return CursorRenderer.hslToHex(hue, saturation, lightness);
  }

  // Helper: Convert HSL to hex
  private static hslToHex(h: number, s: number, l: number): string {
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
    else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
    else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
    else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
    else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }

    const toHex = (n: number) => {
      const hex = Math.round((n + m) * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
}

export function createCursorRenderer(options?: RenderOptions): CursorRenderer {
  return new CursorRenderer(options);
}
