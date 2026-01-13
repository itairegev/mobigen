# Mobigen 2.0 - Technical Architecture

**Version:** 2.0
**Date:** January 2026
**Status:** Active
**Related:** [PRD.md](./PRD.md)

---

## Executive Summary

This document outlines the technical architecture for Mobigen 2.0's three-tier progressive experience: **Instant Mockup** (<3 seconds), **Native Preview** (3-5 minutes), and **Production Build** (10-15 minutes). The architecture focuses on delivering immediate visual feedback while optimizing the native build pipeline.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              MOBIGEN 2.0 ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           CLIENT LAYER                                   │   │
│  │                                                                          │   │
│  │   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐             │   │
│  │   │ Mockup       │    │ Build        │    │ Chat         │             │   │
│  │   │ Viewer       │    │ Progress     │    │ Interface    │             │   │
│  │   │ (React)      │    │ (WebSocket)  │    │ (AI)         │             │   │
│  │   └──────────────┘    └──────────────┘    └──────────────┘             │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                       │                                         │
│                                       ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           API GATEWAY                                    │   │
│  │                                                                          │   │
│  │   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐             │   │
│  │   │ Mockup API   │    │ Generation   │    │ Build API    │             │   │
│  │   │ /api/mockup  │    │ /api/generate│    │ /api/build   │             │   │
│  │   └──────────────┘    └──────────────┘    └──────────────┘             │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                       │                                         │
│                    ┌──────────────────┼──────────────────┐                     │
│                    ▼                  ▼                  ▼                     │
│  ┌──────────────────────┐ ┌──────────────────┐ ┌──────────────────────┐       │
│  │   MOCKUP SERVICE     │ │  REQUEST ROUTER  │ │  GENERATOR SERVICE   │       │
│  │                      │ │                  │ │                      │       │
│  │ • Asset Manager      │ │ • Classifier     │ │ • AI Agents          │       │
│  │ • Color Transformer  │ │ • Pipeline Select│ │ • Code Generation    │       │
│  │ • Logo Injector      │ │ • Complexity Est │ │ • Validation         │       │
│  └──────────────────────┘ └──────────────────┘ └──────────────────────┘       │
│                                       │                                         │
│                                       ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        BUILD PIPELINE SERVICE                            │   │
│  │                                                                          │   │
│  │   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐             │   │
│  │   │ Template     │    │ Metro        │    │ Expo EAS     │             │   │
│  │   │ Cache        │    │ Bundler      │    │ Integration  │             │   │
│  │   └──────────────┘    └──────────────┘    └──────────────┘             │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Instant Mockup System

### 1.1 Overview

The mockup system delivers visual previews in under 3 seconds by using pre-rendered assets with dynamic transformations—no server-side processing required for branding changes.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           MOCKUP GENERATION FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   User Input                        Processing                       Output     │
│   ──────────                        ──────────                       ──────     │
│                                                                                  │
│   ┌────────────┐                                                                │
│   │ Template   │──┐                                                             │
│   │ Selection  │  │     ┌─────────────────────────────────────┐                │
│   └────────────┘  │     │                                     │                │
│                   ├────►│     MOCKUP ENGINE (Client-Side)     │                │
│   ┌────────────┐  │     │                                     │                │
│   │ Brand      │  │     │  1. Load template mockup assets     │    ┌─────────┐│
│   │ Colors     │──┤     │  2. Apply CSS color transformations │───►│Interactive│
│   └────────────┘  │     │  3. Inject logo into designated zone│    │ Mockup   ││
│                   │     │  4. Replace text (app name)         │    │ Viewer   ││
│   ┌────────────┐  │     │  5. Initialize hotspot navigation   │    └─────────┘│
│   │ Logo       │──┤     │                                     │                │
│   │ Upload     │  │     │  Processing Time: <100ms            │                │
│   └────────────┘  │     └─────────────────────────────────────┘                │
│                   │                                                             │
│   ┌────────────┐  │                                                             │
│   │ App Name   │──┘                                                             │
│   └────────────┘                                                                │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Mockup Asset Structure

Each template includes certified mockup assets:

```
templates/{template-id}/
├── mockup/
│   ├── manifest.json              # Mockup configuration
│   ├── screens/
│   │   ├── home.png               # 1170x2532 @3x (iPhone)
│   │   ├── home@2x.png            # 780x1688 @2x
│   │   ├── home@1x.png            # 390x844 @1x
│   │   ├── detail.png
│   │   ├── profile.png
│   │   ├── cart.png               # Template-specific screens
│   │   └── ...
│   ├── hotspots/
│   │   ├── home.json              # Tap targets for each screen
│   │   └── ...
│   └── branding/
│       ├── zones.json             # Where colors/logos apply
│       └── masks/                 # SVG masks for color regions
│           ├── primary.svg
│           ├── secondary.svg
│           └── accent.svg
└── src/                           # Actual React Native code
```

### 1.3 Manifest Schema

