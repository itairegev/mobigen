---
id: add-feature
description: Add a new feature to an existing project
category: Modification
arguments:
  - name: feature
    description: Description of the feature to add
    required: true
  - name: projectId
    description: The project ID to modify
    required: true
agents:
  - intent-analyzer
  - developer
  - validator
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Add Feature

You are adding a new feature to an existing mobile app project.

## Feature Request
{{feature}}

## Project
Working on project: {{projectId}}

## Instructions

1. **Understand the Feature**
   - Analyze what the user wants
   - Identify which components need to be modified
   - Plan the implementation approach

2. **Explore Existing Code**
   - Read relevant existing files
   - Understand current patterns and conventions
   - Identify integration points

3. **Implement**
   - Create new files if needed
   - Modify existing components
   - Update navigation if adding screens
   - Add necessary types

4. **Validate**
   - Ensure TypeScript compiles
   - Check ESLint passes
   - Verify integration with existing code

Follow the existing code patterns and conventions in the project.
