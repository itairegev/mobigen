# Mobigen 2.0 - Project Status

**Last Updated:** January 2026
**Current Sprint:** Sprint 1
**Overall Progress:** 0%

---

## Executive Summary

Mobigen 2.0 transforms the app generation experience with a three-tier progressive system:
1. **Instant Mockup** (<3 seconds) - Interactive branded preview
2. **Native Preview** (3-5 minutes) - Real Expo Go app
3. **Production Build** (10-15 minutes) - Store-ready builds

**Target Completion:** 8 weeks

---

## Sprint Overview

| Sprint | Focus | Duration | Status |
|--------|-------|----------|--------|
| Sprint 1 | Mockup System Foundation | 2 weeks | Not Started |
| Sprint 2 | Mockup UI & Integration | 2 weeks | Not Started |
| Sprint 3 | Smart Request Router | 2 weeks | Not Started |
| Sprint 4 | Build Pipeline Optimization | 2 weeks | Not Started |

---

## Sprint 1: Mockup System Foundation

**Goal:** Build the infrastructure for instant mockup generation

**Duration:** 2 weeks
**Status:** Not Started

### Tasks

#### 1.1 Mockup Asset Pipeline
- [ ] **TASK-1.1.1:** Define mockup manifest schema (TypeScript types)
  - File: `packages/ui/src/mockup/types.ts`
  - Includes: MockupManifest, MockupScreen, Hotspot, BrandingZone interfaces
  - Estimated: 2 hours

- [ ] **TASK-1.1.2:** Create mockup asset directory structure for ecommerce template
  - Directory: `templates/ecommerce/mockup/`
  - Deliverables: screens/, hotspots/, branding/zones.json
  - Estimated: 4 hours

- [ ] **TASK-1.1.3:** Capture high-quality screenshots for ecommerce template (all screens)
  - Screens: home, products, product-detail, cart, checkout, profile, orders
  - Resolutions: @1x, @2x, @3x
  - Estimated: 4 hours

- [ ] **TASK-1.1.4:** Create hotspot JSON files for ecommerce screens
  - Define tap targets with bounds and navigation targets
  - File: `templates/ecommerce/mockup/hotspots/*.json`
  - Estimated: 3 hours

- [ ] **TASK-1.1.5:** Create branding zones configuration for ecommerce
  - Define primary/secondary/accent color zones
  - Define logo placement zone
  - File: `templates/ecommerce/mockup/branding/zones.json`
  - Estimated: 2 hours

#### 1.2 Color Transformation System
- [ ] **TASK-1.2.1:** Implement HSL color utility functions
  - File: `packages/ui/src/mockup/color-utils.ts`
  - Functions: hexToHSL, hslToHex, calculateHueShift
  - Estimated: 2 hours

- [ ] **TASK-1.2.2:** Implement CSS filter-based color transformation
  - File: `packages/ui/src/mockup/color-transformer.ts`
  - Approach: hue-rotate + saturate + brightness filters
  - Estimated: 3 hours

- [ ] **TASK-1.2.3:** Implement SVG mask-based color replacement (fallback)
  - For precise color zones where CSS filters aren't accurate
  - File: `packages/ui/src/mockup/mask-transformer.ts`
  - Estimated: 4 hours

- [ ] **TASK-1.2.4:** Create color transformation tests
  - Test various source→target color combinations
  - Visual regression tests with snapshots
  - Estimated: 2 hours

#### 1.3 Logo Injection System
- [ ] **TASK-1.3.1:** Implement logo upload and resize utility
  - Client-side resize using canvas
  - File: `packages/ui/src/mockup/logo-processor.ts`
  - Estimated: 3 hours

- [ ] **TASK-1.3.2:** Implement logo placement on mockup
  - Position logo at defined zone coordinates
  - Handle transparency and scaling
  - Estimated: 2 hours

- [ ] **TASK-1.3.3:** Create S3 upload flow for user logos
  - Presigned URL generation
  - File: `packages/api/src/routers/upload.ts`
  - Estimated: 3 hours

#### 1.4 Asset Delivery Infrastructure
- [ ] **TASK-1.4.1:** Set up S3 bucket for mockup assets
  - Bucket: `mobigen-assets-{env}`
  - Configure public read for templates/
  - Estimated: 1 hour

- [ ] **TASK-1.4.2:** Configure CloudFront distribution for mockup assets
  - Global edge caching
  - 1-year cache for versioned assets
  - Estimated: 2 hours