```typescript
// mockup/manifest.json
interface MockupManifest {
  templateId: string;
  version: string;
  screens: MockupScreen[];
  navigation: NavigationConfig;
  branding: BrandingConfig;
}

interface MockupScreen {
  id: string;                      // 'home', 'detail', 'cart'
  name: string;                    // Display name
  file: string;                    // Path to screen image
  hotspots: Hotspot[];            // Tappable regions
  brandingZones: BrandingZone[];  // Where colors apply
}

interface Hotspot {
  id: string;
  bounds: { x: number; y: number; width: number; height: number };
  target: string;                  // Screen ID to navigate to
  animation: 'slide-left' | 'slide-right' | 'fade' | 'modal';
}

interface BrandingZone {
  type: 'primary' | 'secondary' | 'accent' | 'logo' | 'text';
  maskFile: string;               // SVG mask for this zone
  defaultValue: string;           // Default color/text
}

interface BrandingConfig {
  logoPosition: { x: number; y: number; width: number; height: number };
  appNamePosition: { x: number; y: number; fontSize: number };
  colorMode: 'hsl-shift' | 'svg-mask' | 'css-filter';
}
```

### 1.4 Client-Side Color Transformation

```typescript
// packages/ui/src/mockup/color-transformer.ts

interface ColorTransformOptions {
  source: string;       // Original template primary color
  target: string;       // User's chosen primary color
  mode: 'hsl-shift' | 'svg-mask' | 'css-filter';
}

/**
 * HSL-based color shifting for accurate brand color application
 * Works entirely client-side for instant updates
 */
export function transformColors(
  imageElement: HTMLImageElement,
  options: ColorTransformOptions
): void {
  const sourceHSL = hexToHSL(options.source);
  const targetHSL = hexToHSL(options.target);

  const hueShift = targetHSL.h - sourceHSL.h;
  const saturationShift = targetHSL.s - sourceHSL.s;
  const lightnessShift = targetHSL.l - sourceHSL.l;

  // Apply CSS filter for real-time preview
  imageElement.style.filter = `
    hue-rotate(${hueShift}deg)
    saturate(${100 + saturationShift}%)
    brightness(${100 + lightnessShift}%)
  `;
}

/**
 * SVG mask-based color replacement for precise zones
 * Used when CSS filters aren't accurate enough
 */
export function applyColorMask(
  canvas: HTMLCanvasElement,
  maskSvg: string,
  targetColor: string
): void {
  const ctx = canvas.getContext('2d');
  const mask = new Image();
  mask.src = `data:image/svg+xml,${encodeURIComponent(
    maskSvg.replace('{{COLOR}}', targetColor)
  )}`;

  mask.onload = () => {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.drawImage(mask, 0, 0);
  };
}
```

### 1.5 Mockup Viewer Component

```typescript
// packages/ui/src/mockup/MockupViewer.tsx

interface MockupViewerProps {
  templateId: string;
  branding: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    logo?: string;
    appName: string;
  };
  deviceFrame: 'iphone' | 'android';
  onScreenChange?: (screenId: string) => void;
}

export function MockupViewer({
  templateId,
  branding,
  deviceFrame,
  onScreenChange
}: MockupViewerProps) {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const manifest = useMockupManifest(templateId);

  const handleHotspotTap = (hotspot: Hotspot) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentScreen(hotspot.target);
      setIsTransitioning(false);
      onScreenChange?.(hotspot.target);
    }, 300); // Animation duration
  };

  return (
    <DeviceFrame type={deviceFrame}>
      <ScreenContainer
        screen={manifest.screens.find(s => s.id === currentScreen)}
        branding={branding}
        onHotspotTap={handleHotspotTap}
        isTransitioning={isTransitioning}
      />
      <NavigationBar
        screens={manifest.screens}
        currentScreen={currentScreen}
        onScreenSelect={setCurrentScreen}
      />
    </DeviceFrame>
  );
}
```

---

## 2. Smart Request Router

### 2.1 Classification Engine

The request router analyzes user inputs and classifies them into complexity tiers, selecting the optimal processing pipeline.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          REQUEST CLASSIFICATION FLOW                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   User Request                                                                  │
│        │                                                                        │
│        ▼                                                                        │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                         CLASSIFIER ENGINE                                │  │
│   │                                                                          │  │
│   │   1. Pattern Matching (regex-based)                                     │  │
│   │   2. Keyword Extraction                                                  │  │
│   │   3. Intent Classification (if patterns fail)                           │  │
│   │   4. Complexity Estimation                                               │  │
│   │                                                                          │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│        │                                                                        │
│        ▼                                                                        │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                          CLASSIFICATION RESULT                           │  │
│   │                                                                          │  │
│   │   ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐           │  │
│   │   │  TRIVIAL  │  │  SIMPLE   │  │ MODERATE  │  │  COMPLEX  │           │  │
│   │   │           │  │           │  │           │  │           │           │  │
│   │   │ No AI     │  │ 1 Agent   │  │ 3 Agents  │  │ Full 9    │           │  │
│   │   │ <30 sec   │  │ <2 min    │  │ <5 min    │  │ 5-10 min  │           │  │
│   │   └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘           │  │
│   │         │              │              │              │                  │  │
│   │         ▼              ▼              ▼              ▼                  │  │
│   │   AST Transform   Developer     Architect +    Full Pipeline           │  │
│   │   Direct Apply    Agent Only    Developer +                            │  │
│   │                                 Validator                              │  │
│   │                                                                          │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Classification Patterns

