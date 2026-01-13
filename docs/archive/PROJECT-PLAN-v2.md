# Mobigen v2.0 - Production Readiness Project Plan

**Created:** December 31, 2024
**Status:** ✅ COMPLETED
**Linear Project:** MOB (Mobigen Production)
**Completed:** December 31, 2024

---

## Project Overview

Transform Mobigen from MVP to production-ready platform by addressing:
- Preview capabilities for users
- Build reliability and verification
- Testing infrastructure
- Scaling and resilience

---

## Sprint Structure

| Sprint | Focus | Duration | Status | Key Deliverables |
|--------|-------|----------|--------|------------------|
| **Sprint 1** | Critical Fixes | 3 days | **COMPLETE** | Session fix, validation, verification |
| **Sprint 2** | Preview System | 5 days | **COMPLETE** | Web preview, QR codes, hosting |
| **Sprint 3** | Testing Infrastructure | 5 days | **COMPLETE** | Testing package, Maestro, integration |
| **Sprint 4** | Scaling & Resilience | 5 days | **COMPLETE** | Queues, circuit breakers, monitoring |

---

## Sprint 1: Critical Fixes (COMPLETE)

**Completed:** December 31, 2024
**Commit:** `309de89`

### Goals
- ✅ Fix critical bugs blocking production use
- ✅ Implement actual validation (not stubbed)
- ✅ Add post-generation verification

### Tasks

#### 1.1 Fix Session Duration Bug ✅
- **File:** `services/generator/src/session-manager.ts`
- **Fix:** Duration now correctly uses `createdAt.getTime()`
- **Test:** Unit tests verify duration calculation

#### 1.2 Implement Tier 3 Validation ✅
- **File:** `services/builder/src/build-service.ts`
- **Implemented:** TypeScript, ESLint, Expo prebuild, Metro bundle checks
- **Test:** Integration tests for all validation paths

#### 1.3 Add Generation Verification ✅
- **Files:** New `services/generator/src/verification.ts`
- **Implemented:** 7 verification checks with auto-fix integration
- **Test:** 19 integration tests covering all checks

#### 1.4 Fix TypeScript Errors ✅
- All packages compile without errors
- **Test:** 33 Sprint 1 tests passing

---

## Sprint 2: Preview System (COMPLETE)

**Completed:** December 31, 2024

### Goals
- ✅ Users can preview apps before building
- ✅ Multiple preview methods (Web, QR, Dev Build)
- ✅ Preview hosting infrastructure

### Tasks

#### 2.1 Create Web Deployer Agent ✅
- **File:** `agents/builtin/web-deployer.md`
- **Purpose:** Export app to web and deploy
- **Test:** Agent produces valid web export

#### 2.2 Implement Web Preview Endpoint ✅
- **File:** `services/generator/src/api.ts`, `services/generator/src/preview-service.ts`
- **Endpoint:** `POST /api/projects/:id/preview/web`
- **Test:** API returns preview URL

#### 2.3 Add Expo Go QR Code Generation ✅
- **File:** `services/generator/src/preview-service.ts`
- **Endpoint:** `GET /api/projects/:id/preview/qr`
- **Test:** QR code generated with optional library

#### 2.4 Set Up Preview Hosting ✅
- **Infrastructure:** S3 bucket + CloudFront
- **Config:** `infrastructure/terraform/preview-hosting.tf`
- **Test:** Terraform config valid

#### 2.5 Add Preview UI to Web App ✅
- **File:** `apps/web/src/app/projects/[id]/preview/page.tsx`
- **Features:** Web iframe, QR display, status
- **Test:** UI renders correctly

#### 2.6 Preview Cleanup Job ✅
- **File:** `services/generator/src/jobs/cleanup-previews.ts`
- **Purpose:** Delete expired previews (24h default)
- **Test:** Cleanup runs correctly

#### 2.7 Sprint 2 Integration Tests ✅
- **File:** `tests/integration/sprint2/preview-service.test.ts`
- **Purpose:** Test preview service functionality
- **Test:** 15 integration tests passing

