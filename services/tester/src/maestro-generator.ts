/**
 * Maestro E2E Test Generator
 *
 * Generates Maestro YAML test files based on app structure analysis.
 * Used by the e2e-test-generator agent to create comprehensive test suites.
 */

export type { E2ETestSuite, E2ETest, E2ETestStep, TestCoverage, MissingTestId } from '@mobigen/ai';
import * as fs from 'fs/promises';
import * as path from 'path';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface AppStructure {
  screens: ScreenInfo[];
  navigation: NavigationInfo;
  forms: FormInfo[];
  components: ComponentInfo[];
  template: string;
}

export interface ScreenInfo {
  name: string;
  path: string;
  route: string;
  hasForm: boolean;
  interactiveElements: InteractiveElement[];
}

export interface NavigationInfo {
  type: 'tabs' | 'stack' | 'drawer' | 'mixed';
  routes: RouteInfo[];
  deepLinks: string[];
}

export interface RouteInfo {
  name: string;
  screen: string;
  icon?: string;
  isTab?: boolean;
}

export interface FormInfo {
  screen: string;
  inputs: InputInfo[];
  submitButton?: string;
  validationRules?: string[];
}

export interface InputInfo {
  testId: string;
  type: 'text' | 'email' | 'password' | 'number' | 'phone';
  required: boolean;
  placeholder?: string;
}

export interface ComponentInfo {
  name: string;
  path: string;
  hasTestId: boolean;
  testId?: string;
  type: 'button' | 'input' | 'card' | 'list' | 'other';
}

export interface InteractiveElement {
  type: 'button' | 'input' | 'link' | 'card' | 'switch' | 'slider';
  testId?: string;
  accessibilityLabel?: string;
  file: string;
  line: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATE-SPECIFIC CRITICAL PATHS
// ═══════════════════════════════════════════════════════════════════════════

const CRITICAL_PATHS: Record<string, CriticalPath[]> = {
  ecommerce: [
    {
      name: 'Browse and Purchase Flow',
      description: 'User browses products, adds to cart, and completes checkout',
      steps: [
        { action: 'launchApp', clearState: true },
        { action: 'assertVisible', text: 'Products' },
        { action: 'tapOn', id: 'tab-products' },
        { action: 'tapOn', id: 'product-card-0' },
        { action: 'assertVisible', text: 'Add to Cart' },
        { action: 'tapOn', id: 'button-add-to-cart' },
        { action: 'assertVisible', text: 'Added' },
        { action: 'tapOn', id: 'tab-cart' },
        { action: 'assertVisible', text: 'Cart' },
        { action: 'tapOn', text: 'Checkout' },
        { action: 'assertVisible', text: 'Shipping' },
      ],
    },
    {
      name: 'Search and Filter',
      description: 'User searches for products and applies filters',
      steps: [
        { action: 'launchApp', clearState: true },
        { action: 'tapOn', id: 'search-input' },
        { action: 'inputText', id: 'search-input', text: 'shirt' },
        { action: 'assertVisible', text: 'results' },
        { action: 'tapOn', id: 'filter-button' },
        { action: 'tapOn', text: 'Price: Low to High' },
        { action: 'assertVisible', id: 'product-list' },
      ],
    },
  ],
  loyalty: [
    {
      name: 'View Points and Rewards',
      description: 'User checks points balance and browses available rewards',
      steps: [
        { action: 'launchApp', clearState: true },
        { action: 'assertVisible', text: 'Points' },
        { action: 'tapOn', id: 'tab-rewards' },
        { action: 'assertVisible', text: 'Available Rewards' },
        { action: 'tapOn', id: 'reward-card-0' },
        { action: 'assertVisible', text: 'Redeem' },
      ],
    },
    {
      name: 'Scan and Earn',
      description: 'User scans QR code to earn points',
      steps: [
        { action: 'launchApp', clearState: true },
        { action: 'tapOn', id: 'tab-scan' },
        { action: 'assertVisible', text: 'Scan QR Code' },
        // Note: Actual camera interaction requires device testing
      ],
    },
  ],
  news: [
    {
      name: 'Browse and Read Articles',
      description: 'User browses feed and reads an article',
      steps: [
        { action: 'launchApp', clearState: true },
        { action: 'assertVisible', id: 'article-feed' },
        { action: 'tapOn', id: 'article-card-0' },
        { action: 'assertVisible', id: 'article-content' },
        { action: 'scroll', direction: 'down' },
        { action: 'assertVisible', text: 'Related' },
      ],
    },
    {
      name: 'Save and Bookmark',
      description: 'User saves an article for later',
      steps: [
        { action: 'launchApp', clearState: true },
        { action: 'tapOn', id: 'article-card-0' },
        { action: 'tapOn', id: 'button-save' },
        { action: 'assertVisible', text: 'Saved' },
        { action: 'tapOn', id: 'tab-saved' },
        { action: 'assertVisible', id: 'saved-article-0' },
      ],
    },
  ],
  'ai-assistant': [
    {
      name: 'Chat Interaction',
      description: 'User sends a message and receives a response',
      steps: [
        { action: 'launchApp', clearState: true },
        { action: 'assertVisible', id: 'chat-input' },
        { action: 'inputText', id: 'chat-input', text: 'Hello, how can you help me?' },
        { action: 'tapOn', id: 'button-send' },
        { action: 'assertVisible', id: 'message-user-0' },
        { action: 'waitForElement', id: 'message-assistant-0', timeout: 10000 },
        { action: 'assertVisible', id: 'message-assistant-0' },
      ],
    },
    {
      name: 'View Chat History',
      description: 'User views previous conversations',
      steps: [
        { action: 'launchApp', clearState: true },
        { action: 'tapOn', id: 'tab-history' },
        { action: 'assertVisible', text: 'Conversations' },
        { action: 'tapOn', id: 'conversation-0' },
        { action: 'assertVisible', id: 'chat-messages' },
      ],
    },
  ],
};

interface CriticalPath {
  name: string;
  description: string;
  steps: MaestroStep[];
}

interface MaestroStep {
  action: string;
  id?: string;
  text?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  clearState?: boolean;
  timeout?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAESTRO GENERATOR CLASS
// ═══════════════════════════════════════════════════════════════════════════

export class MaestroGenerator {
  private projectPath: string;
  private bundleId: string;