```typescript
// services/generator/src/router/classifier.ts

export type RequestComplexity = 'trivial' | 'simple' | 'moderate' | 'complex';

interface ClassificationResult {
  complexity: RequestComplexity;
  confidence: number;
  estimatedTime: number;          // seconds
  pipeline: PipelineType;
  mockupUpdatable: boolean;       // Can update mockup instantly?
  reasoning: string;
}

// Pattern-based classification (fast, no AI needed)
const TRIVIAL_PATTERNS = [
  /change.*(?:primary|main|brand).*color.*(?:to|#|rgb)/i,
  /(?:use|set|update).*logo/i,
  /(?:rename|call|name).*(?:app|it)\s+(?:to\s+)?["']?[\w\s]+["']?/i,
  /change.*font.*to/i,
  /(?:enable|disable|turn on|turn off).*feature/i,
  /(?:show|hide).*(?:section|element|component)/i,
];

const SIMPLE_PATTERNS = [
  /add.*(?:screen|page).*(?:from|like)/i,
  /(?:remove|delete).*(?:screen|page|section)/i,
  /change.*(?:order|position).*(?:tabs|navigation)/i,
  /update.*(?:text|copy|content)/i,
  /rearrange.*(?:layout|order)/i,
];

const MODERATE_PATTERNS = [
  /add.*(?:loyalty|points|rewards)/i,
  /integrate.*(?:stripe|payments)/i,
  /add.*(?:reviews|ratings)/i,
  /custom.*(?:fields|data)/i,
  /connect.*(?:api|service)/i,
];

// Everything else is complex

export function classifyRequest(request: string): ClassificationResult {
  // Check trivial patterns first (fastest)
  for (const pattern of TRIVIAL_PATTERNS) {
    if (pattern.test(request)) {
      return {
        complexity: 'trivial',
        confidence: 0.95,
        estimatedTime: 30,
        pipeline: 'ast-transform',
        mockupUpdatable: true,
        reasoning: `Matched trivial pattern: ${pattern.source.slice(0, 50)}...`
      };
    }
  }

  // Check simple patterns
  for (const pattern of SIMPLE_PATTERNS) {
    if (pattern.test(request)) {
      return {
        complexity: 'simple',
        confidence: 0.85,
        estimatedTime: 120,
        pipeline: 'single-agent',
        mockupUpdatable: false,
        reasoning: `Matched simple pattern: ${pattern.source.slice(0, 50)}...`
      };
    }
  }

  // Check moderate patterns
  for (const pattern of MODERATE_PATTERNS) {
    if (pattern.test(request)) {
      return {
        complexity: 'moderate',
        confidence: 0.80,
        estimatedTime: 300,
        pipeline: 'minimal-pipeline',
        mockupUpdatable: false,
        reasoning: `Matched moderate pattern: ${pattern.source.slice(0, 50)}...`
      };
    }
  }

  // Default to complex for unrecognized patterns
  return {
    complexity: 'complex',
    confidence: 0.70,
    estimatedTime: 600,
    pipeline: 'full-pipeline',
    mockupUpdatable: false,
    reasoning: 'No matching patterns found, defaulting to full pipeline'
  };
}
```

### 2.3 Pipeline Selection

```typescript
// services/generator/src/router/pipeline-selector.ts

type PipelineType = 'ast-transform' | 'single-agent' | 'minimal-pipeline' | 'full-pipeline';

interface PipelineConfig {
  agents: string[];
  validationLevel: 'basic' | 'standard' | 'full';
  cacheStrategy: 'aggressive' | 'normal' | 'none';
  parallelizable: boolean;
}

const PIPELINE_CONFIGS: Record<PipelineType, PipelineConfig> = {
  'ast-transform': {
    agents: [],                          // No AI agents
    validationLevel: 'basic',            // TypeScript only
    cacheStrategy: 'aggressive',
    parallelizable: true
  },

  'single-agent': {
    agents: ['developer'],               // Only developer agent
    validationLevel: 'standard',         // TS + ESLint
    cacheStrategy: 'normal',
    parallelizable: false
  },

  'minimal-pipeline': {
    agents: ['architect', 'developer', 'validator'],
    validationLevel: 'standard',
    cacheStrategy: 'normal',
    parallelizable: false
  },

  'full-pipeline': {
    agents: [
      'intent',
      'prd',
      'architect',
      'uiux',
      'task',
      'developer',
      'qa',
      'validator',
      'fixer'
    ],
    validationLevel: 'full',
    cacheStrategy: 'none',
    parallelizable: false
  }
};

export function selectPipeline(
  classification: ClassificationResult
): PipelineConfig {
  return PIPELINE_CONFIGS[classification.pipeline];
}
```