- [ ] **TASK-1.4.3:** Create asset upload CI/CD pipeline
  - GitHub Action to sync mockup assets to S3
  - Invalidate CloudFront on deploy
  - Estimated: 2 hours

### Sprint 1 Deliverables
- [ ] Mockup manifest schema and types
- [ ] Ecommerce template mockup assets (all screens)
- [ ] Color transformation utilities
- [ ] Logo processing utilities
- [ ] S3 + CloudFront infrastructure

---

## Sprint 2: Mockup UI & Integration

**Goal:** Build the interactive mockup viewer and integrate with project creation

**Duration:** 2 weeks
**Status:** Not Started

### Tasks

#### 2.1 Mockup Viewer Component
- [ ] **TASK-2.1.1:** Create DeviceFrame component
  - Props: type ('iphone' | 'android'), children
  - File: `packages/ui/src/mockup/DeviceFrame.tsx`
  - Estimated: 3 hours

- [ ] **TASK-2.1.2:** Create ScreenRenderer component
  - Renders mockup screen with color transformations applied
  - Handles image loading states
  - File: `packages/ui/src/mockup/ScreenRenderer.tsx`
  - Estimated: 4 hours

- [ ] **TASK-2.1.3:** Create HotspotOverlay component
  - Renders invisible tap targets over screen
  - Handles tap events for navigation
  - File: `packages/ui/src/mockup/HotspotOverlay.tsx`
  - Estimated: 3 hours

- [ ] **TASK-2.1.4:** Create MockupNavigator component
  - Tab bar / navigation controls
  - Screen indicator dots
  - File: `packages/ui/src/mockup/MockupNavigator.tsx`
  - Estimated: 3 hours

- [ ] **TASK-2.1.5:** Create MockupViewer main component
  - Combines all sub-components
  - Manages screen state and transitions
  - File: `packages/ui/src/mockup/MockupViewer.tsx`
  - Estimated: 4 hours

- [ ] **TASK-2.1.6:** Add screen transition animations
  - Slide left/right, fade, modal
  - Framer Motion integration
  - Estimated: 3 hours

#### 2.2 Real-Time Branding Controls
- [ ] **TASK-2.2.1:** Create ColorPicker component with live preview
  - Debounced onChange for performance
  - Recent colors history
  - File: `packages/ui/src/mockup/ColorPicker.tsx`
  - Estimated: 3 hours

- [ ] **TASK-2.2.2:** Create LogoUploader component
  - Drag-and-drop + file picker
  - Preview before upload
  - File: `packages/ui/src/mockup/LogoUploader.tsx`
  - Estimated: 3 hours

- [ ] **TASK-2.2.3:** Create AppNameInput component
  - Character limit indicator
  - Live preview update
  - File: `packages/ui/src/mockup/AppNameInput.tsx`
  - Estimated: 1 hour

- [ ] **TASK-2.2.4:** Create BrandingPanel component
  - Combines color picker, logo uploader, app name
  - Collapsible sections
  - File: `packages/ui/src/mockup/BrandingPanel.tsx`
  - Estimated: 2 hours

#### 2.3 Project Creation Integration
- [ ] **TASK-2.3.1:** Update project creation page with mockup viewer
  - File: `apps/web/src/app/projects/new/page.tsx`
  - Show mockup immediately after template selection
  - Estimated: 4 hours

- [ ] **TASK-2.3.2:** Add "Building your real app..." progress indicator
  - Show alongside mockup
  - WebSocket connection for updates
  - Estimated: 3 hours

- [ ] **TASK-2.3.3:** Add QR code celebration moment
  - Animation when native preview ready
  - Confetti effect (optional, user-configurable)
  - Estimated: 2 hours

- [ ] **TASK-2.3.4:** Create mockup tRPC router endpoints
  - getManifest, getAssetUrls, applyBranding
  - File: `packages/api/src/routers/mockup.ts`
  - Estimated: 3 hours

#### 2.4 Additional Template Mockups
- [ ] **TASK-2.4.1:** Create mockup assets for loyalty template
  - All screens: home, rewards, scan, history, profile
  - Estimated: 6 hours

- [ ] **TASK-2.4.2:** Create mockup assets for ai-assistant template
  - All screens: chat, history, settings
  - Estimated: 4 hours

- [ ] **TASK-2.4.3:** Create mockup assets for restaurant template
  - All screens: menu, item-detail, cart, orders, profile
  - Estimated: 6 hours

### Sprint 2 Deliverables
- [ ] Interactive MockupViewer component
- [ ] Real-time branding controls
- [ ] Updated project creation flow
- [ ] Mockup assets for 4 templates (ecommerce, loyalty, ai-assistant, restaurant)