  constructor(projectPath: string, bundleId: string) {
    this.projectPath = projectPath;
    this.bundleId = bundleId;
  }

  /**
   * Generate complete Maestro test suite
   */
  async generateTestSuite(appStructure: AppStructure): Promise<E2ETestSuite> {
    const tests: E2ETest[] = [];
    const missingTestIds: MissingTestId[] = [];

    // 1. Generate navigation tests
    const navTests = this.generateNavigationTests(appStructure.navigation);
    tests.push(...navTests);

    // 2. Generate critical path tests based on template
    const criticalPathTests = this.generateCriticalPathTests(appStructure.template);
    tests.push(...criticalPathTests);

    // 3. Generate form validation tests
    const formTests = this.generateFormTests(appStructure.forms);
    tests.push(...formTests);

    // 4. Generate smoke tests
    const smokeTests = this.generateSmokeTests(appStructure.screens);
    tests.push(...smokeTests);

    // 5. Find missing testIDs
    for (const screen of appStructure.screens) {
      for (const element of screen.interactiveElements) {
        if (!element.testId) {
          missingTestIds.push({
            component: element.type,
            file: element.file,
            line: element.line,
            suggestedId: this.suggestTestId(element, screen.name),
          });
        }
      }
    }

    // 6. Calculate coverage
    const coverage = this.calculateCoverage(appStructure, tests);

    // 7. Write test files
    await this.writeTestFiles(tests);

    return {
      framework: 'maestro',
      tests,
      coverage,
      missingTestIds,
    };
  }