---

## Sprint 3: Testing Infrastructure (COMPLETE)

**Completed:** December 31, 2024

### Goals
- ✅ Complete @mobigen/testing package
- ✅ Integrate tester service
- ✅ Automated test generation and execution

### Tasks

#### 3.1 Implement Testing Package ✅
- **Location:** `packages/testing/src/`
- **Modules:**
  - `validators/typescript.ts` ✅
  - `validators/eslint.ts` ✅
  - `validators/navigation.ts` ✅
  - `validators/imports.ts` ✅
  - `tiers/tier1.ts` ✅
  - `tiers/tier2.ts` ✅
  - `tiers/tier3.ts` ✅
- **Test:** Validators integrated into tier runners

#### 3.2 Wire Tester Service ✅
- **File:** `services/tester/src/index.ts`
- **Purpose:** Expose testing via API
- **Endpoints:**
  - `POST /api/test/tier1` ✅
  - `POST /api/test/tier2` ✅
  - `POST /api/test/tier3` ✅
  - `POST /api/test/progressive` ✅
  - `GET /api/test/summary/:projectId` ✅
- **Test:** Each tier runs correctly

#### 3.3 Implement Maestro Test Generation ✅
- **File:** `services/tester/src/maestro-generator.ts`
- **Purpose:** Generate Maestro YAML from app structure
- **Test:** Generated tests are valid YAML

#### 3.4 Add Visual Regression Testing ✅
- **Files:**
  - `packages/testing/src/visual/index.ts`
  - `packages/testing/src/visual/image-comparator.ts`
  - `packages/testing/src/visual/snapshot-manager.ts`
  - `packages/testing/src/visual/visual-tester.ts`
- **Tools:** Pixelmatch, pngjs (optional dependencies)
- **Test:** Detects visual changes via pixel comparison

#### 3.5 Integrate Testing with Generator ✅
- **Files:**
  - `services/generator/src/testing-integration.ts`
  - `services/generator/src/api.ts` (new endpoints)
- **Endpoints:**
  - `POST /api/projects/:projectId/test/quick`
  - `POST /api/projects/:projectId/test/full`
  - `POST /api/projects/:projectId/test/:tier`
  - `GET /api/projects/:projectId/test/summary`
- **Purpose:** Run tests after each phase
- **Test:** Pipeline integrates with @mobigen/testing

#### 3.6 Add Test Results to Web UI ✅
- **File:** `apps/web/src/app/projects/[id]/tests/page.tsx`
- **Features:**
  - Tier buttons (run Tier 1/2/3, progressive)
  - Real-time validation status
  - Error display with file/line info
  - Stage results breakdown
- **Test:** UI displays test results

---

## Sprint 4: Scaling & Resilience (COMPLETE)

**Completed:** December 31, 2024

### Goals
- ✅ Queue-based generation for scaling
- ✅ Circuit breakers for external services
- ✅ Monitoring and observability

### Tasks

#### 4.1 Move Generation to Queue ✅
- **Files:**
  - `services/generator/src/queue/generation-queue.ts`
  - `services/generator/src/queue/generation-worker.ts`
  - `services/generator/src/queue/index.ts`
- **Features:** Priority queues, job tracking, worker concurrency
- **Test:** Queue-based generation with progress tracking

#### 4.2 Add Circuit Breakers ✅
- **File:** `packages/resilience/src/circuit-breaker.ts`
- **Features:** CLOSED→OPEN→HALF_OPEN state machine
- **Targets:** Claude API, EAS API, S3, Database
- **Test:** Circuit opens on failures, auto-recovers

#### 4.3 Implement Retry Logic ✅
- **File:** `packages/resilience/src/retry.ts`
- **Features:** Exponential backoff, jitter, abort signal support
- **Strategies:** fast, standard, aggressive, patient
- **Predicates:** network errors, server errors, rate limits

