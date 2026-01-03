/**
 * Sample App Generation Requests for Testing
 */

export interface SampleRequest {
  id: string;
  name: string;
  prompt: string;
  expectedTemplate: string;
  complexity: 'low' | 'medium' | 'high';
  shouldSucceed: boolean;
  description: string;
}

export const sampleRequests: SampleRequest[] = [
  {
    id: 'restaurant-simple',
    name: 'Simple Restaurant App',
    prompt: 'Create a simple restaurant app for "Mario\'s Pizza" with a menu of pizzas and a way to view details about each pizza. Use red and yellow branding colors.',
    expectedTemplate: 'ecommerce',
    complexity: 'low',
    shouldSucceed: true,
    description: 'Basic restaurant menu - minimal customization needed',
  },
  {
    id: 'booking-service',
    name: 'Service Booking App',
    prompt: 'Build a salon booking app called "Beauty Studio" where customers can book appointments for haircuts, manicures, and facials. Use pink (#FF69B4) as primary color.',
    expectedTemplate: 'base',
    complexity: 'medium',
    shouldSucceed: true,
    description: 'Appointment booking with time slots',
  },
  {
    id: 'loyalty-coffee',
    name: 'Coffee Shop Loyalty',
    prompt: 'Create a loyalty rewards app for "Daily Grind Coffee". Customers earn points for each purchase and can redeem rewards. Use brown (#6F4E37) branding.',
    expectedTemplate: 'loyalty',
    complexity: 'low',
    shouldSucceed: true,
    description: 'Simple loyalty/rewards program',
  },
  {
    id: 'ai-tutor',
    name: 'AI Study Tutor',
    prompt: 'Make an AI study tutor app called "StudyBuddy" that helps students with homework questions using AI. Use blue (#4285F4) as the primary color.',
    expectedTemplate: 'ai-assistant',
    complexity: 'medium',
    shouldSucceed: true,
    description: 'AI chat interface with study context',
  },
  {
    id: 'news-local',
    name: 'Local News App',
    prompt: 'Build a local news app for "Downtown Gazette" showing articles in categories like Local, Sports, and Events.',
    expectedTemplate: 'news',
    complexity: 'low',
    shouldSucceed: true,
    description: 'Simple news feed with categories',
  },
];

export const problematicRequests: SampleRequest[] = [
  {
    id: 'invalid-missing-imports',
    name: 'Request That Will Cause Missing Imports',
    prompt: 'Create an app that uses a non-existent package "super-fake-library" extensively.',
    expectedTemplate: 'base',
    complexity: 'high',
    shouldSucceed: false,
    description: 'Will fail with missing import errors - tests auto-fix',
  },
  {
    id: 'type-errors',
    name: 'Request Likely to Cause Type Errors',
    prompt: 'Create a complex data management app with deeply nested TypeScript types and complex generics.',
    expectedTemplate: 'base',
    complexity: 'high',
    shouldSucceed: false,
    description: 'May cause TypeScript errors - tests auto-fix retry',
  },
];

/**
 * Get sample request by ID
 */
export function getSampleRequest(id: string): SampleRequest | undefined {
  return [...sampleRequests, ...problematicRequests].find(r => r.id === id);
}

/**
 * Get all simple requests (should succeed)
 */
export function getSimpleRequests(): SampleRequest[] {
  return sampleRequests.filter(r => r.complexity === 'low');
}

/**
 * Get all medium complexity requests
 */
export function getMediumRequests(): SampleRequest[] {
  return sampleRequests.filter(r => r.complexity === 'medium');
}

/**
 * Get problematic requests for testing error handling
 */
export function getProblematicRequests(): SampleRequest[] {
  return problematicRequests;
}