### 2.4 AST Transform Engine (Trivial Changes)

```typescript
// services/generator/src/transforms/ast-engine.ts

interface TransformResult {
  success: boolean;
  filesModified: string[];
  errors?: string[];
}

/**
 * Direct AST transforms for trivial changes
 * No AI involved - pure code transformation
 */
export class ASTTransformEngine {

  async applyColorChange(
    projectPath: string,
    colorType: 'primary' | 'secondary' | 'accent',
    newColor: string
  ): Promise<TransformResult> {
    const themeFile = path.join(projectPath, 'src/theme/colors.ts');
    const ast = parseTypeScript(await fs.readFile(themeFile, 'utf-8'));

    // Find and update the color constant
    visit(ast, {
      VariableDeclarator(node) {
        if (node.id.name === `${colorType}Color`) {
          node.init.value = newColor;
        }
      }
    });

    await fs.writeFile(themeFile, generateCode(ast));

    return {
      success: true,
      filesModified: [themeFile]
    };
  }

  async applyAppNameChange(
    projectPath: string,
    newName: string
  ): Promise<TransformResult> {
    const appJsonPath = path.join(projectPath, 'app.json');
    const appJson = JSON.parse(await fs.readFile(appJsonPath, 'utf-8'));

    appJson.expo.name = newName;
    appJson.expo.slug = slugify(newName);

    await fs.writeFile(appJsonPath, JSON.stringify(appJson, null, 2));

    return {
      success: true,
      filesModified: [appJsonPath]
    };
  }

  async applyLogoChange(
    projectPath: string,
    logoUrl: string
  ): Promise<TransformResult> {
    const assetsDir = path.join(projectPath, 'assets');

    // Download and resize logo
    const logoBuffer = await downloadImage(logoUrl);
    const resized = await sharp(logoBuffer)
      .resize(1024, 1024, { fit: 'contain', background: 'transparent' })
      .png()
      .toBuffer();

    await fs.writeFile(path.join(assetsDir, 'icon.png'), resized);

    return {
      success: true,
      filesModified: [path.join(assetsDir, 'icon.png')]
    };
  }
}
```

---

## 3. Optimized Build Pipeline

### 3.1 Template Pre-Caching Strategy

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         TEMPLATE CACHE ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   S3 Bucket: mobigen-template-cache                                             │
│   ─────────────────────────────────────                                         │
│                                                                                  │
│   templates/                                                                     │
│   ├── ecommerce/                                                                │
│   │   ├── base/                        # Template source code                   │
│   │   │   └── ... (React Native files)                                         │
│   │   │                                                                         │
│   │   ├── cache/                       # Pre-built artifacts                    │
│   │   │   ├── node_modules.tar.gz     # Pre-installed dependencies (500MB)     │
│   │   │   ├── metro-cache.tar.gz      # Warm Metro bundler cache (200MB)       │
│   │   │   ├── ios-prebuild.tar.gz     # Expo prebuild output (100MB)           │
│   │   │   └── android-prebuild.tar.gz # Expo prebuild output (150MB)           │
│   │   │                                                                         │
│   │   └── manifest.json                # Cache metadata + versions             │
│   │                                                                             │
│   ├── loyalty/                                                                  │
│   │   └── ...                                                                   │
│   │                                                                             │
│   └── ai-assistant/                                                             │
│       └── ...                                                                   │
│                                                                                  │
│   Cache Refresh: Nightly via CI/CD                                              │
│   Cache TTL: 7 days                                                              │
│   Cache Hit Rate Target: >95%                                                   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Parallel Build Pipeline

```typescript
// services/builder/src/parallel-pipeline.ts

interface BuildPipelineConfig {
  projectId: string;
  templateId: string;
  customizations: Customization[];
  targetPlatforms: ('ios' | 'android')[];
}

/**
 * Optimized parallel build pipeline
 * Target: 3-5 minutes for simple projects
 */
export async function runParallelBuild(config: BuildPipelineConfig): Promise<BuildResult> {
  const startTime = Date.now();

  // PHASE 1: Parallel initialization (0-30 seconds)
  const [
    projectDir,
    templateCache,
    metroBundler
  ] = await Promise.all([
    createProjectDirectory(config.projectId),
    downloadTemplateCache(config.templateId),
    warmupMetroBundler()
  ]);

  // PHASE 2: Apply customizations + Extract cache (30-60 seconds)
  await Promise.all([
    extractNodeModules(templateCache.nodeModules, projectDir),
    extractMetroCache(templateCache.metroCache, projectDir),
    applyCustomizations(projectDir, config.customizations)
  ]);

  // PHASE 3: Validation + Bundle (60-120 seconds)
  const [validationResult, bundleResult] = await Promise.all([
    runQuickValidation(projectDir),           // TypeScript + ESLint
    runMetroBundle(projectDir, metroBundler)  // JS bundle
  ]);

  if (!validationResult.passed) {
    throw new ValidationError(validationResult.errors);
  }

  // PHASE 4: Generate preview (120-150 seconds)
  const previewUrl = await generateExpoGoUrl(projectDir, bundleResult);

  // PHASE 5: EAS build trigger (parallel, non-blocking)
  const easBuilds = config.targetPlatforms.map(platform =>
    triggerEASBuild(projectDir, platform, { priority: 'normal' })
  );

  // Return preview immediately, EAS builds continue in background
  return {
    previewUrl,
    previewReady: true,
    easBuildIds: await Promise.all(easBuilds.map(b => b.then(r => r.buildId))),
    totalTime: Date.now() - startTime
  };
}
```