  /**
   * Generate navigation tests
   */
  private generateNavigationTests(navigation: NavigationInfo): E2ETest[] {
    const tests: E2ETest[] = [];

    // Tab navigation test
    if (navigation.type === 'tabs' || navigation.type === 'mixed') {
      const tabRoutes = navigation.routes.filter(r => r.isTab);

      if (tabRoutes.length > 0) {
        const steps: E2ETestStep[] = [
          { action: 'launchApp' },
        ];

        for (const route of tabRoutes) {
          steps.push(
            { action: 'tapOn', target: `tab-${route.name.toLowerCase()}` },
            { action: 'assertVisible', assertion: route.screen }
          );
        }

        tests.push({
          name: 'Navigation: Tab Bar',
          description: 'Verify all tab bar items are accessible and navigate correctly',
          priority: 'high',
          type: 'navigation',
          file: '.maestro/navigation.yaml',
          content: this.generateYamlContent('Tab Bar Navigation', steps),
          steps,
        });
      }
    }

    // Stack navigation test
    const stackRoutes = navigation.routes.filter(r => !r.isTab);
    if (stackRoutes.length > 0) {
      const steps: E2ETestStep[] = [
        { action: 'launchApp' },
      ];

      // Navigate to first screen then back
      if (stackRoutes[0]) {
        steps.push(
          { action: 'tapOn', target: 'navigate-' + stackRoutes[0].name.toLowerCase() },
          { action: 'assertVisible', assertion: stackRoutes[0].screen },
          { action: 'tapOn', target: 'button-back' },
          { action: 'assertVisible', assertion: 'home' }
        );
      }

      tests.push({
        name: 'Navigation: Stack',
        description: 'Verify stack navigation push/pop works correctly',
        priority: 'high',
        type: 'navigation',
        file: '.maestro/navigation.yaml',
        content: this.generateYamlContent('Stack Navigation', steps),
        steps,
      });
    }

    // Deep link tests
    if (navigation.deepLinks.length > 0) {
      for (const deepLink of navigation.deepLinks.slice(0, 3)) {
        const steps: E2ETestStep[] = [
          { action: 'openLink', target: deepLink },
          { action: 'assertVisible', assertion: 'expected-screen' },
        ];

        tests.push({
          name: `Navigation: Deep Link - ${deepLink}`,
          description: `Verify deep link ${deepLink} opens correctly`,
          priority: 'medium',
          type: 'navigation',
          file: '.maestro/deep-links.yaml',
          content: this.generateYamlContent(`Deep Link: ${deepLink}`, steps),
          steps,
        });
      }
    }

    return tests;
  }

  /**
   * Generate critical path tests based on template
   */
  private generateCriticalPathTests(template: string): E2ETest[] {
    const tests: E2ETest[] = [];
    const paths = CRITICAL_PATHS[template] || CRITICAL_PATHS['ecommerce'];

    for (const path of paths) {
      const steps: E2ETestStep[] = path.steps.map(s => ({
        action: s.action,
        target: s.id || s.text,
        value: s.text,
        assertion: s.action === 'assertVisible' ? (s.id || s.text) : undefined,
      }));

      tests.push({
        name: `Critical: ${path.name}`,
        description: path.description,
        priority: 'critical',
        type: 'integration',
        file: '.maestro/critical-path.yaml',
        content: this.generateYamlFromPath(path),
        steps,
      });
    }

    return tests;
  }

  /**
   * Generate form validation tests
   */
  private generateFormTests(forms: FormInfo[]): E2ETest[] {
    const tests: E2ETest[] = [];

    for (const form of forms) {
      // Empty submission test
      const emptySteps: E2ETestStep[] = [
        { action: 'launchApp' },
        { action: 'navigateTo', target: form.screen },
        { action: 'tapOn', target: form.submitButton || 'button-submit' },
        { action: 'assertVisible', assertion: 'error' },
      ];

      tests.push({
        name: `Form: ${form.screen} - Empty Submission`,
        description: 'Verify form shows error on empty submission',
        priority: 'high',
        type: 'form',
        file: '.maestro/forms.yaml',
        content: this.generateYamlContent(`${form.screen} Empty Submission`, emptySteps),
        steps: emptySteps,
      });

      // Valid submission test
      const validSteps: E2ETestStep[] = [
        { action: 'launchApp' },
        { action: 'navigateTo', target: form.screen },
      ];

      for (const input of form.inputs) {
        validSteps.push({
          action: 'inputText',
          target: input.testId,
          value: this.getTestValue(input.type),
        });
      }

      validSteps.push(
        { action: 'tapOn', target: form.submitButton || 'button-submit' },
        { action: 'assertVisible', assertion: 'success' }
      );

      tests.push({
        name: `Form: ${form.screen} - Valid Submission`,
        description: 'Verify form submits successfully with valid data',
        priority: 'high',
        type: 'form',
        file: '.maestro/forms.yaml',
        content: this.generateYamlContent(`${form.screen} Valid Submission`, validSteps),
        steps: validSteps,
      });
    }

    return tests;
  }

