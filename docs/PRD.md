# Mobigen 2.0 - Product Requirements Document

**Version:** 2.0
**Date:** January 2026
**Status:** Active
**Owner:** Product Team

---

## Executive Summary

Mobigen 2.0 transforms the mobile app generation experience from a 50-70 minute wait into an instant, engaging journey. Users see their branded app mockup in under 3 seconds, interact with it while the real native app builds in 3-5 minutes.

**Core Value Proposition:** "See your app instantly. Ship it in minutes."

---

## Problem Statement

### Current State
- Users wait **50-70 minutes** before seeing any preview of their app
- Every request (even simple color changes) triggers a full 9-agent pipeline
- No visual feedback during generation - just progress percentages
- High drop-off rate due to long wait times
- Users lose excitement and engagement during the wait

### Impact
- Poor first-time user experience kills conversion
- Simple customizations take the same time as complex features
- No "wow" moment to drive viral sharing
- Competitive disadvantage vs. tools with faster feedback loops

---

## Solution Overview

### Three-Tier Progressive Experience

```
┌─────────────────────────────────────────────────────────────────┐
│  TIER 1: INSTANT MOCKUP (0-3 seconds)                          │
│  ─────────────────────────────────────                          │
│  • High-fidelity interactive mockup                            │
│  • User's branding applied instantly                           │
│  • Tappable navigation between screens                         │
│  • Animated transitions                                        │
│  • "This is what your app will look like"                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (building in background)
┌─────────────────────────────────────────────────────────────────┐
│  TIER 2: NATIVE PREVIEW (3-5 minutes)                          │
│  ─────────────────────────────────────                          │
│  • Real Expo Go preview on device                              │
│  • Optimized build pipeline                                    │
│  • Smart routing skips unnecessary AI for simple requests      │
│  • Pre-cached dependencies                                     │
│  • QR code scan → real app on phone                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (on-demand)
┌─────────────────────────────────────────────────────────────────┐
│  TIER 3: PRODUCTION BUILD (10-15 minutes)                      │
│  ─────────────────────────────────────                          │
│  • Full validation suite                                       │
│  • Store-ready iOS/Android builds                              │
│  • Complete QA assessment                                      │
│  • Submission-ready artifacts                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## User Stories

### Epic 1: Instant Visual Feedback

**US-1.1: First-Time User Sees App Instantly**
> As a first-time user, I want to see what my app will look like immediately after selecting a template and brand colors, so I feel confident and excited about the product.

**Acceptance Criteria:**
- [ ] Mockup appears within 3 seconds of form submission
- [ ] Mockup shows user's selected colors applied to template
- [ ] Mockup displays user's app name and logo (if provided)
- [ ] User can tap through screens to explore the app flow
- [ ] Animations show transitions between screens
- [ ] Clear messaging: "Building your real app... (X min remaining)"

**US-1.2: Interactive Mockup Navigation**
> As a user viewing the mockup, I want to tap on different elements to see other screens, so I can understand the full app experience.

**Acceptance Criteria:**
- [ ] Tab bar navigation works in mockup
- [ ] Buttons link to relevant screens
- [ ] Screen transitions are animated
- [ ] Current screen is highlighted in navigation
- [ ] Mockup feels like a real app experience

**US-1.3: Real-Time Branding Updates**
> As a user, I want to change my brand colors and see the mockup update instantly, so I can experiment before committing.

**Acceptance Criteria:**
- [ ] Color picker updates mockup in real-time (<100ms)
- [ ] Logo upload reflects immediately in mockup
- [ ] App name changes appear instantly
- [ ] No page reload required

### Epic 2: Optimized Native Preview

**US-2.1: Fast Native Build**
> As a user, I want my real native app preview ready in under 5 minutes, so I can test it on my actual phone quickly.

**Acceptance Criteria:**
- [ ] Native preview ready in 3-5 minutes for simple requests
- [ ] QR code displayed prominently when ready
- [ ] Push notification (if enabled) when preview is ready
- [ ] User can continue viewing/interacting with mockup while waiting

**US-2.2: Smart Request Routing**
> As a user making a simple change (like colors), I want it to apply quickly without waiting for unnecessary processing.

**Acceptance Criteria:**
- [ ] Color/branding changes: <30 seconds to native preview update
- [ ] Adding existing template screen: <2 minutes
- [ ] Custom feature requests: Full pipeline (3-5 minutes)
- [ ] System correctly classifies request complexity

**US-2.3: Background Enhancement**
> As a user, I want to start using my preview immediately while improvements continue in the background.

**Acceptance Criteria:**
- [ ] Preview is usable even if enhancements are pending
- [ ] User notified when enhancements complete
- [ ] Preview hot-reloads with improvements (no re-scan)
- [ ] User can disable background work if desired

### Epic 3: Progressive UI Experience

**US-3.1: Visual Build Progress**
> As a user, I want to see my app being built visually, not just a percentage bar, so the wait feels engaging.

**Acceptance Criteria:**
- [ ] Phone mockup shows components "appearing" as built
- [ ] Current build phase displayed with clear description
- [ ] Estimated time remaining shown
- [ ] Visual differentiation between phases

**US-3.2: Seamless Mockup-to-Native Transition**
> As a user, when my native preview is ready, I want a smooth transition from mockup to real app.

**Acceptance Criteria:**
- [ ] Clear visual indicator when native is ready
- [ ] QR code appears with animation/celebration
- [ ] Option to continue viewing mockup or scan QR
- [ ] Instructions for Expo Go if user doesn't have it

### Epic 4: Chat-Based Refinement

**US-4.1: Instant Mockup Updates from Chat**
> As a user, I want to describe changes in chat and see the mockup update immediately.

**Acceptance Criteria:**
- [ ] Simple changes (colors, text) update mockup in <1 second
- [ ] User sees "Updating preview..." indicator
- [ ] Changes that need native rebuild show ETA
- [ ] Chat acknowledges what was changed

**US-4.2: Smart Change Classification**
> As a user, I want the system to tell me if my change is instant or needs a rebuild.

**Acceptance Criteria:**
- [ ] System classifies: instant / quick / rebuild required
- [ ] User informed before committing to rebuild
- [ ] Option to batch multiple changes before rebuild
- [ ] Clear feedback on what's possible instantly

---

## Feature Requirements

### F1: Instant Mockup System

**F1.1: Mockup Generator**
- Pre-rendered screen images for each template
- Dynamic color overlay system using CSS filters/SVG
- Logo injection with proper sizing/placement
- Text replacement for app name, tagline
- Performance target: <100ms render time

**F1.2: Interactive Mockup Viewer**
- Phone frame component (iPhone/Android toggle)
- Screen carousel with swipe navigation
- Tappable hotspots linked to other screens
- Animated transitions (slide, fade)
- Zoom capability for detail viewing

**F1.3: Real-Time Customization**
- Color picker with live preview
- Logo upload with crop/resize
- App name input with character limit
- Font selection (from template options)
- All changes reflected instantly in mockup

### F2: Smart Request Router

**F2.1: Request Classification Engine**
```
TRIVIAL (no AI):
- Color changes
- Logo swap
- App name change
- Font change
- Toggle existing feature on/off