### 3.3 Metro Bundler Optimization

```typescript
// services/builder/src/metro/warm-bundler.ts

interface MetroPool {
  instances: MetroBundler[];
  maxInstances: number;
  idleTimeout: number;
}

/**
 * Pre-warmed Metro bundler pool
 * Eliminates cold-start bundler time (~30 seconds)
 */
export class MetroBundlerPool {
  private pool: MetroPool = {
    instances: [],
    maxInstances: 10,
    idleTimeout: 300000  // 5 minutes
  };

  async acquire(templateId: string): Promise<MetroBundler> {
    // Try to find a warm bundler for this template
    const warm = this.pool.instances.find(
      b => b.templateId === templateId && b.status === 'idle'
    );

    if (warm) {
      warm.status = 'in-use';
      return warm;
    }

    // Create new bundler if under limit
    if (this.pool.instances.length < this.pool.maxInstances) {
      const bundler = await this.createBundler(templateId);
      this.pool.instances.push(bundler);
      return bundler;
    }

    // Wait for available bundler
    return this.waitForAvailable(templateId);
  }

  private async createBundler(templateId: string): Promise<MetroBundler> {
    const templatePath = await getTemplatePath(templateId);

    const bundler = new MetroBundler({
      projectRoot: templatePath,
      watchFolders: [templatePath],
      resetCache: false,  // Use cached transformer output
      maxWorkers: 4
    });

    // Pre-warm the bundler
    await bundler.buildBundleWithOutput({
      entryFile: 'index.js',
      platform: 'ios',
      dev: true,
      minify: false
    });

    return {
      id: generateId(),
      templateId,
      instance: bundler,
      status: 'idle',
      createdAt: Date.now()
    };
  }
}
```

### 3.4 Incremental Update Strategy

```typescript
// services/builder/src/incremental/update-engine.ts

interface IncrementalUpdate {
  type: 'hot-reload' | 'delta-bundle' | 'full-rebuild';
  affectedFiles: string[];
  estimatedTime: number;
}

/**
 * Determines optimal update strategy based on changes
 */
export function determineUpdateStrategy(
  changes: FileChange[]
): IncrementalUpdate {
  // Hot-reload: Style-only changes
  const styleOnlyChanges = changes.every(c =>
    c.file.includes('theme/') ||
    c.file.includes('styles/') ||
    c.type === 'tailwind-class-change'
  );

  if (styleOnlyChanges) {
    return {
      type: 'hot-reload',
      affectedFiles: changes.map(c => c.file),
      estimatedTime: 2  // seconds
    };
  }

  // Delta bundle: Component-level changes
  const componentChanges = changes.every(c =>
    c.file.includes('components/') ||
    c.file.includes('screens/') &&
    c.type !== 'navigation-change'
  );

  if (componentChanges) {
    return {
      type: 'delta-bundle',
      affectedFiles: changes.map(c => c.file),
      estimatedTime: 15  // seconds
    };
  }

  // Full rebuild: Navigation, config, or structural changes
  return {
    type: 'full-rebuild',
    affectedFiles: ['*'],
    estimatedTime: 180  // 3 minutes
  };
}

/**
 * Apply hot-reload update via Expo Go connection
 */
export async function applyHotReload(
  projectId: string,
  changes: FileChange[]
): Promise<void> {
  const connection = await getExpoGoConnection(projectId);

  for (const change of changes) {
    await connection.send({
      type: 'update',
      file: change.file,
      content: change.newContent
    });
  }
}
```

---

## 4. Data Flow & State Management

