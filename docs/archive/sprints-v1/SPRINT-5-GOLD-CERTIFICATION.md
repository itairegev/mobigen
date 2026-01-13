# Sprint 5: Gold Certification (Priority Templates)

**Status:** 🚧 NOT STARTED
**Focus:** Create Maestro E2E tests for top 6 templates to achieve Gold certification
**Phase:** 3 - Gold & Production
**Priority:** P0 - Start Here

---

## Goals

1. Implement Maestro test runner in certification pipeline
2. Create E2E tests for 6 priority templates
3. Achieve Gold certification for priority templates
4. Integrate E2E testing with CI/CD

---

## Priority Templates for Gold

These templates were selected based on:
- Most commonly used categories
- Revenue potential
- Template complexity (good test coverage examples)

| # | Template | Category | Priority | Reason |
|---|----------|----------|----------|--------|
| 1 | restaurant | Food & Dining | P0 | High demand, complex flows |
| 2 | ecommerce | E-commerce | P0 | Revenue generating, cart/checkout |
| 3 | service-booking | Booking | P0 | Calendar, scheduling logic |
| 4 | fitness | Health | P1 | Workout tracking, progress |
| 5 | ai-assistant | AI | P1 | Chat flows, API integration |
| 6 | loyalty | Rewards | P1 | Points, QR scanning |

---

## Tasks

### Task 5.1: Create Maestro Test Framework

**Priority:** P0 - Critical
**Status:** ⏳ Pending
**Deliverable:** `packages/testing/src/maestro/runner.ts`

**Requirements:**
- Maestro CLI wrapper for programmatic execution
- Test file discovery and execution
- Result parsing and reporting
- Integration with certification pipeline

**Files to Create:**
```
packages/testing/src/maestro/
├── index.ts           # Main exports
├── runner.ts          # Maestro CLI wrapper
├── parser.ts          # Result parser
├── generator.ts       # Test generation from app structure
└── types.ts           # TypeScript interfaces
```

**Example Runner API:**
```typescript
import { MaestroRunner } from '@mobigen/testing/maestro';

const runner = new MaestroRunner({
  projectPath: '/path/to/template',
  bundleId: 'com.example.app',
  platform: 'ios',
});

const results = await runner.runAll();
// { passed: true, tests: 5, failed: 0, duration: 120000 }
```

---

### Task 5.2: Restaurant Template E2E Tests

**Priority:** P1 - High
**Status:** ⏳ Pending
**Deliverable:** `templates/restaurant/.maestro/`

**Critical User Flows:**
1. **Browse Menu** - View categories, items
2. **Add to Cart** - Select item, customize, add
3. **Checkout** - Review cart, place order
4. **Order Tracking** - View order status
5. **Reservations** - Book a table

**Test Files:**
```
templates/restaurant/.maestro/
├── config.yaml        # App configuration
├── browse-menu.yaml   # Menu navigation tests
├── add-to-cart.yaml   # Cart operations
├── checkout.yaml      # Checkout flow
├── order-tracking.yaml # Order status
└── reservations.yaml  # Booking flow
```

**Example Test (browse-menu.yaml):**
```yaml
appId: ${APP_BUNDLE_ID}
tags:
  - critical
  - menu
---
- launchApp:
    clearState: true

- assertVisible: "Menu"
- tapOn: "Categories"
- assertVisible: "Appetizers"
- tapOn: "Appetizers"
- assertVisible:
    id: "menu-item-0"

- tapOn:
    id: "menu-item-0"
- assertVisible: "Add to Cart"
```

---

### Task 5.3: E-commerce Template E2E Tests

**Priority:** P1 - High
**Status:** ⏳ Pending
**Deliverable:** `templates/ecommerce/.maestro/`

**Critical User Flows:**
1. **Product Discovery** - Search, filter, browse
2. **Product Details** - View, select variants
3. **Cart Management** - Add, update, remove
4. **Checkout Flow** - Address, payment, confirm
5. **Order History** - View past orders

---

### Task 5.4: Service-booking Template E2E Tests

**Priority:** P1 - High
**Status:** ⏳ Pending
**Deliverable:** `templates/service-booking/.maestro/`

**Critical User Flows:**
1. **Browse Services** - View service catalog
2. **Select Provider** - Choose staff member
3. **Book Appointment** - Select date/time
4. **Confirm Booking** - Review and confirm
5. **Manage Bookings** - View, reschedule, cancel

---

### Task 5.5: Fitness Template E2E Tests

**Priority:** P1 - High
**Status:** ⏳ Pending
**Deliverable:** `templates/fitness/.maestro/`

**Critical User Flows:**
1. **Browse Workouts** - View workout library
2. **Start Workout** - Begin exercise session
3. **Track Progress** - Log sets, reps, weight
4. **View History** - See workout history
5. **Set Goals** - Create fitness goals

---

### Task 5.6: AI-assistant Template E2E Tests

**Priority:** P1 - High
**Status:** ⏳ Pending
**Deliverable:** `templates/ai-assistant/.maestro/`

**Critical User Flows:**
1. **Start Conversation** - Send first message
2. **Continue Chat** - Multi-turn conversation
3. **View History** - Access past conversations
4. **Clear Chat** - Delete conversation
5. **Settings** - Configure AI behavior

---

### Task 5.7: Loyalty Template E2E Tests

**Priority:** P1 - High
**Status:** ⏳ Pending
**Deliverable:** `templates/loyalty/.maestro/`

**Critical User Flows:**
1. **View Points** - Check balance
2. **Browse Rewards** - View available rewards
3. **Redeem Reward** - Claim a reward
4. **Scan QR** - Earn points at store
5. **Transaction History** - View earning/spending

---

### Task 5.8: Integrate Maestro with Certification Pipeline

**Priority:** P0 - Critical
**Status:** ⏳ Pending
**Deliverable:** Updated `scripts/certify-all-templates.ts`

**Requirements:**
- Add Tier 3 (Gold) validation to certification runner
- Run Maestro tests as part of Gold certification
- Generate Gold certification reports
- Update template configs with Gold status

**Implementation:**
```typescript
// In certify-all-templates.ts
import { MaestroRunner } from '@mobigen/testing/maestro';

async function runTier3Validation(templatePath: string): Promise<ValidationResult> {
  // Check if .maestro directory exists
  const maestroDir = path.join(templatePath, '.maestro');
  if (!fs.existsSync(maestroDir)) {
    return { passed: false, reason: 'No Maestro tests found' };
  }

  const runner = new MaestroRunner({ projectPath: templatePath });
  const results = await runner.runAll();

  return {
    passed: results.failed === 0,
    tests: results.tests,
    duration: results.duration,
    errors: results.failures,
  };
}
```

---

## Success Criteria

### Sprint Complete When:
- [ ] Maestro runner works in certification pipeline
- [ ] 6 priority templates have E2E tests
- [ ] All 6 priority templates pass Gold certification
- [ ] Certification report shows Gold status
- [ ] E2E tests run in < 10 minutes per template

### Metrics:
| Metric | Target |
|--------|--------|
| Gold Certified Templates | 6 |
| E2E Tests per Template | 5+ |
| E2E Test Pass Rate | 100% |
| Total E2E Execution Time | < 60 min |

---

## Dependencies

- Maestro CLI installed (`curl -Ls https://get.maestro.mobile.dev | bash`)
- iOS Simulator or Android Emulator
- Templates passing Silver certification

---

## References

- [Maestro Documentation](https://maestro.mobile.dev/)
- [Certification README](../CERTIFICATION-README.md)
- [Testing Package](../../packages/testing/)
