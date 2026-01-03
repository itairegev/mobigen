/**
 * Expected Outputs for Test Validation
 */

export interface ExpectedFileStructure {
  requiredFiles: string[];
  optionalFiles: string[];
  forbiddenFiles: string[];
  minFileCount: number;
  maxFileCount: number;
}

export interface ExpectedValidation {
  tier1ShouldPass: boolean;
  tier2ShouldPass: boolean;
  tier3ShouldPass: boolean;
  allowedWarnings: number;
  maxErrors: number;
}

export interface ExpectedOutput {
  requestId: string;
  fileStructure: ExpectedFileStructure;
  validation: ExpectedValidation;
  customChecks?: {
    checkNavigation?: boolean;
    checkImports?: boolean;
    checkTypes?: boolean;
    checkBranding?: boolean;
  };
}

export const expectedOutputs: Record<string, ExpectedOutput> = {
  'restaurant-simple': {
    requestId: 'restaurant-simple',
    fileStructure: {
      requiredFiles: [
        'package.json',
        'app.json',
        'tsconfig.json',
        'src/app/_layout.tsx',
      ],
      optionalFiles: [
        'src/app/(tabs)/index.tsx',
        'src/components/ProductCard.tsx',
      ],
      forbiddenFiles: [
        'node_modules',
        '.expo',
        'build',
      ],
      minFileCount: 15,
      maxFileCount: 100,
    },
    validation: {
      tier1ShouldPass: true,
      tier2ShouldPass: true,
      tier3ShouldPass: true,
      allowedWarnings: 5,
      maxErrors: 0,
    },
    customChecks: {
      checkNavigation: true,
      checkImports: true,
      checkTypes: true,
      checkBranding: true,
    },
  },

  'booking-service': {
    requestId: 'booking-service',
    fileStructure: {
      requiredFiles: [
        'package.json',
        'app.json',
        'tsconfig.json',
        'src/app/_layout.tsx',
      ],
      optionalFiles: [],
      forbiddenFiles: ['node_modules', '.expo'],
      minFileCount: 15,
      maxFileCount: 150,
    },
    validation: {
      tier1ShouldPass: true,
      tier2ShouldPass: true,
      tier3ShouldPass: true,
      allowedWarnings: 10,
      maxErrors: 0,
    },
    customChecks: {
      checkNavigation: true,
      checkImports: true,
    },
  },

  'loyalty-coffee': {
    requestId: 'loyalty-coffee',
    fileStructure: {
      requiredFiles: [
        'package.json',
        'app.json',
        'src/app/_layout.tsx',
      ],
      optionalFiles: [
        'src/components/RewardCard.tsx',
        'src/components/PointsDisplay.tsx',
      ],
      forbiddenFiles: ['node_modules'],
      minFileCount: 15,
      maxFileCount: 100,
    },
    validation: {
      tier1ShouldPass: true,
      tier2ShouldPass: true,
      tier3ShouldPass: true,
      allowedWarnings: 5,
      maxErrors: 0,
    },
    customChecks: {
      checkNavigation: true,
      checkImports: true,
      checkBranding: true,
    },
  },

  'ai-tutor': {
    requestId: 'ai-tutor',
    fileStructure: {
      requiredFiles: [
        'package.json',
        'app.json',
        'src/app/_layout.tsx',
      ],
      optionalFiles: [
        'src/app/(tabs)/chat.tsx',
        'src/components/ChatMessage.tsx',
      ],
      forbiddenFiles: ['node_modules'],
      minFileCount: 15,
      maxFileCount: 100,
    },
    validation: {
      tier1ShouldPass: true,
      tier2ShouldPass: true,
      tier3ShouldPass: true,
      allowedWarnings: 8,
      maxErrors: 0,
    },
  },

  'news-local': {
    requestId: 'news-local',
    fileStructure: {
      requiredFiles: [
        'package.json',
        'app.json',
        'src/app/_layout.tsx',
      ],
      optionalFiles: [
        'src/components/ArticleCard.tsx',
        'src/components/CategoryFilter.tsx',
      ],
      forbiddenFiles: ['node_modules'],
      minFileCount: 15,
      maxFileCount: 100,
    },
    validation: {
      tier1ShouldPass: true,
      tier2ShouldPass: true,
      tier3ShouldPass: true,
      allowedWarnings: 5,
      maxErrors: 0,
    },
  },

  'invalid-missing-imports': {
    requestId: 'invalid-missing-imports',
    fileStructure: {
      requiredFiles: ['package.json'],
      optionalFiles: [],
      forbiddenFiles: [],
      minFileCount: 5,
      maxFileCount: 200,
    },
    validation: {
      tier1ShouldPass: false,
      tier2ShouldPass: false,
      tier3ShouldPass: false,
      allowedWarnings: 20,
      maxErrors: 10,
    },
  },

  'type-errors': {
    requestId: 'type-errors',
    fileStructure: {
      requiredFiles: ['package.json'],
      optionalFiles: [],
      forbiddenFiles: [],
      minFileCount: 10,
      maxFileCount: 200,
    },
    validation: {
      tier1ShouldPass: false,
      tier2ShouldPass: false,
      tier3ShouldPass: false,
      allowedWarnings: 20,
      maxErrors: 15,
    },
  },
};

/**
 * Get expected output for a request
 */
export function getExpectedOutput(requestId: string): ExpectedOutput | undefined {
  return expectedOutputs[requestId];
}