  /**
   * Generate smoke tests for each screen
   */
  private generateSmokeTests(screens: ScreenInfo[]): E2ETest[] {
    const tests: E2ETest[] = [];

    const steps: E2ETestStep[] = [
      { action: 'launchApp' },
    ];

    for (const screen of screens.slice(0, 5)) {
      steps.push(
        { action: 'navigateTo', target: screen.route },
        { action: 'assertVisible', assertion: screen.name },
        { action: 'takeScreenshot', target: `screen-${screen.name.toLowerCase()}` }
      );
    }

    tests.push({
      name: 'Smoke: All Screens Render',
      description: 'Quick check that all main screens render without crashing',
      priority: 'critical',
      type: 'navigation',
      file: '.maestro/smoke.yaml',
      content: this.generateYamlContent('Smoke Test', steps),
      steps,
    });

    return tests;
  }

  /**
   * Generate YAML content for a test
   */
  private generateYamlContent(name: string, steps: E2ETestStep[]): string {
    let yaml = `appId: ${this.bundleId}
tags:
  - smoke
  - automated
---
# ${name}
`;

    for (const step of steps) {
      yaml += this.stepToYaml(step);
    }

    return yaml;
  }

  /**
   * Generate YAML from critical path
   */
  private generateYamlFromPath(path: CriticalPath): string {
    let yaml = `appId: ${this.bundleId}
tags:
  - critical
  - regression
---
# ${path.name}
# ${path.description}

`;

    for (const step of path.steps) {
      if (step.action === 'launchApp') {
        yaml += `- launchApp:\n    clearState: ${step.clearState ?? true}\n\n`;
      } else if (step.action === 'assertVisible') {
        if (step.id) {
          yaml += `- assertVisible:\n    id: "${step.id}"\n\n`;
        } else if (step.text) {
          yaml += `- assertVisible: "${step.text}"\n\n`;
        }
      } else if (step.action === 'tapOn') {
        if (step.id) {
          yaml += `- tapOn:\n    id: "${step.id}"\n\n`;
        } else if (step.text) {
          yaml += `- tapOn: "${step.text}"\n\n`;
        }
      } else if (step.action === 'inputText') {
        yaml += `- inputText:\n    id: "${step.id}"\n    text: "${step.text}"\n\n`;
      } else if (step.action === 'scroll') {
        yaml += `- scroll:\n    direction: ${step.direction || 'down'}\n\n`;
      } else if (step.action === 'waitForElement') {
        yaml += `- extendedWaitUntil:\n    visible:\n      id: "${step.id}"\n    timeout: ${step.timeout || 5000}\n\n`;
      }
    }

    return yaml;
  }

  /**
   * Convert step to YAML
   */
  private stepToYaml(step: E2ETestStep): string {
    switch (step.action) {
      case 'launchApp':
        return '- launchApp:\n    clearState: true\n\n';
      case 'assertVisible':
        if (step.assertion) {
          return `- assertVisible:\n    id: "${step.assertion}"\n\n`;
        }
        return '';
      case 'tapOn':
        if (step.target) {
          return `- tapOn:\n    id: "${step.target}"\n\n`;
        }
        return '';
      case 'inputText':
        return `- inputText:\n    id: "${step.target}"\n    text: "${step.value}"\n\n`;
      case 'navigateTo':
        return `- tapOn:\n    id: "navigate-${step.target}"\n\n`;
      case 'takeScreenshot':
        return `- takeScreenshot: "${step.target}"\n\n`;
      default:
        return '';
    }
  }

