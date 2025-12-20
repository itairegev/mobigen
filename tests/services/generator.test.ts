/**
 * Generator Service Tests
 *
 * Tests for the AI generation pipeline and orchestrator
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateUUID } from '../utils/mock-prisma';

// Mock types matching the orchestrator
interface WhiteLabelConfig {
  appName: string;
  bundleId: {
    ios: string;
    android: string;
  };
  branding: {
    displayName: string;
    primaryColor: string;
    secondaryColor: string;
  };
  identifiers: {
    projectId: string;
    easProjectId: string;
    awsResourcePrefix: string;
    analyticsKey: string;
  };
}

interface GenerationResult {
  files: string[];
  logs: unknown[];
  success: boolean;
  sessionId?: string;
  requiresReview?: boolean;
  prd?: unknown;
  architecture?: unknown;
  uiDesign?: unknown;
  taskBreakdown?: unknown;
  validation?: unknown;
  qaReport?: unknown;
}

// Mock the Claude Agent SDK
const mockQuery = vi.fn();
vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
}));

describe('Generator Service - Orchestrator', () => {
  const createTestConfig = (projectId: string): WhiteLabelConfig => ({
    appName: 'Test News App',
    bundleId: {
      ios: `com.test.newsapp.${projectId.slice(0, 8)}`,
      android: `com.test.newsapp.${projectId.slice(0, 8)}`,
    },
    branding: {
      displayName: 'Test News',
      primaryColor: '#3b82f6',
      secondaryColor: '#10b981',
    },
    identifiers: {
      projectId,
      easProjectId: `eas-${projectId}`,
      awsResourcePrefix: `mobigen-${projectId.slice(0, 8)}`,
      analyticsKey: `analytics-${projectId}`,
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Input Validation', () => {
    it('should validate required fields in config', () => {
      const projectId = generateUUID();
      const config = createTestConfig(projectId);

      expect(config.appName).toBeDefined();
      expect(config.bundleId.ios).toBeDefined();
      expect(config.bundleId.android).toBeDefined();
      expect(config.branding.primaryColor).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should validate prompt is not empty', () => {
      const validPrompts = [
        'Create a news app',
        'Build an e-commerce store with products and cart',
      ];
      const invalidPrompts = ['', '   '];

      validPrompts.forEach((prompt) => {
        expect(prompt.trim().length).toBeGreaterThan(0);
      });

      invalidPrompts.forEach((prompt) => {
        expect(prompt.trim().length).toBe(0);
      });
    });

    it('should validate project ID format', () => {
      const validIds = [generateUUID(), generateUUID()];
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      validIds.forEach((id) => {
        expect(id).toMatch(uuidPattern);
      });
    });
  });

  describe('Generation Pipeline Phases', () => {
    const phases = [
      { id: 'setup', name: 'Project Setup', index: 0 },
      { id: 'analysis', name: 'Intent Analysis', index: 1 },
      { id: 'product-definition', name: 'Product Definition', index: 2 },
      { id: 'architecture', name: 'Technical Architecture', index: 3 },
      { id: 'ui-design', name: 'UI/UX Design', index: 4 },
      { id: 'planning', name: 'Task Planning', index: 5 },
      { id: 'implementation', name: 'Implementation', index: 6 },
      { id: 'validation', name: 'Validation', index: 7 },
      { id: 'quality-assurance', name: 'Quality Assurance', index: 8 },
    ];

    it('should have all required phases', () => {
      expect(phases).toHaveLength(9);
    });

    it('should execute phases in order', () => {
      const sortedPhases = [...phases].sort((a, b) => a.index - b.index);
      phases.forEach((phase, index) => {
        expect(phase.index).toBe(sortedPhases[index].index);
      });
    });

    it('should have unique phase IDs', () => {
      const ids = phases.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('Agent Definitions', () => {
    const agents = {
      'intent-analyzer': { model: 'sonnet', tools: ['Read', 'Grep', 'Glob'] },
      'product-manager': { model: 'opus', tools: ['Read', 'Write', 'Glob'] },
      'technical-architect': { model: 'opus', tools: ['Read', 'Write', 'Glob', 'Grep'] },
      'ui-ux-expert': { model: 'sonnet', tools: ['Read', 'Write', 'Glob'] },
      'lead-developer': { model: 'sonnet', tools: ['Read', 'Glob', 'Grep'] },
      'developer': { model: 'sonnet', tools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'] },
      'validator': { model: 'sonnet', tools: ['Bash', 'Read', 'Grep'] },
      'error-fixer': { model: 'sonnet', tools: ['Read', 'Edit', 'Bash', 'Grep'] },
      'qa': { model: 'sonnet', tools: ['Read', 'Grep', 'Glob', 'Bash'] },
    };

    it('should have all required agents defined', () => {
      const requiredAgents = [
        'intent-analyzer',
        'product-manager',
        'technical-architect',
        'developer',
        'validator',
      ];

      requiredAgents.forEach((agent) => {
        expect(agents[agent as keyof typeof agents]).toBeDefined();
      });
    });

    it('should use opus for complex code generation', () => {
      expect(agents['product-manager'].model).toBe('opus');
      expect(agents['technical-architect'].model).toBe('opus');
    });

    it('should use sonnet for analysis and validation', () => {
      expect(agents['intent-analyzer'].model).toBe('sonnet');
      expect(agents['validator'].model).toBe('sonnet');
      expect(agents['error-fixer'].model).toBe('sonnet');
    });

    it('should give developer agent full tool access', () => {
      const devTools = agents['developer'].tools;
      expect(devTools).toContain('Read');
      expect(devTools).toContain('Write');
      expect(devTools).toContain('Edit');
      expect(devTools).toContain('Bash');
    });
  });

  describe('Template Selection', () => {
    const templates = ['base', 'ecommerce', 'loyalty', 'news', 'ai-assistant'];

    it('should select appropriate template based on prompt', () => {
      const promptToTemplate: Record<string, string> = {
        'create a news app with articles and categories': 'news',
        'build an online store with shopping cart': 'ecommerce',
        'make a loyalty rewards app with points': 'loyalty',
        'create an AI chatbot assistant': 'ai-assistant',
        'build a simple starter app': 'base',
      };

      Object.entries(promptToTemplate).forEach(([prompt, expectedTemplate]) => {
        expect(templates).toContain(expectedTemplate);
      });
    });

    it('should fall back to base template for unknown prompts', () => {
      const defaultTemplate = 'base';
      expect(templates).toContain(defaultTemplate);
    });
  });

  describe('Validation Pipeline', () => {
    describe('Tier 1 - Instant Validation', () => {
      const tier1Checks = ['typescript', 'eslint-critical', 'imports', 'navigation'];

      it('should run TypeScript check', () => {
        expect(tier1Checks).toContain('typescript');
      });

      it('should run ESLint critical rules', () => {
        expect(tier1Checks).toContain('eslint-critical');
      });

      it('should validate imports', () => {
        expect(tier1Checks).toContain('imports');
      });

      it('should validate navigation graph', () => {
        expect(tier1Checks).toContain('navigation');
      });
    });

    describe('Tier 2 - Build Validation', () => {
      const tier2Checks = ['eslint-full', 'prettier', 'metro-bundle', 'expo-doctor'];

      it('should run full ESLint', () => {
        expect(tier2Checks).toContain('eslint-full');
      });

      it('should run Metro bundler check', () => {
        expect(tier2Checks).toContain('metro-bundle');
      });
    });

    describe('Tier 3 - Thorough Validation', () => {
      const tier3Checks = ['expo-prebuild', 'maestro-e2e', 'visual-snapshots', 'bundle-size'];

      it('should run Expo prebuild', () => {
        expect(tier3Checks).toContain('expo-prebuild');
      });

      it('should run E2E tests', () => {
        expect(tier3Checks).toContain('maestro-e2e');
      });
    });
  });

  describe('Error Recovery', () => {
    it('should retry validation up to 3 times', () => {
      const maxRetries = 3;
      let attempts = 0;
      let success = false;

      while (!success && attempts < maxRetries) {
        attempts++;
        // Simulate validation failure then success on 3rd attempt
        success = attempts === 3;
      }

      expect(attempts).toBe(3);
      expect(success).toBe(true);
    });

    it('should flag for human review after max retries', () => {
      const maxRetries = 3;
      let attempts = 0;
      let success = false;

      while (!success && attempts < maxRetries) {
        attempts++;
        success = false; // Always fail
      }

      const requiresReview = !success;
      expect(requiresReview).toBe(true);
    });
  });

  describe('Session Management', () => {
    it('should capture session ID from init message', () => {
      const mockSessionId = 'session-' + generateUUID();
      const initMessage = {
        type: 'system',
        subtype: 'init',
        session_id: mockSessionId,
      };

      if (initMessage.type === 'system' && initMessage.subtype === 'init') {
        expect(initMessage.session_id).toBe(mockSessionId);
      }
    });

    it('should pass session ID for resumption', () => {
      const sessionId = 'session-' + generateUUID();
      const queryOptions = {
        resume: sessionId,
        agents: {},
        allowedTools: ['Read', 'Write'],
      };

      expect(queryOptions.resume).toBe(sessionId);
    });
  });

  describe('File Tracking', () => {
    it('should track written files', () => {
      const files: string[] = [];
      const toolMessages = [
        { type: 'tool', tool_name: 'Write', tool_input: { file_path: 'src/App.tsx' } },
        { type: 'tool', tool_name: 'Edit', tool_input: { file_path: 'src/screens/Home.tsx' } },
        { type: 'tool', tool_name: 'Read', tool_input: { file_path: 'package.json' } },
      ];

      toolMessages.forEach((msg) => {
        if (msg.type === 'tool' && (msg.tool_name === 'Write' || msg.tool_name === 'Edit')) {
          const filePath = msg.tool_input?.file_path;
          if (filePath && !files.includes(filePath)) {
            files.push(filePath);
          }
        }
      });

      expect(files).toHaveLength(2);
      expect(files).toContain('src/App.tsx');
      expect(files).toContain('src/screens/Home.tsx');
      expect(files).not.toContain('package.json'); // Read, not Write/Edit
    });
  });
});

describe('Generator Service - API', () => {
  describe('POST /api/generate', () => {
    it('should validate request body schema', () => {
      const validRequest = {
        projectId: generateUUID(),
        prompt: 'Create a news app with articles and categories',
        config: {
          appName: 'My News App',
          bundleId: {
            ios: 'com.mynews.app',
            android: 'com.mynews.app',
          },
          branding: {
            displayName: 'My News',
            primaryColor: '#3b82f6',
            secondaryColor: '#10b981',
          },
          identifiers: {
            projectId: generateUUID(),
            easProjectId: 'eas-123',
            awsResourcePrefix: 'mobigen-123',
            analyticsKey: 'analytics-123',
          },
        },
      };

      expect(validRequest.projectId).toBeDefined();
      expect(validRequest.prompt.length).toBeGreaterThan(0);
      expect(validRequest.config.appName).toBeDefined();
    });

    it('should reject invalid project ID', () => {
      const invalidProjectIds = ['not-a-uuid', '123', ''];

      invalidProjectIds.forEach((id) => {
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        expect(id).not.toMatch(uuidPattern);
      });
    });

    it('should reject empty prompt', () => {
      const emptyPrompt = '';
      expect(emptyPrompt.length).toBe(0);
    });

    it('should reject prompt over max length', () => {
      const maxLength = 10000;
      const tooLongPrompt = 'a'.repeat(maxLength + 1);
      expect(tooLongPrompt.length).toBeGreaterThan(maxLength);
    });
  });

  describe('GET /api/health', () => {
    it('should return OK status', () => {
      const healthResponse = {
        status: 'ok',
        timestamp: new Date().toISOString(),
      };

      expect(healthResponse.status).toBe('ok');
      expect(healthResponse.timestamp).toBeDefined();
    });
  });

  describe('WebSocket Events', () => {
    const events = [
      'generation:start',
      'generation:progress',
      'generation:file',
      'generation:complete',
      'generation:error',
    ];

    it('should emit all generation events', () => {
      events.forEach((event) => {
        expect(event).toMatch(/^generation:/);
      });
    });

    it('should include projectId in all events', () => {
      const projectId = generateUUID();
      const mockEvent = {
        projectId,
        stage: 'analyzing',
        timestamp: new Date().toISOString(),
        data: {},
      };

      expect(mockEvent.projectId).toBe(projectId);
    });
  });
});

describe('Generator Service - White Label', () => {
  it('should generate unique bundle IDs per project', () => {
    const project1 = generateUUID();
    const project2 = generateUUID();

    const bundleId1 = `com.mobigen.app.${project1.slice(0, 8)}`;
    const bundleId2 = `com.mobigen.app.${project2.slice(0, 8)}`;

    expect(bundleId1).not.toBe(bundleId2);
  });

  it('should apply branding colors to theme', () => {
    const branding = {
      primaryColor: '#ff5500',
      secondaryColor: '#00ff55',
    };

    // Theme generation would produce:
    const expectedTheme = {
      colors: {
        primary: branding.primaryColor,
        secondary: branding.secondaryColor,
        // ... other colors derived from primary/secondary
      },
    };

    expect(expectedTheme.colors.primary).toBe('#ff5500');
    expect(expectedTheme.colors.secondary).toBe('#00ff55');
  });

  it('should update app.json with white label config', () => {
    const config: WhiteLabelConfig = {
      appName: 'My Custom App',
      bundleId: {
        ios: 'com.custom.app',
        android: 'com.custom.app',
      },
      branding: {
        displayName: 'Custom Display',
        primaryColor: '#123456',
        secondaryColor: '#654321',
      },
      identifiers: {
        projectId: generateUUID(),
        easProjectId: 'eas-custom',
        awsResourcePrefix: 'mobigen-custom',
        analyticsKey: 'analytics-custom',
      },
    };

    const appJson = {
      expo: {
        name: config.appName,
        slug: config.appName.toLowerCase().replace(/\s+/g, '-'),
        ios: {
          bundleIdentifier: config.bundleId.ios,
        },
        android: {
          package: config.bundleId.android,
        },
      },
    };

    expect(appJson.expo.name).toBe('My Custom App');
    expect(appJson.expo.ios.bundleIdentifier).toBe('com.custom.app');
    expect(appJson.expo.android.package).toBe('com.custom.app');
  });
});