### 4.1 Generation Session Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          GENERATION SESSION FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   Time: 0s                          Time: 3s                                    │
│   ────────                          ────────                                    │
│   User clicks "Create App"          Mockup displayed                            │
│         │                                 │                                     │
│         ▼                                 ▼                                     │
│   ┌───────────────┐              ┌───────────────┐                             │
│   │ API Request   │              │ Mockup Ready  │                             │
│   │               │              │ (Interactive) │                             │
│   │ - templateId  │              │               │                             │
│   │ - branding    │              │ User can:     │                             │
│   │ - appName     │              │ - Navigate    │                             │
│   └───────┬───────┘              │ - Change color│                             │
│           │                      │ - Update logo │                             │
│           ▼                      └───────────────┘                             │
│   ┌───────────────┐                     │                                      │
│   │ Request Router│                     │ (Background)                         │
│   │               │                     ▼                                      │
│   │ Classify →    │              ┌───────────────┐                             │
│   │ Select pipe   │              │ Build Pipeline│                             │
│   └───────┬───────┘              │               │                             │
│           │                      │ 1. Cache load │                             │
│           ▼                      │ 2. Customize  │                             │
│   ┌───────────────┐              │ 3. Validate   │                             │
│   │ Mockup Engine │              │ 4. Bundle     │                             │
│   │               │              └───────┬───────┘                             │
│   │ Generate      │                      │                                     │
│   │ interactive   │                      │                                     │
│   │ mockup        │                      │                                     │
│   └───────────────┘                      │                                     │
│                                          │                                     │
│   Time: 3-5 min                          ▼                                     │
│   ─────────────                  ┌───────────────┐                             │
│                                  │ Native Ready  │                             │
│                                  │               │                             │
│                                  │ QR Code shown │                             │
│                                  │ Celebration   │                             │
│                                  │ animation     │                             │
│                                  └───────────────┘                             │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Real-Time Updates (WebSocket)

```typescript
// packages/api/src/websocket/events.ts

// Server → Client Events
interface ServerEvents {
  // Mockup events
  'mockup:ready': {
    projectId: string;
    mockupUrl: string;
    screens: string[];
  };

  // Build progress events
  'build:phase': {
    projectId: string;
    phase: 'caching' | 'customizing' | 'validating' | 'bundling' | 'ready';
    progress: number;      // 0-100
    estimatedRemaining: number;  // seconds
    description: string;
  };

  'build:ready': {
    projectId: string;
    previewUrl: string;
    qrCode: string;        // Base64 QR code image
    expiresAt: string;     // ISO timestamp
  };

  'build:error': {
    projectId: string;
    phase: string;
    error: string;
    recoverable: boolean;
    suggestedAction?: string;
  };

  // Chat/refinement events
  'chat:classification': {
    projectId: string;
    messageId: string;
    complexity: 'trivial' | 'simple' | 'moderate' | 'complex';
    estimatedTime: number;
    mockupUpdatable: boolean;
  };

  'mockup:updated': {
    projectId: string;
    changeType: 'color' | 'logo' | 'text' | 'layout';
    affectedScreens: string[];
  };
}

// Client → Server Events
interface ClientEvents {
  'project:subscribe': {
    projectId: string;
  };

  'project:unsubscribe': {
    projectId: string;
  };

  'branding:update': {
    projectId: string;
    changes: BrandingChange[];
  };
}
```

### 4.3 State Synchronization

```typescript
// apps/web/src/hooks/useProjectState.ts

interface ProjectState {
  // Mockup state
  mockup: {
    ready: boolean;
    currentScreen: string;
    branding: BrandingConfig;
    screens: MockupScreen[];
  };

  // Build state
  build: {
    status: 'idle' | 'building' | 'ready' | 'error';
    phase: string;
    progress: number;
    estimatedRemaining: number;
    previewUrl?: string;
    qrCode?: string;
  };

  // Chat state
  chat: {
    messages: ChatMessage[];
    pendingClassification?: Classification;
    isProcessing: boolean;
  };
}

export function useProjectState(projectId: string): ProjectState {
  const [state, dispatch] = useReducer(projectReducer, initialState);
  const ws = useWebSocket();

  useEffect(() => {
    ws.emit('project:subscribe', { projectId });

    ws.on('mockup:ready', (data) => {
      dispatch({ type: 'MOCKUP_READY', payload: data });
    });

    ws.on('build:phase', (data) => {
      dispatch({ type: 'BUILD_PROGRESS', payload: data });
    });

    ws.on('build:ready', (data) => {
      dispatch({ type: 'BUILD_READY', payload: data });
      // Trigger celebration animation
      triggerCelebration();
    });

    return () => {
      ws.emit('project:unsubscribe', { projectId });
    };
  }, [projectId]);

  return state;
}
```

---

## 5. API Specifications

### 5.1 Mockup API