---

## Sprint 3: Smart Request Router

**Goal:** Implement intelligent request classification and routing

**Duration:** 2 weeks
**Status:** Not Started

### Tasks

#### 3.1 Classification Engine
- [ ] **TASK-3.1.1:** Define classification types and interfaces
  - RequestComplexity, ClassificationResult, PipelineType
  - File: `services/generator/src/router/types.ts`
  - Estimated: 1 hour

- [ ] **TASK-3.1.2:** Implement pattern-based classifier
  - Regex patterns for trivial, simple, moderate requests
  - File: `services/generator/src/router/classifier.ts`
  - Estimated: 4 hours

- [ ] **TASK-3.1.3:** Create classification test suite
  - 50+ test cases covering all complexity levels
  - Edge cases and ambiguous requests
  - Estimated: 3 hours

- [ ] **TASK-3.1.4:** Implement AI fallback classifier
  - For requests that don't match patterns
  - Use Claude Haiku for speed
  - Estimated: 3 hours

- [ ] **TASK-3.1.5:** Add classification caching
  - Cache classification results by request hash
  - Redis with 24-hour TTL
  - Estimated: 2 hours

#### 3.2 Pipeline Selection
- [ ] **TASK-3.2.1:** Define pipeline configurations
  - ast-transform, single-agent, minimal-pipeline, full-pipeline
  - File: `services/generator/src/router/pipeline-config.ts`
  - Estimated: 2 hours

- [ ] **TASK-3.2.2:** Implement pipeline selector
  - Map classification → pipeline config
  - File: `services/generator/src/router/pipeline-selector.ts`
  - Estimated: 2 hours

- [ ] **TASK-3.2.3:** Update orchestrator to use selected pipeline
  - Skip unnecessary agents based on complexity
  - File: `services/generator/src/orchestrator.ts`
  - Estimated: 4 hours

#### 3.3 AST Transform Engine (Trivial Changes)
- [ ] **TASK-3.3.1:** Implement color change AST transform
  - Update theme/colors.ts directly
  - File: `services/generator/src/transforms/color-transform.ts`
  - Estimated: 3 hours

- [ ] **TASK-3.3.2:** Implement app name change transform
  - Update app.json and relevant files
  - File: `services/generator/src/transforms/appname-transform.ts`
  - Estimated: 2 hours

- [ ] **TASK-3.3.3:** Implement feature toggle transform
  - Enable/disable features via config
  - File: `services/generator/src/transforms/feature-toggle.ts`
  - Estimated: 3 hours

- [ ] **TASK-3.3.4:** Create AST transform engine facade
  - Route trivial requests to appropriate transform
  - File: `services/generator/src/transforms/engine.ts`
  - Estimated: 2 hours

#### 3.4 Chat Integration
- [ ] **TASK-3.4.1:** Add classification preview to chat UI
  - Show user estimated time before executing
  - File: `apps/web/src/components/chat/ClassificationPreview.tsx`
  - Estimated: 3 hours

- [ ] **TASK-3.4.2:** Implement instant mockup updates for trivial changes
  - Update mockup in <1 second for color/text changes
  - File: `apps/web/src/hooks/useChatMockupSync.ts`
  - Estimated: 3 hours

- [ ] **TASK-3.4.3:** Add batch mode for multiple changes
  - Allow users to queue changes before rebuild
  - File: `apps/web/src/components/chat/BatchMode.tsx`
  - Estimated: 4 hours

### Sprint 3 Deliverables
- [ ] Request classification engine
- [ ] Pipeline selection logic
- [ ] AST transforms for trivial changes
- [ ] Chat integration with classification preview

---

## Sprint 4: Build Pipeline Optimization

**Goal:** Reduce native preview time to 3-5 minutes

**Duration:** 2 weeks
**Status:** Not Started

### Tasks

#### 4.1 Template Caching Infrastructure
- [ ] **TASK-4.1.1:** Create template cache structure in S3
  - node_modules.tar.gz, metro-cache.tar.gz per template
  - File: Infrastructure setup
  - Estimated: 2 hours

- [ ] **TASK-4.1.2:** Build cache generation CI/CD job
  - Nightly job to rebuild caches
  - GitHub Action workflow
  - Estimated: 4 hours

- [ ] **TASK-4.1.3:** Implement cache download and extraction
  - Parallel extraction for speed
  - File: `services/builder/src/cache/template-cache.ts`
  - Estimated: 3 hours

- [ ] **TASK-4.1.4:** Add cache validation and versioning
  - Check cache freshness, invalidate on template updates
  - Estimated: 2 hours