#### 4.4 Add Health Checks ✅
- **File:** `packages/observability/src/health.ts`
- **Endpoints:**
  - `GET /api/health` - Full health report
  - `GET /api/health/live` - Liveness probe
  - `GET /api/health/ready` - Readiness probe
- **Checks:** Memory, circuit breaker state, external APIs

#### 4.5 Implement Metrics ✅
- **File:** `packages/observability/src/metrics.ts`
- **Types:** Counter, Gauge, Histogram
- **Metrics:**
  - `mobigen_generation_duration_seconds`
  - `mobigen_build_total`
  - `mobigen_active_generations`
  - `mobigen_api_request_duration_seconds`
  - `mobigen_validation_duration_seconds`
  - `mobigen_circuit_breaker_state`
  - `mobigen_queue_size`
- **Endpoints:** `GET /api/metrics` (Prometheus), `GET /api/metrics/json`

#### 4.6 Add Structured Logging ✅
- **File:** `packages/observability/src/logger.ts`
- **Features:**
  - JSON format for log aggregators
  - Correlation IDs for request tracing
  - Log levels (debug, info, warn, error, fatal)
  - Request logging middleware
  - Async operation timing

#### 4.7 Create Monitoring Dashboard ✅
- **Files:**
  - `infrastructure/monitoring/prometheus.yml`
  - `infrastructure/monitoring/grafana-dashboard.json`
  - `infrastructure/monitoring/docker-compose.monitoring.yml`
- **Panels:**
  - Generation duration (p50, p95)
  - Generation rate (success/failed)
  - Active generations
  - Queue size
  - Circuit breaker states
  - API response times
  - Build rates by platform
  - Validation pass rates by tier

---

## Testing Strategy

### Test Types by Layer

| Layer | Test Type | Tools | Coverage Target |
|-------|-----------|-------|-----------------|
| **Unit** | Function tests | Jest | 80% |
| **Integration** | Service tests | Jest + Supertest | 70% |
| **E2E** | Full pipeline | Custom runner | Critical paths |
| **Visual** | Screenshot diff | Pixelmatch | UI components |

### Test Requirements per Task
- Every task MUST include tests
- Tests MUST pass before merge
- Build MUST succeed after each task

### CI/CD Checks
```yaml
checks:
  - tsc --noEmit (all packages)
  - eslint (all packages)
  - jest --coverage
  - build (all services)
```

---

## Success Criteria

### Sprint 1 Complete When:
- [x] Session duration shows correct time
- [x] Tier 3 validation actually runs checks
- [x] Generated apps are verified before completion
- [x] All TypeScript errors fixed
- [x] Tests pass: 100%

### Sprint 2 Complete When:
- [x] Users can view web preview
- [x] Users can scan QR for Expo Go
- [x] Previews auto-expire after 24h
- [x] Preview UI is functional
- [x] Tests pass: 100%

### Sprint 3 Complete When:
- [x] @mobigen/testing package works
- [x] Tester service responds to requests
- [x] Maestro tests are generated
- [x] Visual regression detects changes
- [x] TypeScript builds pass

### Sprint 4 Complete When:
- [x] Generation runs via queue
- [x] Circuit breakers protect external calls
- [x] Health checks report status
- [x] Metrics are being recorded
- [x] TypeScript builds pass

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Claude API changes | Abstract behind interface |
| EAS build failures | Retry logic + fallback |
| Preview hosting costs | Auto-cleanup + limits |
| Test flakiness | Retry + isolation |

---

## Team Allocation

| Agent | Sprint 1 | Sprint 2 | Sprint 3 | Sprint 4 |
|-------|----------|----------|----------|----------|
| **Developer** | Fixes | Preview API | Testing pkg | Queue impl |
| **Architect** | - | Infrastructure | - | Resilience design |
| **QA** | Verification | Preview tests | Test framework | Monitoring |
| **DevOps** | - | Hosting setup | CI/CD | Dashboards |

