import { remote, Browser } from 'webdriverio';
import { prisma } from '@mobigen/db';

export interface TestConfig {
  screens?: string[];
  flows?: TestFlow[];
  assertions?: TestAssertion[];
  baselineId?: string;
}

export interface TestFlow {
  name: string;
  steps: TestStep[];
}

export interface TestStep {
  action: 'tap' | 'type' | 'scroll' | 'wait' | 'assert';
  selector?: string;
  value?: string;
  timeout?: number;
}

export interface TestAssertion {
  type: 'visible' | 'text' | 'count' | 'enabled';
  selector: string;
  expected?: string | number;
}

export interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  steps?: StepResult[];
}

export interface StepResult {
  action: string;
  status: 'passed' | 'failed';
  duration: number;
  error?: string;
}

export interface RunTestsOptions {
  buildId: string;
  platform: 'ios' | 'android';
  testConfig: TestConfig;
  onProgress?: (progress: { current: number; total: number; test: string }) => void;
}

export class TestService {
  private appiumUrl: string;

  constructor() {
    this.appiumUrl = process.env.APPIUM_URL || 'http://localhost:4723';
  }

  async runTests(options: RunTestsOptions): Promise<TestResult[]> {
    const { buildId, platform, testConfig, onProgress } = options;
    const results: TestResult[] = [];

    // Get build info
    const build = await prisma.build.findUnique({
      where: { id: buildId },
      include: { project: true },
    });

    if (!build) {
      throw new Error(`Build not found: ${buildId}`);
    }

    // Initialize WebDriver
    const browser = await this.initBrowser(platform, build.artifactS3Key || '');

    try {
      const flows = testConfig.flows || this.getDefaultFlows();
      const total = flows.length;

      for (let i = 0; i < flows.length; i++) {
        const flow = flows[i];
        onProgress?.({ current: i + 1, total, test: flow.name });

        const result = await this.runFlow(browser, flow);
        results.push(result);

        // Save result to database
        await this.saveTestResult(buildId, result);
      }

      // Run assertions
      if (testConfig.assertions) {
        const assertionResults = await this.runAssertions(browser, testConfig.assertions);
        results.push(...assertionResults);
      }
    } finally {
      await browser.deleteSession();
    }

    return results;
  }

  private async initBrowser(platform: 'ios' | 'android', appPath: string): Promise<Browser> {
    const capabilities = platform === 'ios'
      ? {
          platformName: 'iOS',
          'appium:automationName': 'XCUITest',
          'appium:deviceName': process.env.IOS_DEVICE || 'iPhone 15',
          'appium:platformVersion': process.env.IOS_VERSION || '17.0',
          'appium:app': appPath,
          'appium:noReset': false,
        }
      : {
          platformName: 'Android',
          'appium:automationName': 'UiAutomator2',
          'appium:deviceName': process.env.ANDROID_DEVICE || 'Pixel 7',
          'appium:platformVersion': process.env.ANDROID_VERSION || '14',
          'appium:app': appPath,
          'appium:noReset': false,
        };

    return remote({
      hostname: new URL(this.appiumUrl).hostname,
      port: parseInt(new URL(this.appiumUrl).port) || 4723,
      path: '/wd/hub',
      capabilities,
    });
  }

  private async runFlow(browser: Browser, flow: TestFlow): Promise<TestResult> {
    const startTime = Date.now();
    const stepResults: StepResult[] = [];

    try {
      for (const step of flow.steps) {
        const stepStart = Date.now();

        try {
          await this.executeStep(browser, step);
          stepResults.push({
            action: step.action,
            status: 'passed',
            duration: Date.now() - stepStart,
          });
        } catch (error) {
          stepResults.push({
            action: step.action,
            status: 'failed',
            duration: Date.now() - stepStart,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          throw error;
        }
      }

      return {
        name: flow.name,
        status: 'passed',
        duration: Date.now() - startTime,
        steps: stepResults,
      };
    } catch (error) {
      return {
        name: flow.name,
        status: 'failed',
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        steps: stepResults,
      };
    }
  }

  private async executeStep(browser: Browser, step: TestStep): Promise<void> {
    const timeout = step.timeout || 10000;

    switch (step.action) {
      case 'tap':
        if (!step.selector) throw new Error('Selector required for tap action');
        const tapElement = await browser.$(step.selector);
        await tapElement.waitForDisplayed({ timeout });
        await tapElement.click();
        break;

      case 'type':
        if (!step.selector) throw new Error('Selector required for type action');
        if (!step.value) throw new Error('Value required for type action');
        const typeElement = await browser.$(step.selector);
        await typeElement.waitForDisplayed({ timeout });
        await typeElement.setValue(step.value);
        break;

      case 'scroll':
        await browser.execute('mobile: scroll', {
          direction: step.value || 'down',
        });
        break;

      case 'wait':
        await new Promise((resolve) => setTimeout(resolve, step.timeout || 1000));
        break;

      case 'assert':
        if (!step.selector) throw new Error('Selector required for assert action');
        const assertElement = await browser.$(step.selector);
        const isDisplayed = await assertElement.isDisplayed();
        if (!isDisplayed) {
          throw new Error(`Element not visible: ${step.selector}`);
        }
        break;
    }
  }

  private async runAssertions(
    browser: Browser,
    assertions: TestAssertion[]
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];

    for (const assertion of assertions) {
      const startTime = Date.now();

      try {
        const element = await browser.$(assertion.selector);

        switch (assertion.type) {
          case 'visible':
            const isVisible = await element.isDisplayed();
            if (!isVisible) {
              throw new Error(`Element not visible: ${assertion.selector}`);
            }
            break;

          case 'text':
            const text = await element.getText();
            if (text !== assertion.expected) {
              throw new Error(`Expected text "${assertion.expected}" but got "${text}"`);
            }
            break;

          case 'enabled':
            const isEnabled = await element.isEnabled();
            if (!isEnabled) {
              throw new Error(`Element not enabled: ${assertion.selector}`);
            }
            break;

          case 'count':
            const elements = await browser.$$(assertion.selector);
            if (elements.length !== assertion.expected) {
              throw new Error(
                `Expected ${assertion.expected} elements but found ${elements.length}`
              );
            }
            break;
        }

        results.push({
          name: `Assert: ${assertion.type} - ${assertion.selector}`,
          status: 'passed',
          duration: Date.now() - startTime,
        });
      } catch (error) {
        results.push({
          name: `Assert: ${assertion.type} - ${assertion.selector}`,
          status: 'failed',
          duration: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  private getDefaultFlows(): TestFlow[] {
    return [
      {
        name: 'App Launch',
        steps: [
          { action: 'wait', timeout: 3000 },
          { action: 'assert', selector: '~app-root' },
        ],
      },
      {
        name: 'Navigation Check',
        steps: [
          { action: 'wait', timeout: 1000 },
          { action: 'tap', selector: '~tab-home' },
          { action: 'wait', timeout: 500 },
          { action: 'tap', selector: '~tab-profile' },
          { action: 'wait', timeout: 500 },
        ],
      },
    ];
  }

  private async saveTestResult(buildId: string, result: TestResult): Promise<void> {
    // Store in database (would need TestResult model in Prisma)
    // For now, we'll log it
    console.log(`Test result for build ${buildId}:`, result);
  }

  async getTestResults(buildId: string): Promise<TestResult[]> {
    // Would fetch from database
    // For now, return empty array
    return [];
  }
}