#### 4.2 Metro Bundler Pool
- [ ] **TASK-4.2.1:** Implement MetroBundlerPool class
  - Pool of pre-warmed Metro instances
  - File: `services/builder/src/metro/bundler-pool.ts`
  - Estimated: 6 hours

- [ ] **TASK-4.2.2:** Add pool management (acquire/release)
  - Template-specific bundlers
  - Idle timeout and cleanup
  - Estimated: 3 hours

- [ ] **TASK-4.2.3:** Create pool monitoring and metrics
  - Track hit rate, cold starts, wait times
  - Estimated: 2 hours

- [ ] **TASK-4.2.4:** Add auto-scaling for pool size
  - Scale based on queue depth
  - Estimated: 2 hours

#### 4.3 Parallel Build Pipeline
- [ ] **TASK-4.3.1:** Refactor build pipeline for parallelism
  - Phase 1: Parallel init (project dir, cache download, Metro warmup)
  - File: `services/builder/src/pipeline/parallel-pipeline.ts`
  - Estimated: 4 hours

- [ ] **TASK-4.3.2:** Implement parallel customization + extraction
  - Apply customizations while extracting node_modules
  - Estimated: 3 hours

- [ ] **TASK-4.3.3:** Implement parallel validation + bundle
  - Run TypeScript check while Metro bundles
  - Estimated: 3 hours

- [ ] **TASK-4.3.4:** Create pipeline timing instrumentation
  - Track time spent in each phase
  - Identify bottlenecks
  - Estimated: 2 hours

#### 4.4 Incremental Updates
- [ ] **TASK-4.4.1:** Implement update strategy detector
  - Determine hot-reload vs delta vs full rebuild
  - File: `services/builder/src/incremental/strategy.ts`
  - Estimated: 3 hours

- [ ] **TASK-4.4.2:** Implement hot-reload via Expo Go connection
  - Push style changes without rebuild
  - Estimated: 4 hours

- [ ] **TASK-4.4.3:** Implement delta bundling
  - Partial bundle updates for component changes
  - Estimated: 4 hours

#### 4.5 QR Code and Preview
- [ ] **TASK-4.5.1:** Optimize QR code generation
  - Pre-generate when bundle 90% complete
  - Estimated: 1 hour

- [ ] **TASK-4.5.2:** Add preview URL persistence
  - Keep preview active for 24 hours
  - Reuse across sessions
  - Estimated: 2 hours

- [ ] **TASK-4.5.3:** Implement preview health monitoring
  - Auto-restart if preview becomes unhealthy
  - Estimated: 2 hours

### Sprint 4 Deliverables
- [ ] Template caching infrastructure
- [ ] Metro bundler pool
- [ ] Parallel build pipeline
- [ ] Incremental update support
- [ ] Target: <5 minute preview builds

---

## Success Metrics

### Per-Sprint Metrics

| Sprint | Key Metric | Target |
|--------|-----------|--------|
| Sprint 1 | Mockup assets created | 1 template (ecommerce) |
| Sprint 2 | Mockup viewer functional | <3s load time |
| Sprint 3 | Classification accuracy | >90% |
| Sprint 4 | Preview build time | <5 minutes |

### Overall Success Criteria

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Time to first visual | ~70 min | <3 sec | Not Started |
| Time to native preview | ~70 min | <5 min | Not Started |
| User drop-off during generation | High | <10% | Not Measured |
| Build success rate | ~85% | >99% | Not Started |

---

## Risk Register

| Risk | Impact | Probability | Mitigation | Status |
|------|--------|-------------|------------|--------|
| Mockup doesn't match native | High | Medium | Strict template certification process | Open |
| Metro pool scaling issues | Medium | Medium | Auto-scaling + queue-based fallback | Open |
| Classification misroutes complex requests | Medium | Medium | Conservative defaults, user override | Open |
| Template cache staleness | Low | Low | Nightly rebuilds, version checks | Open |

---

## Team & Resources

### Required Roles
- **Frontend Engineer:** MockupViewer, branding controls, integration
- **Backend Engineer:** Classification, transforms, pipeline optimization
- **DevOps Engineer:** S3/CloudFront setup, CI/CD, caching infra
- **Designer:** Mockup screenshot capture, asset creation

### External Dependencies
- Expo EAS for builds
- AWS S3/CloudFront for asset delivery
- Claude API for AI classification fallback

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| Jan 2026 | Initial project plan created | System |

---

**Next Update:** End of Sprint 1
**Document Owner:** Engineering Lead
