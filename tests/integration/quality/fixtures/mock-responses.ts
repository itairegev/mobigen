/**
 * Mock AI Agent Responses for Testing
 */

export interface MockAgentResponse {
  agentId: string;
  phase: string;
  response: string;
  filesModified?: string[];
  shouldFail?: boolean;
}

export const mockAnalyzerResponse: MockAgentResponse = {
  agentId: 'intent-analyzer',
  phase: 'analysis',
  response: JSON.stringify({
    template: 'base',
    category: 'custom',
    features: ['menu', 'item-details'],
    complexity: 'low',
  }),
};

export const mockValidatorSuccessResponse: MockAgentResponse = {
  agentId: 'validator',
  phase: 'validation',
  response: `
All validation checks passed successfully!

TypeScript: ✓ PASS
ESLint: ✓ PASS
Imports: ✓ PASS
Navigation: ✓ PASS

No errors found.
  `,
  shouldFail: false,
};

export const mockValidatorFailureResponse: MockAgentResponse = {
  agentId: 'validator',
  phase: 'validation',
  response: `
Validation failed with errors:

TypeScript: ✗ FAIL
  src/components/Menu.tsx(15,10): error TS2304: Cannot find name 'MenuItem'
  src/app/index.tsx(8,5): error TS2305: Module '"react-navigation"' has no exported member 'NavigationContainer'

ESLint: ✗ FAIL
  src/components/Menu.tsx:3:1 error 'React' is not defined no-undef

Imports: ✗ FAIL
  Cannot resolve import './types/MenuItem' in src/components/Menu.tsx

Total errors: 4
  `,
  shouldFail: true,
};

export const mockErrorFixerResponse: MockAgentResponse = {
  agentId: 'error-fixer',
  phase: 'fix',
  response: `
Fixed the following errors:

1. Added missing import: import type { MenuItem } from './types'
2. Fixed React import: import React from 'react'
3. Corrected navigation import: import { NavigationContainer } from '@react-navigation/native'
4. Created missing type file: src/types/MenuItem.ts

All fixes applied successfully.
  `,
  filesModified: [
    'src/components/Menu.tsx',
    'src/app/index.tsx',
    'src/types/MenuItem.ts',
  ],
  shouldFail: false,
};

export const mockDeveloperResponse: MockAgentResponse = {
  agentId: 'developer',
  phase: 'implementation',
  response: `
Implementation completed:

Created/Modified files:
- src/components/ProductCard.tsx
- src/app/(tabs)/menu.tsx
- src/types/Product.ts
- src/hooks/useProducts.ts

All TypeScript types defined properly.
Navigation routes registered.
  `,
  filesModified: [
    'src/components/ProductCard.tsx',
    'src/app/(tabs)/menu.tsx',
    'src/types/Product.ts',
    'src/hooks/useProducts.ts',
  ],
};

export const mockBuildValidatorSuccessResponse: MockAgentResponse = {
  agentId: 'build-validator',
  phase: 'build-validation',
  response: `
Build validation successful!

✓ package.json valid
✓ app.json valid
✓ Dependencies installable
✓ Expo prebuild succeeded
✓ Metro bundler can bundle the app

Ready for build.
  `,
  shouldFail: false,
};

export const mockBuildValidatorFailureResponse: MockAgentResponse = {
  agentId: 'build-validator',
  phase: 'build-validation',
  response: `
Build validation failed!

✗ Expo prebuild failed with error:
  Error: Unable to resolve module 'non-existent-package'

This will prevent the app from building.
  `,
  shouldFail: true,
};

/**
 * Get mock response for a specific agent and scenario
 */
export function getMockResponse(
  agentId: string,
  phase: string,
  scenario: 'success' | 'failure' = 'success'
): MockAgentResponse | undefined {
  const responses: MockAgentResponse[] = [
    mockAnalyzerResponse,
    mockValidatorSuccessResponse,
    mockValidatorFailureResponse,
    mockErrorFixerResponse,
    mockDeveloperResponse,
    mockBuildValidatorSuccessResponse,
    mockBuildValidatorFailureResponse,
  ];

  return responses.find(
    r => r.agentId === agentId &&
         r.phase === phase &&
         (scenario === 'success' ? !r.shouldFail : r.shouldFail)
  );
}