```typescript
// packages/api/src/routers/mockup.ts

export const mockupRouter = router({
  // Get mockup manifest for a template
  getManifest: publicProcedure
    .input(z.object({
      templateId: z.string()
    }))
    .query(async ({ input }) => {
      const manifest = await loadMockupManifest(input.templateId);
      return manifest;
    }),

  // Get pre-signed URLs for mockup assets
  getAssetUrls: publicProcedure
    .input(z.object({
      templateId: z.string(),
      screens: z.array(z.string())
    }))
    .query(async ({ input }) => {
      const urls = await generateAssetUrls(input.templateId, input.screens);
      return urls;  // CDN URLs with 1-hour expiry
    }),

  // Apply branding to generate customized mockup
  applyBranding: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      branding: z.object({
        primaryColor: z.string(),
        secondaryColor: z.string().optional(),
        accentColor: z.string().optional(),
        logo: z.string().optional(),  // S3 key or URL
        appName: z.string()
      })
    }))
    .mutation(async ({ input, ctx }) => {
      // This mainly updates project config
      // Actual mockup rendering happens client-side
      await updateProjectBranding(input.projectId, input.branding);

      return { success: true };
    })
});
```

### 5.2 Generation API

```typescript
// packages/api/src/routers/generate.ts

export const generateRouter = router({
  // Classify a request without executing
  classifyRequest: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      message: z.string()
    }))
    .mutation(async ({ input }) => {
      const classification = classifyRequest(input.message);
      return classification;
    }),

  // Execute a generation request
  executeRequest: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      message: z.string(),
      skipClassification: z.boolean().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const classification = classifyRequest(input.message);

      // For trivial requests, apply immediately
      if (classification.complexity === 'trivial') {
        const result = await applyTrivialChange(input.projectId, input.message);
        return {
          ...classification,
          result,
          completed: true
        };
      }

      // For other requests, queue for processing
      const jobId = await queueGeneration({
        projectId: input.projectId,
        message: input.message,
        classification,
        userId: ctx.user.id
      });

      return {
        ...classification,
        jobId,
        completed: false
      };
    }),

  // Get generation status
  getStatus: protectedProcedure
    .input(z.object({
      jobId: z.string()
    }))
    .query(async ({ input }) => {
      return await getJobStatus(input.jobId);
    })
});
```

### 5.3 Build API

```typescript
// packages/api/src/routers/build.ts

export const buildRouter = router({
  // Start a preview build
  startPreview: protectedProcedure
    .input(z.object({
      projectId: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      const buildId = await startPreviewBuild({
        projectId: input.projectId,
        userId: ctx.user.id,
        priority: 'high'
      });

      return { buildId };
    }),

  // Get preview URL (if ready)
  getPreviewUrl: protectedProcedure
    .input(z.object({
      projectId: z.string()
    }))
    .query(async ({ input }) => {
      const preview = await getActivePreview(input.projectId);

      if (!preview) {
        return { ready: false };
      }

      return {
        ready: true,
        url: preview.url,
        qrCode: preview.qrCode,
        expiresAt: preview.expiresAt
      };
    }),

  // Start production build
  startProduction: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      platforms: z.array(z.enum(['ios', 'android']))
    }))
    .mutation(async ({ input, ctx }) => {
      const builds = await Promise.all(
        input.platforms.map(platform =>
          startProductionBuild({
            projectId: input.projectId,
            platform,
            userId: ctx.user.id
          })
        )
      );

      return { builds };
    })
});
```

---

## 6. Infrastructure Requirements

### 6.1 Service Topology

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           INFRASTRUCTURE TOPOLOGY                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                          EDGE LAYER (CloudFront)                         │   │
│   │                                                                          │   │
│   │   • Static assets (mockup images, templates)                            │   │
│   │   • API caching for read-heavy endpoints                                │   │
│   │   • Global distribution for low-latency mockup loading                  │   │
│   │                                                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                       │                                         │
│                                       ▼                                         │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                        APPLICATION LAYER (ECS Fargate)                   │   │
│   │                                                                          │   │
│   │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │   │
│   │   │    Web      │  │  Generator  │  │   Builder   │  │   Tester    │   │   │
│   │   │  Service    │  │   Service   │  │   Service   │  │   Service   │   │   │
│   │   │             │  │             │  │             │  │             │   │   │
│   │   │ Min: 2      │  │ Min: 2      │  │ Min: 2      │  │ Min: 1      │   │   │
│   │   │ Max: 10     │  │ Max: 8      │  │ Max: 6      │  │ Max: 4      │   │   │
│   │   │ CPU: 0.5    │  │ CPU: 2      │  │ CPU: 2      │  │ CPU: 1      │   │   │
│   │   │ RAM: 1GB    │  │ RAM: 4GB    │  │ RAM: 4GB    │  │ RAM: 2GB    │   │   │
│   │   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │   │
│   │                                                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                       │                                         │
│                                       ▼                                         │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                            DATA LAYER                                    │   │
│   │                                                                          │   │
│   │   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐              │   │
│   │   │   PostgreSQL  │  │     Redis     │  │      S3       │              │   │
│   │   │    (RDS)      │  │ (ElastiCache) │  │   (Storage)   │              │   │
│   │   │               │  │               │  │               │              │   │
│   │   │ db.r6g.large  │  │ cache.r6g.lg  │  │ Standard tier │              │   │
│   │   │ Multi-AZ      │  │ Cluster mode  │  │ Versioning    │              │   │
│   │   └───────────────┘  └───────────────┘  └───────────────┘              │   │
│   │                                                                          │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 S3 Bucket Structure

