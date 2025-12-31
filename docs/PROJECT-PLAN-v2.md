# Mobigen v2.0 - Production Readiness Project Plan

**Created:** December 31, 2024
**Status:** Active
**Linear Project:** MOB (Mobigen Production)

---

## Project Overview

Transform Mobigen from MVP to production-ready platform by addressing:
- Preview capabilities for users
- Build reliability and verification
- Testing infrastructure
- Scaling and resilience

---

## Sprint Structure

| Sprint | Focus | Duration | Key Deliverables |
|--------|-------|----------|------------------|
| **Sprint 1** | Critical Fixes | 3 days | Session fix, validation, verification |
| **Sprint 2** | Preview System | 5 days | Web preview, QR codes, hosting |
| **Sprint 3** | Testing Infrastructure | 5 days | Testing package, Maestro, integration |
| **Sprint 4** | Scaling & Resilience | 5 days | Queues, circuit breakers, monitoring |

---

## Sprint 1: Critical Fixes (3 days)

### Goals
- Fix critical bugs blocking production use
- Implement actual validation (not stubbed)
- Add post-generation verification

### Tasks

#### 1.1 Fix Session Duration Bug
- **File:** `services/generator/src/session-manager.ts`
- **Issue:** Duration always ~0 seconds
- **Test:** Unit test for session duration calculation

#### 1.2 Implement Tier 3 Validation
- **File:** `services/builder/src/build-service.ts`
- **Issue:** `runTier3Validation()` returns `{ passed: true }` always
- **Test:** Integration test with failing/passing projects

#### 1.3 Add Generation Verification
- **Files:** New `services/generator/src/verification.ts`
- **Purpose:** Verify generated app before marking complete
- **Test:** E2E test with intentionally broken generation

#### 1.4 Fix TypeScript Errors
- Run `tsc --noEmit` across all packages
- Fix any existing errors
- **Test:** CI check passes

---

## Sprint 2: Preview System (5 days)

### Goals
- Users can preview apps before building
- Multiple preview methods (Web, QR, Dev Build)
- Preview hosting infrastructure

### Tasks

#### 2.1 Create Web Deployer Agent
- **File:** `agents/builtin/web-deployer.md`
- **Purpose:** Export app to web and deploy
- **Test:** Agent produces valid web export

#### 2.2 Implement Web Preview Endpoint
- **File:** `services/generator/src/api.ts`
- **Endpoint:** `POST /api/projects/:id/preview/web`
- **Test:** API returns preview URL

#### 2.3 Add Expo Go QR Code Generation
- **File:** `services/generator/src/preview-service.ts`
- **Endpoint:** `GET /api/projects/:id/preview/qr`
- **Test:** QR code is scannable, connects to Expo

#### 2.4 Set Up Preview Hosting
- **Infrastructure:** S3 bucket + CloudFront
- **Config:** `infrastructure/preview-hosting.tf`
- **Test:** Uploaded preview is accessible

#### 2.5 Add Preview UI to Web App
- **File:** `apps/web/src/app/projects/[id]/preview/`
- **Features:** Web iframe, QR display, status
- **Test:** UI shows preview correctly

#### 2.6 Preview Cleanup Job
- **File:** `services/generator/src/jobs/cleanup-previews.ts`
- **Purpose:** Delete expired previews (24h default)
- **Test:** Old previews are removed

---

## Sprint 3: Testing Infrastructure (5 days)

### Goals
- Complete @mobigen/testing package
- Integrate tester service
- Automated test generation and execution

### Tasks

#### 3.1 Implement Testing Package
- **Location:** `packages/testing/src/`
- **Modules:**
  - `validators/typescript.ts`
  - `validators/eslint.ts`
  - `validators/navigation.ts`
  - `validators/imports.ts`
  - `runners/tier1.ts`
  - `runners/tier2.ts`
  - `runners/tier3.ts`
- **Test:** Unit tests for each validator

#### 3.2 Wire Tester Service
- **File:** `services/tester/src/index.ts`
- **Purpose:** Expose testing via API
- **Endpoints:**
  - `POST /api/test/tier1`
  - `POST /api/test/tier2`
  - `POST /api/test/tier3`
- **Test:** Each tier runs correctly

#### 3.3 Implement Maestro Test Generation
- **File:** `packages/testing/src/maestro/generator.ts`
- **Purpose:** Generate Maestro YAML from app structure
- **Test:** Generated tests are valid YAML

#### 3.4 Add Visual Regression Testing
- **File:** `packages/testing/src/visual/`
- **Tools:** Pixelmatch, screenshot comparison
- **Test:** Detects visual changes

#### 3.5 Integrate Testing with Generator
- **File:** `services/generator/src/pipeline-executor.ts`
- **Purpose:** Run tests after each phase
- **Test:** Pipeline fails on test failure

#### 3.6 Add Test Results to Web UI
- **File:** `apps/web/src/app/projects/[id]/tests/`
- **Features:** Test history, failures, screenshots
- **Test:** UI displays test results

---

## Sprint 4: Scaling & Resilience (5 days)

### Goals
- Queue-based generation for scaling
- Circuit breakers for external services
- Monitoring and observability

### Tasks

#### 4.1 Move Generation to Queue
- **Files:**
  - `services/generator/src/queue/generation-queue.ts`
  - `services/generator/src/queue/generation-worker.ts`
- **Purpose:** Async generation with workers
- **Test:** Generation completes via queue

#### 4.2 Add Circuit Breakers
- **File:** `packages/resilience/src/circuit-breaker.ts`
- **Targets:** Claude API, EAS API, S3
- **Test:** Circuit opens on failures

#### 4.3 Implement Retry Logic
- **File:** `packages/resilience/src/retry.ts`
- **Features:** Exponential backoff, jitter
- **Test:** Retries on transient failures

#### 4.4 Add Health Checks
- **Files:** All services `/health` endpoints
- **Checks:** DB, Redis, Storage, External APIs
- **Test:** Health endpoint returns status

#### 4.5 Implement Metrics
- **File:** `packages/observability/src/metrics.ts`
- **Metrics:**
  - `generation_duration_seconds`
  - `build_success_total`
  - `active_generations`
  - `api_request_duration`
- **Test:** Metrics are recorded

#### 4.6 Add Structured Logging
- **File:** `packages/observability/src/logger.ts`
- **Features:** JSON format, correlation IDs
- **Test:** Logs are parseable JSON

#### 4.7 Create Monitoring Dashboard
- **File:** `infrastructure/monitoring/`
- **Tools:** Prometheus, Grafana (or CloudWatch)
- **Test:** Dashboard shows metrics

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
- [ ] Session duration shows correct time
- [ ] Tier 3 validation actually runs checks
- [ ] Generated apps are verified before completion
- [ ] All TypeScript errors fixed
- [ ] Tests pass: 100%

### Sprint 2 Complete When:
- [ ] Users can view web preview
- [ ] Users can scan QR for Expo Go
- [ ] Previews auto-expire after 24h
- [ ] Preview UI is functional
- [ ] Tests pass: 100%

### Sprint 3 Complete When:
- [ ] @mobigen/testing package works
- [ ] Tester service responds to requests
- [ ] Maestro tests are generated
- [ ] Visual regression detects changes
- [ ] Tests pass: 100%

### Sprint 4 Complete When:
- [ ] Generation runs via queue
- [ ] Circuit breakers protect external calls
- [ ] Health checks report status
- [ ] Metrics are being recorded
- [ ] Tests pass: 100%

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

