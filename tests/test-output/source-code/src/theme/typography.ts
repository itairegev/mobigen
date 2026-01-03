export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  '6xl': 60,
} as const;

export const fontWeights = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const lineHeights = {
  tight: 1.2,
  snug: 1.4,
  normal: 1.5,
  relaxed: 1.6,
  loose: 1.8,
} as const;

export const fontFamilies = {
  sans: 'System',
  serif: 'Times',
  mono: 'Courier',
} as const;

export const typography = {
  // Headings
  h1: {
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
    fontFamily: fontFamilies.sans,
  },
  h2: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
    fontFamily: fontFamilies.sans,
  },
  h3: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.snug,
    fontFamily: fontFamilies.sans,
  },
  h4: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.snug,
    fontFamily: fontFamilies.sans,
  },
  h5: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.normal,
    fontFamily: fontFamilies.sans,
  },
  h6: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.normal,
    fontFamily: fontFamilies.sans,
  },
  
  // Body text
  body: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    fontFamily: fontFamilies.sans,
  },
  bodyLarge: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.relaxed,
    fontFamily: fontFamilies.sans,
  },
  bodySmall: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    fontFamily: fontFamilies.sans,
  },
  
  // Specialized text
  caption: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.snug,
    fontFamily: fontFamilies.sans,
  },
  overline: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.snug,
    fontFamily: fontFamilies.sans,
    letterSpacing: 0.5,
  },
  
  // Article specific
  articleTitle: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
    fontFamily: fontFamilies.sans,
  },
  articleSummary: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.relaxed,
    fontFamily: fontFamilies.sans,
  },
  articleContent: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.loose,
    fontFamily: fontFamilies.sans,
  },
  
  // Interactive elements
  buttonText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.snug,
    fontFamily: fontFamilies.sans,
  },
  linkText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
    fontFamily: fontFamilies.sans,
  },
  inputText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    fontFamily: fontFamilies.sans,
  },
  
  // Navigation
  tabLabel: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.snug,
    fontFamily: fontFamilies.sans,
  },
  
} as const;

export type TypographyVariant = keyof typeof typography;