---
id: generate-app
description: Generate a new mobile app from a description
category: Generation
arguments:
  - name: name
    description: The name of your app
    required: true
  - name: template
    description: Template to use (base, ecommerce, loyalty, news, ai-assistant)
    required: false
    default: base
agents:
  - intent-analyzer
  - product-manager
  - technical-architect
  - developer
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
---

# Generate Mobile App

You are initiating a new mobile app generation workflow.

## App Details
- **App Name**: {{name}}
- **Template**: {{template}}

## Instructions

Generate a complete mobile app based on the user's requirements. Follow this workflow:

1. **Analyze Requirements**
   - Use the intent-analyzer to understand what the user wants
   - Identify the category and key features needed
   - Select the most appropriate template

2. **Create Product Definition**
   - Use the product-manager to create a PRD
   - Define user stories and acceptance criteria
   - Prioritize features for MVP

3. **Design Architecture**
   - Use the technical-architect to design the system
   - Define data models and API structure
   - Plan the component hierarchy

4. **Implement**
   - Clone the selected template to the project
   - Customize based on requirements
   - Implement all defined features

5. **Validate**
   - Run TypeScript checks
   - Run ESLint
   - Verify the app builds correctly

The app should be production-ready and follow best practices for React Native + Expo development.
