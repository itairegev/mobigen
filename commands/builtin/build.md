---
id: build
description: Trigger a cloud build via Expo EAS
category: Build
arguments:
  - name: projectId
    description: The project ID to build
    required: true
  - name: platform
    description: Platform to build for (ios, android, all)
    required: false
    default: all
agents:
  - validator
tools:
  - Bash
  - Read
---

# Cloud Build

You are triggering a cloud build via Expo EAS.

## Project
Working on project: {{projectId}}

## Platform
Building for: {{platform}}

## Instructions

1. **Pre-build Validation**
   - Run full validation suite
   - Ensure no TypeScript errors
   - Ensure no ESLint errors
   - Run `npx expo prebuild --clean`

2. **Configure Build**
   - Verify eas.json exists
   - Check bundle identifiers are set
   - Verify credentials are configured

3. **Trigger Build**
   - For iOS: `eas build --platform ios --profile production`
   - For Android: `eas build --platform android --profile production`
   - For both: `eas build --platform all --profile production`

4. **Track Progress**
   - Provide build URL for monitoring
   - Notify when build completes
   - Report any build errors

Note: EAS credentials must be configured before building.