```
mobigen-assets-{env}/
├── templates/                      # Template mockup assets (public via CloudFront)
│   ├── ecommerce/mockup/
│   ├── loyalty/mockup/
│   └── ...
│
├── template-cache/                 # Pre-built template caches (private)
│   ├── ecommerce/
│   │   ├── node_modules.tar.gz
│   │   ├── metro-cache.tar.gz
│   │   └── manifest.json
│   └── ...
│
├── projects/                       # User project files (private)
│   ├── {project-id}/
│   │   ├── src/
│   │   ├── assets/
│   │   └── app.json
│   └── ...
│
├── builds/                         # Build artifacts (private)
│   ├── {project-id}/
│   │   ├── preview/
│   │   └── production/
│   └── ...
│
└── user-uploads/                   # User uploaded assets (private)
    ├── {user-id}/
    │   ├── logos/
    │   └── images/
    └── ...
```

### 6.3 Redis Configuration

```typescript
// Redis key patterns and usage

// Job queues (BullMQ)
'bull:generation:{jobId}'           // Generation job data
'bull:build:{jobId}'                // Build job data

// Real-time state
'project:{projectId}:state'         // Current project state
'project:{projectId}:subscribers'   // WebSocket subscribers

// Caching
'mockup:manifest:{templateId}'      // Cached manifests (TTL: 1 hour)
'classification:{hash}'             // Request classification cache (TTL: 24 hours)

// Rate limiting
'ratelimit:{userId}:generation'     // Generation rate limit
'ratelimit:{userId}:build'          // Build rate limit

// Metro bundler pool
'metro:pool:available'              // Available bundler instances
'metro:pool:{templateId}'           // Template-specific bundlers
```

---

## 7. Performance Targets

### 7.1 Latency Budgets

| Operation | Target | Max | Budget Breakdown |
|-----------|--------|-----|------------------|
| Mockup load | <3s | 5s | CDN: 500ms, Parse: 200ms, Render: 300ms |
| Color change | <100ms | 200ms | CSS transform: 50ms, Re-render: 50ms |
| Logo upload | <2s | 3s | Upload: 1s, Process: 500ms, Update: 500ms |
| Classification | <500ms | 1s | Pattern: 50ms, AI fallback: 450ms |
| Preview build | <5min | 10min | Cache: 30s, Transform: 30s, Bundle: 2min, QR: 30s |

### 7.2 Throughput Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Concurrent mockup users | 10,000 | CDN-based, stateless |
| Concurrent builds | 50 | Limited by EAS/Metro pool |
| WebSocket connections | 5,000 | Per server instance |
| API requests/second | 1,000 | Across all endpoints |

### 7.3 Availability Targets

| Component | Target | Strategy |
|-----------|--------|----------|
| Mockup system | 99.9% | CDN + static assets |
| Generation service | 99.5% | Multi-AZ, auto-scaling |
| Build service | 99% | Queue-based, retries |
| Database | 99.99% | RDS Multi-AZ |

---

## 8. Security Considerations

### 8.1 Asset Security

```typescript
// Mockup assets are public but versioned
// User uploads go to private buckets with signed URLs

interface AssetSecurity {
  mockupAssets: {
    access: 'public';
    distribution: 'CloudFront';
    caching: 'aggressive';
  };

  userUploads: {
    access: 'private';
    signedUrls: true;
    urlExpiry: '1 hour';
    maxSize: '10MB';
    allowedTypes: ['image/png', 'image/jpeg', 'image/svg+xml'];
  };

  projectFiles: {
    access: 'private';
    encryption: 'AES-256';
    accessControl: 'IAM + bucket policy';
  };
}
```

### 8.2 API Security

- **Rate limiting** per user tier
- **Input validation** with Zod schemas
- **Request classification** prevents prompt injection
- **Sandboxed execution** for AI-generated code
- **Audit logging** for all mutations

---

## 9. Migration Strategy

### 9.1 Phase 1: Mockup System (Week 1-2)

1. Create mockup asset pipeline for existing templates
2. Build MockupViewer component
3. Integrate with existing project creation flow
4. A/B test with 10% of users

### 9.2 Phase 2: Request Router (Week 3-4)

1. Implement classification engine
2. Create AST transform engine for trivial changes
3. Route trivial requests to bypass full pipeline
4. Monitor classification accuracy

### 9.3 Phase 3: Build Optimization (Week 5-6)

1. Set up template cache infrastructure
2. Implement Metro bundler pool
3. Create parallel build pipeline
4. Reduce preview time to <5 minutes

### 9.4 Phase 4: Full Integration (Week 7-8)

1. Connect all systems end-to-end
2. Performance testing and optimization
3. Gradual rollout to 100% of users
4. Deprecate old flow

---

**Document Status:** Active
**Last Updated:** January 2026
**Next Review:** After Phase 1 completion
