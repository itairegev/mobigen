---
id: fix-errors
description: Fix TypeScript and linting errors in a project
category: Maintenance
arguments:
  - name: projectId
    description: The project ID to fix
    required: true
agents:
  - validator
  - error-fixer
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
---

# Fix Errors

You are fixing TypeScript and ESLint errors in a project.

## Project
Working on project: {{projectId}}

## Instructions

1. **Identify Errors**
   - Run `tsc --noEmit` to get TypeScript errors
   - Run `eslint src/` to get linting errors
   - Categorize errors by type and file

2. **Fix TypeScript Errors First**
   - Fix type mismatches
   - Add missing imports
   - Fix undefined variables
   - Add proper type annotations

3. **Fix ESLint Errors**
   - Fix formatting issues
   - Fix unused variables
   - Fix import order
   - Fix any remaining issues

4. **Verify**
   - Re-run TypeScript check
   - Re-run ESLint
   - Ensure all errors are resolved

Maximum 3 retry attempts. If errors persist, flag for human review.
