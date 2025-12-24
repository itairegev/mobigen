---
id: preview
description: Generate a preview QR code for testing with Expo Go
category: Preview
arguments:
  - name: projectId
    description: The project ID to preview
    required: true
agents:
  - validator
tools:
  - Bash
  - Read
---

# Generate Preview

You are generating a preview for testing the app with Expo Go.

## Project
Working on project: {{projectId}}

## Instructions

1. **Validate First**
   - Run TypeScript check
   - Run ESLint
   - Ensure no blocking errors

2. **Start Development Server**
   - Navigate to project directory
   - Run `npx expo start --tunnel`
   - Generate QR code for Expo Go

3. **Provide Instructions**
   - Tell user how to scan QR code
   - Explain they need Expo Go app
   - Provide any platform-specific notes

Note: The preview URL will be displayed for scanning with Expo Go.