  /**
   * Get test value for input type
   */
  private getTestValue(type: string): string {
    switch (type) {
      case 'email':
        return 'test@example.com';
      case 'password':
        return 'TestPassword123!';
      case 'phone':
        return '+1234567890';
      case 'number':
        return '42';
      default:
        return 'Test Value';
    }
  }

  /**
   * Suggest testID for element
   */
  private suggestTestId(element: InteractiveElement, screenName: string): string {
    const prefix = element.type === 'button' ? 'button' :
                   element.type === 'input' ? 'input' :
                   element.type === 'card' ? 'card' :
                   element.type === 'link' ? 'link' : 'element';

    const screenPrefix = screenName.toLowerCase().replace(/\s+/g, '-');

    return `${prefix}-${screenPrefix}-${Date.now() % 1000}`;
  }

  /**
   * Calculate test coverage
   */
  private calculateCoverage(appStructure: AppStructure, tests: E2ETest[]): TestCoverage {
    const totalScreens = appStructure.screens.length;
    const testedScreens = new Set<string>();

    for (const test of tests) {
      for (const step of test.steps) {
        if (step.target) {
          // Extract screen name from target
          const screenMatch = step.target.match(/(?:tab-|screen-|navigate-)(\w+)/);
          if (screenMatch) {
            testedScreens.add(screenMatch[1]);
          }
        }
      }
    }

    const criticalPaths = CRITICAL_PATHS[appStructure.template]?.length || 0;
    const criticalTests = tests.filter(t => t.priority === 'critical').length;

    const totalInteractions = appStructure.screens.reduce(
      (sum, s) => sum + s.interactiveElements.length,
      0
    );
    const coveredInteractions = tests.reduce(
      (sum, t) => sum + t.steps.filter(s => s.action === 'tapOn' || s.action === 'inputText').length,
      0
    );

    return {
      screens: {
        covered: testedScreens.size,
        total: totalScreens,
      },
      criticalPaths: {
        covered: Math.min(criticalTests, criticalPaths),
        total: criticalPaths,
      },
      interactions: {
        covered: Math.min(coveredInteractions, totalInteractions),
        total: totalInteractions,
      },
    };
  }

  /**
   * Write test files to project
   */
  private async writeTestFiles(tests: E2ETest[]): Promise<void> {
    const maestroDir = path.join(this.projectPath, '.maestro');

    // Ensure .maestro directory exists
    await fs.mkdir(maestroDir, { recursive: true });

    // Group tests by file
    const fileGroups = new Map<string, E2ETest[]>();
    for (const test of tests) {
      const existing = fileGroups.get(test.file) || [];
      existing.push(test);
      fileGroups.set(test.file, existing);
    }

    // Write each file
    for (const [filePath, fileTests] of fileGroups) {
      const fullPath = path.join(this.projectPath, filePath);
      const dir = path.dirname(fullPath);

      await fs.mkdir(dir, { recursive: true });

      // Combine tests into single file
      let content = `appId: ${this.bundleId}
tags:
  - automated
---
`;

      for (const test of fileTests) {
        content += `\n# ${test.name}\n# ${test.description}\n`;
        for (const step of test.steps) {
          content += this.stepToYaml(step);
        }
        content += '\n---\n';
      }

      await fs.writeFile(fullPath, content, 'utf-8');
    }

    // Write config file
    const configContent = `# Maestro Configuration
# Generated by Mobigen

appId: ${this.bundleId}

# Default flows to run
flows:
  - .maestro/smoke.yaml
  - .maestro/navigation.yaml
  - .maestro/critical-path.yaml

# Cloud execution settings
cloud:
  timeout: 600
  retries: 2
`;

    await fs.writeFile(
      path.join(maestroDir, 'config.yaml'),
      configContent,
      'utf-8'
    );
  }
}

// Export factory function
export function createMaestroGenerator(projectPath: string, bundleId: string): MaestroGenerator {
  return new MaestroGenerator(projectPath, bundleId);
}
