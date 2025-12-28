import { z } from 'zod';

/**
 * Schema for ColorScale
 */
export const ColorScaleSchema = z.object({
  50: z.string(),
  100: z.string(),
  200: z.string(),
  300: z.string(),
  400: z.string(),
  500: z.string(),
  600: z.string(),
  700: z.string(),
  800: z.string(),
  900: z.string(),
});

export type ColorScale = z.infer<typeof ColorScaleSchema>;

/**
 * Schema for ColorPalette
 */
export const ColorPaletteSchema = z.object({
  primary: ColorScaleSchema,
  secondary: ColorScaleSchema,
  neutral: ColorScaleSchema,
  semantic: z.object({
    success: z.string(),
    warning: z.string(),
    error: z.string(),
    info: z.string(),
  }),
});

export type ColorPalette = z.infer<typeof ColorPaletteSchema>;

/**
 * Schema for TypographySpec
 */
export const TypographySpecSchema = z.object({
  fontFamily: z.object({
    heading: z.string(),
    body: z.string(),
    mono: z.string(),
  }),
  sizes: z.record(z.object({
    fontSize: z.number(),
    lineHeight: z.number(),
  })),
  weights: z.record(z.number()),
});

export type TypographySpec = z.infer<typeof TypographySpecSchema>;

/**
 * Schema for ComponentSpec
 */
export const ComponentSpecSchema = z.object({
  name: z.string(),
  description: z.string(),
  props: z.array(z.object({
    name: z.string(),
    type: z.string(),
    required: z.boolean().optional(),
    default: z.unknown().optional(),
  })),
  variants: z.array(z.string()).optional(),
  examples: z.array(z.string()).optional(),
});

export type ComponentSpec = z.infer<typeof ComponentSpecSchema>;

/**
 * Schema for ScreenSpec
 */
export const ScreenSpecSchema = z.object({
  name: z.string(),
  path: z.string(),
  description: z.string(),
  components: z.array(z.string()),
  layout: z.string().optional(),
  interactions: z.array(z.string()).optional(),
});

export type ScreenSpec = z.infer<typeof ScreenSpecSchema>;

/**
 * Schema for NavigationSpec
 */
export const NavigationSpecSchema = z.object({
  type: z.enum(['stack', 'tab', 'drawer', 'hybrid']),
  routes: z.array(z.object({
    name: z.string(),
    screen: z.string(),
    params: z.record(z.string()).optional(),
  })),
  deepLinks: z.array(z.object({
    path: z.string(),
    screen: z.string(),
  })),
});

export type NavigationSpec = z.infer<typeof NavigationSpecSchema>;

/**
 * Schema for AnimationSpec
 */
export const AnimationSpecSchema = z.object({
  name: z.string(),
  type: z.enum(['transition', 'gesture', 'loading', 'feedback']),
  duration: z.number(),
  easing: z.string(),
  description: z.string(),
});

export type AnimationSpec = z.infer<typeof AnimationSpecSchema>;

/**
 * Schema for UIDesignOutput
 */
export const UIDesignOutputSchema = z.object({
  colorPalette: ColorPaletteSchema,
  typography: TypographySpecSchema,
  components: z.array(ComponentSpecSchema),
  screens: z.array(ScreenSpecSchema),
  navigationFlow: NavigationSpecSchema,
  animations: z.array(AnimationSpecSchema),
  accessibilityNotes: z.array(z.string()),
});

export type UIDesignOutput = z.infer<typeof UIDesignOutputSchema>;