SIMPLE (single agent):
- Add screen from template library
- Modify existing screen layout
- Change navigation structure
- Update copy/text content

MODERATE (minimal pipeline):
- Add new feature (reviews, wishlist)
- Custom data fields
- Third-party integration
- New screen design

COMPLEX (full pipeline):
- Major architectural changes
- Multiple new features
- Custom business logic
- Significant UX overhaul
```

**F2.2: Pipeline Selection**
- Trivial: Direct AST transforms, no AI
- Simple: Developer agent only
- Moderate: Architect + Developer + Validator
- Complex: Full 9-agent pipeline

### F3: Optimized Build Pipeline

**F3.1: Template Pre-Optimization**
- Pre-installed node_modules per template (cached)
- Pre-built Metro bundles (warm cache)
- Template-specific TypeScript configs optimized
- Dependency lockfiles verified and cached

**F3.2: Parallel Processing**
- Start Metro bundler immediately on project creation
- Run customization while bundler warms up
- Parallel: branding transforms + dependency install
- Generate QR code as soon as bundle ready

**F3.3: Incremental Updates**
- Hot-reload for trivial changes
- Delta bundling for simple changes
- Full rebuild only for structural changes
- Preserve Expo Go connection across updates

### F4: Progressive UI Components

**F4.1: Build Visualizer**
- Phone mockup with "building" animation
- Component pieces flying into place
- Phase indicator with descriptions
- Time remaining estimate

**F4.2: Celebration Moments**
- Animation when mockup first appears
- Confetti/pulse when native preview ready
- Success sound (optional, user preference)
- Share prompt for social proof

**F4.3: Status Communication**
- Clear, jargon-free status messages
- Progress that actually progresses (no stuck states)
- Error states with actionable recovery
- Background task indicators

---

## Technical Constraints

### Performance Requirements
| Metric | Target | Maximum |
|--------|--------|---------|
| Time to mockup | <3 sec | 5 sec |
| Mockup interaction latency | <100ms | 200ms |
| Color change reflection | <100ms | 200ms |
| Native preview (simple) | <3 min | 5 min |
| Native preview (complex) | <5 min | 10 min |

### Compatibility
- Mockup: All modern browsers (Chrome, Safari, Firefox, Edge)
- Native preview: Expo Go on iOS 13+ and Android 8+
- Responsive: Desktop, tablet, mobile web

### Infrastructure
- Mockup assets served via CDN
- Template caches stored in S3
- Build workers scalable to demand
- WebSocket for real-time updates

---

## Success Metrics

### Primary KPIs
| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Time to first visual | 70 min | <3 sec | Analytics |
| Time to native preview | 70 min | <5 min | Analytics |
| First-session completion rate | Unknown | >80% | Analytics |
| User drop-off during generation | High | <10% | Analytics |

### Secondary KPIs
| Metric | Target | Measurement |
|--------|--------|-------------|
| Mockup engagement time | >30 sec | Analytics |
| QR code scan rate | >70% | Analytics |
| Return user rate (7 day) | >40% | Analytics |
| NPS score | >50 | Survey |
| Social shares | >5% of users | Analytics |

### Quality Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Mockup accuracy vs native | >90% | Manual QA |
| Build success rate | >99% | Monitoring |
| Preview load success | >99% | Monitoring |
| Error recovery rate | >95% | Monitoring |

---

## Out of Scope (v2.0)

1. **Web preview** - Decided against due to native fidelity concerns
2. **Real-time collaboration** - Future version
3. **Custom code editing** - Pro/Enterprise feature
4. **Template creation tools** - Separate initiative
5. **Offline mockup viewing** - Future enhancement

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Mockup doesn't match native | Medium | High | Strict template certification, visual QA |
| Build time exceeds 5 min | Medium | Medium | Pre-warming, caching, parallel processing |
| Mockup assets too large | Low | Medium | CDN, lazy loading, compression |
| User expects mockup IS the app | Medium | High | Clear messaging, visual differentiation |
| Complex requests misclassified | Medium | Medium | Conservative classification, user override |

---

## Dependencies

1. **Template Certification** - All templates must be certified with mockup assets
2. **CDN Setup** - Mockup assets need global distribution
3. **Cache Infrastructure** - Template dependency caching
4. **WebSocket Reliability** - Real-time updates critical

---

## Rollout Plan

### Phase 1: Internal Alpha (Week 1-2)
- Team testing of mockup system
- Performance benchmarking
- Bug fixes and polish

### Phase 2: Limited Beta (Week 3-4)
- 10% of new users
- A/B test against old flow
- Gather feedback and metrics

### Phase 3: General Availability (Week 5)
- 100% of new users
- Old flow available via "Advanced Mode"
- Monitor and iterate

### Phase 4: Full Migration (Week 8)
- Deprecate old flow for new projects
- Existing projects can opt-in
- Complete analytics dashboard

---

## Appendix

### A: Template Mockup Asset Requirements

Each template needs:
```
template-name/
├── mockup/
│   ├── screens/
│   │   ├── home.png (1170x2532 @3x)
│   │   ├── home-tablet.png (2048x2732)
│   │   ├── detail.png
│   │   ├── profile.png
│   │   └── ... (all screens)
│   ├── hotspots.json (tap targets)
│   ├── navigation.json (screen flow)
│   └── branding-zones.json (where colors/logo apply)
```

### B: Request Classification Examples

**Trivial:**
- "Change the primary color to blue"
- "Use my logo instead"
- "Call it 'My Coffee Shop'"

**Simple:**
- "Add a contact us page"
- "Remove the reviews section"
- "Change the tab order"

**Moderate:**
- "Add a loyalty points system"
- "Integrate with Stripe payments"
- "Add product reviews with ratings"

**Complex:**
- "Add a marketplace where users can sell"
- "Implement a subscription model"
- "Add real-time chat between users"

---

**Document Status:** Approved
**Next Step:** Technical Architecture
**Last Updated:** January 2026
