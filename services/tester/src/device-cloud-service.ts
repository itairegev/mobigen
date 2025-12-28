/**
 * Device Cloud Testing Service
 *
 * Unified interface for running tests on real devices via multiple cloud providers:
 * - AWS Device Farm
 * - BrowserStack App Automate
 * - Firebase Test Lab
 * - Maestro Cloud
 * - Sauce Labs
 * - LambdaTest
 * - Local Simulators/Emulators
 */

import type {
  DeviceProvider,
  DeviceTestConfig,
  DeviceTestResult,
  DeviceTestSession,
  DeviceTestSummary,
  DeviceSpec,
  DeviceArtifact,
} from '@mobigen/ai';

// Re-export for other modules
export type {
  DeviceProvider,
  DeviceTestConfig,
  DeviceTestResult,
  DeviceTestSession,
  DeviceTestSummary,
  DeviceSpec,
  DeviceArtifact,
};

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDER CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════════

export interface ProviderCredentials {
  'aws-device-farm': {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    projectArn?: string;
  };
  'browserstack': {
    username: string;
    accessKey: string;
  };
  'firebase-test-lab': {
    projectId: string;
    serviceAccountKey: string;
  };
  'maestro-cloud': {
    apiKey: string;
  };
  'sauce-labs': {
    username: string;
    accessKey: string;
    region: 'us-west-1' | 'eu-central-1';
  };
  'lambdatest': {
    username: string;
    accessKey: string;
  };
  'local': Record<string, never>;
}

export interface DeviceCloudConfig {
  provider: DeviceProvider;
  credentials: ProviderCredentials[DeviceProvider];
  defaultDevices?: DeviceSpec[];
  timeout?: number;
  retries?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT DEVICE MATRICES
// ═══════════════════════════════════════════════════════════════════════════

export const DEFAULT_DEVICE_MATRIX: Record<'minimal' | 'standard' | 'comprehensive', DeviceSpec[]> = {
  // Minimal: 2 devices for quick smoke tests
  minimal: [
    { platform: 'ios', name: 'iPhone 15', osVersion: '17.0', formFactor: 'phone' },
    { platform: 'android', name: 'Pixel 7', osVersion: '14', formFactor: 'phone' },
  ],

  // Standard: 6 devices covering major form factors and OS versions
  standard: [
    { platform: 'ios', name: 'iPhone 15', osVersion: '17.0', formFactor: 'phone' },
    { platform: 'ios', name: 'iPhone SE (3rd generation)', osVersion: '17.0', formFactor: 'phone' },
    { platform: 'ios', name: 'iPad Pro 12.9-inch', osVersion: '17.0', formFactor: 'tablet' },
    { platform: 'android', name: 'Pixel 7', osVersion: '14', formFactor: 'phone' },
    { platform: 'android', name: 'Samsung Galaxy S23', osVersion: '14', formFactor: 'phone' },
    { platform: 'android', name: 'Samsung Galaxy Tab S9', osVersion: '14', formFactor: 'tablet' },
  ],

  // Comprehensive: 12+ devices for full compatibility testing
  comprehensive: [
    // iOS - Latest
    { platform: 'ios', name: 'iPhone 15 Pro Max', osVersion: '17.0', formFactor: 'phone' },
    { platform: 'ios', name: 'iPhone 15', osVersion: '17.0', formFactor: 'phone' },
    { platform: 'ios', name: 'iPhone SE (3rd generation)', osVersion: '17.0', formFactor: 'phone' },
    { platform: 'ios', name: 'iPad Pro 12.9-inch', osVersion: '17.0', formFactor: 'tablet' },
    // iOS - Previous
    { platform: 'ios', name: 'iPhone 14', osVersion: '16.0', formFactor: 'phone' },
    { platform: 'ios', name: 'iPhone 12', osVersion: '15.0', formFactor: 'phone' },
    // Android - Latest
    { platform: 'android', name: 'Pixel 8', osVersion: '14', formFactor: 'phone' },
    { platform: 'android', name: 'Pixel 7', osVersion: '14', formFactor: 'phone' },
    { platform: 'android', name: 'Samsung Galaxy S23 Ultra', osVersion: '14', formFactor: 'phone' },
    { platform: 'android', name: 'Samsung Galaxy A54', osVersion: '14', formFactor: 'phone' },
    { platform: 'android', name: 'Samsung Galaxy Tab S9', osVersion: '14', formFactor: 'tablet' },
    // Android - Previous
    { platform: 'android', name: 'Pixel 6', osVersion: '13', formFactor: 'phone' },
    { platform: 'android', name: 'Samsung Galaxy S22', osVersion: '13', formFactor: 'phone' },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDER INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

interface DeviceCloudProvider {
  name: DeviceProvider;
  uploadApp(appPath: string, platform: 'ios' | 'android'): Promise<string>;
  uploadTests(testPath: string): Promise<string>;
  startTestRun(config: TestRunConfig): Promise<string>;
  getTestStatus(runId: string): Promise<TestRunStatus>;
  getTestResults(runId: string): Promise<DeviceTestResult[]>;
  getArtifacts(runId: string, deviceId: string): Promise<DeviceArtifact[]>;
  cancelRun(runId: string): Promise<void>;
}

interface TestRunConfig {
  appId: string;
  testId?: string;
  devices: DeviceSpec[];
  testType: 'maestro' | 'appium' | 'xcuitest' | 'espresso' | 'robo';
  timeout: number;
  parallel: boolean;
}

interface TestRunStatus {
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  currentDevice?: string;
  startedAt?: Date;
  estimatedCompletion?: Date;
}

// ═══════════════════════════════════════════════════════════════════════════
// AWS DEVICE FARM PROVIDER
// ═══════════════════════════════════════════════════════════════════════════

class AWSDeviceFarmProvider implements DeviceCloudProvider {
  name: DeviceProvider = 'aws-device-farm';
  private credentials: ProviderCredentials['aws-device-farm'];
  private client: unknown; // Would be DeviceFarmClient from @aws-sdk/client-device-farm

  constructor(credentials: ProviderCredentials['aws-device-farm']) {
    this.credentials = credentials;
    // Initialize AWS SDK client
    // this.client = new DeviceFarmClient({
    //   region: credentials.region,
    //   credentials: {
    //     accessKeyId: credentials.accessKeyId,
    //     secretAccessKey: credentials.secretAccessKey,
    //   },
    // });
  }

  async uploadApp(appPath: string, platform: 'ios' | 'android'): Promise<string> {
    const type = platform === 'ios' ? 'IOS_APP' : 'ANDROID_APP';
    console.log(`[AWS Device Farm] Uploading ${platform} app: ${appPath}`);

    // AWS Device Farm upload flow:
    // 1. CreateUpload to get pre-signed URL
    // 2. Upload file to pre-signed URL
    // 3. Wait for upload to complete

    // const createUploadResponse = await this.client.send(new CreateUploadCommand({
    //   projectArn: this.credentials.projectArn,
    //   name: path.basename(appPath),
    //   type,
    // }));

    // Mock response for now
    return `arn:aws:devicefarm:${this.credentials.region}:upload:app-${Date.now()}`;
  }

  async uploadTests(testPath: string): Promise<string> {
    console.log(`[AWS Device Farm] Uploading tests: ${testPath}`);
    // Similar flow to uploadApp but with type APPIUM_NODE_TEST_PACKAGE
    return `arn:aws:devicefarm:${this.credentials.region}:upload:tests-${Date.now()}`;
  }

  async startTestRun(config: TestRunConfig): Promise<string> {
    console.log(`[AWS Device Farm] Starting test run with ${config.devices.length} devices`);

    // const response = await this.client.send(new ScheduleRunCommand({
    //   projectArn: this.credentials.projectArn,
    //   appArn: config.appId,
    //   devicePoolArn: await this.getOrCreateDevicePool(config.devices),
    //   test: {
    //     type: 'APPIUM_NODE',
    //     testPackageArn: config.testId,
    //   },
    //   executionConfiguration: {
    //     jobTimeoutMinutes: config.timeout / 60000,
    //   },
    // }));

    return `arn:aws:devicefarm:${this.credentials.region}:run:${Date.now()}`;
  }

  async getTestStatus(runId: string): Promise<TestRunStatus> {
    console.log(`[AWS Device Farm] Getting status for run: ${runId}`);
    // const response = await this.client.send(new GetRunCommand({ arn: runId }));
    return { status: 'running', progress: 50 };
  }

  async getTestResults(runId: string): Promise<DeviceTestResult[]> {
    console.log(`[AWS Device Farm] Getting results for run: ${runId}`);
    // const response = await this.client.send(new ListJobsCommand({ arn: runId }));
    return [];
  }

  async getArtifacts(runId: string, deviceId: string): Promise<DeviceArtifact[]> {
    console.log(`[AWS Device Farm] Getting artifacts for device: ${deviceId}`);
    // const response = await this.client.send(new ListArtifactsCommand({ arn: deviceId, type: 'FILE' }));
    return [];
  }

  async cancelRun(runId: string): Promise<void> {
    console.log(`[AWS Device Farm] Cancelling run: ${runId}`);
    // await this.client.send(new StopRunCommand({ arn: runId }));
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// BROWSERSTACK PROVIDER
// ═══════════════════════════════════════════════════════════════════════════

class BrowserStackProvider implements DeviceCloudProvider {
  name: DeviceProvider = 'browserstack';
  private credentials: ProviderCredentials['browserstack'];
  private baseUrl = 'https://api-cloud.browserstack.com/app-automate';

  constructor(credentials: ProviderCredentials['browserstack']) {
    this.credentials = credentials;
  }

  private async request(method: string, endpoint: string, body?: unknown): Promise<unknown> {
    const auth = Buffer.from(`${this.credentials.username}:${this.credentials.accessKey}`).toString('base64');

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`BrowserStack API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async uploadApp(appPath: string, platform: 'ios' | 'android'): Promise<string> {
    console.log(`[BrowserStack] Uploading ${platform} app: ${appPath}`);

    // For file upload, use FormData
    // const form = new FormData();
    // form.append('file', fs.createReadStream(appPath));
    // const response = await this.request('POST', '/upload', form);

    // Mock response
    return `bs://app-${Date.now()}`;
  }

  async uploadTests(testPath: string): Promise<string> {
    console.log(`[BrowserStack] Tests are uploaded with the test run, not separately`);
    return testPath;
  }

  async startTestRun(config: TestRunConfig): Promise<string> {
    console.log(`[BrowserStack] Starting test run with ${config.devices.length} devices`);

    // Map devices to BrowserStack format
    const devices = config.devices.map(d => ({
      device: d.name,
      os_version: d.osVersion,
      platform: d.platform.toUpperCase(),
    }));

    // Start Appium session for each device
    // This would typically be handled by the test framework (Appium, Detox, etc.)

    return `session-${Date.now()}`;
  }

  async getTestStatus(runId: string): Promise<TestRunStatus> {
    console.log(`[BrowserStack] Getting status for session: ${runId}`);
    // const response = await this.request('GET', `/sessions/${runId}`);
    return { status: 'running' };
  }

  async getTestResults(runId: string): Promise<DeviceTestResult[]> {
    console.log(`[BrowserStack] Getting results for session: ${runId}`);
    return [];
  }

  async getArtifacts(runId: string, deviceId: string): Promise<DeviceArtifact[]> {
    console.log(`[BrowserStack] Getting artifacts for session: ${runId}`);
    return [];
  }

  async cancelRun(runId: string): Promise<void> {
    console.log(`[BrowserStack] Cancelling session: ${runId}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAESTRO CLOUD PROVIDER
// ═══════════════════════════════════════════════════════════════════════════

class MaestroCloudProvider implements DeviceCloudProvider {
  name: DeviceProvider = 'maestro-cloud';
  private apiKey: string;
  private baseUrl = 'https://api.mobile.dev';

  constructor(credentials: ProviderCredentials['maestro-cloud']) {
    this.apiKey = credentials.apiKey;
  }

  private async request(method: string, endpoint: string, body?: unknown): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Maestro Cloud API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async uploadApp(appPath: string, platform: 'ios' | 'android'): Promise<string> {
    console.log(`[Maestro Cloud] App is uploaded with the test run`);
    return appPath;
  }

  async uploadTests(testPath: string): Promise<string> {
    console.log(`[Maestro Cloud] Tests are uploaded with the test run`);
    return testPath;
  }

  async startTestRun(config: TestRunConfig): Promise<string> {
    console.log(`[Maestro Cloud] Starting test run`);

    // Maestro Cloud uses CLI: maestro cloud --app-file <app> --flows <flows>
    // Or API for programmatic access

    // const response = await this.request('POST', '/v1/runs', {
    //   app: config.appId,
    //   flows: config.testId,
    //   devices: config.devices.map(d => ({
    //     platform: d.platform,
    //     model: d.name,
    //     osVersion: d.osVersion,
    //   })),
    // });

    return `maestro-run-${Date.now()}`;
  }

  async getTestStatus(runId: string): Promise<TestRunStatus> {
    console.log(`[Maestro Cloud] Getting status for run: ${runId}`);
    // const response = await this.request('GET', `/v1/runs/${runId}`);
    return { status: 'running' };
  }

  async getTestResults(runId: string): Promise<DeviceTestResult[]> {
    console.log(`[Maestro Cloud] Getting results for run: ${runId}`);
    return [];
  }

  async getArtifacts(runId: string, deviceId: string): Promise<DeviceArtifact[]> {
    console.log(`[Maestro Cloud] Getting artifacts for run: ${runId}`);
    return [];
  }

  async cancelRun(runId: string): Promise<void> {
    console.log(`[Maestro Cloud] Cancelling run: ${runId}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FIREBASE TEST LAB PROVIDER
// ═══════════════════════════════════════════════════════════════════════════

class FirebaseTestLabProvider implements DeviceCloudProvider {
  name: DeviceProvider = 'firebase-test-lab';
  private credentials: ProviderCredentials['firebase-test-lab'];

  constructor(credentials: ProviderCredentials['firebase-test-lab']) {
    this.credentials = credentials;
  }

  async uploadApp(appPath: string, platform: 'ios' | 'android'): Promise<string> {
    console.log(`[Firebase Test Lab] Uploading ${platform} app: ${appPath}`);
    // Upload to Google Cloud Storage
    // gcloud storage cp $appPath gs://$bucket/
    return `gs://firebase-test-lab-${this.credentials.projectId}/${Date.now()}/app`;
  }

  async uploadTests(testPath: string): Promise<string> {
    console.log(`[Firebase Test Lab] Uploading tests: ${testPath}`);
    return `gs://firebase-test-lab-${this.credentials.projectId}/${Date.now()}/tests`;
  }

  async startTestRun(config: TestRunConfig): Promise<string> {
    console.log(`[Firebase Test Lab] Starting test run`);

    // gcloud firebase test android run \
    //   --app $appPath \
    //   --test $testPath \
    //   --device model=$model,version=$version,locale=en,orientation=portrait

    return `matrix-${Date.now()}`;
  }

  async getTestStatus(runId: string): Promise<TestRunStatus> {
    console.log(`[Firebase Test Lab] Getting status for matrix: ${runId}`);
    return { status: 'running' };
  }

  async getTestResults(runId: string): Promise<DeviceTestResult[]> {
    console.log(`[Firebase Test Lab] Getting results for matrix: ${runId}`);
    return [];
  }

  async getArtifacts(runId: string, deviceId: string): Promise<DeviceArtifact[]> {
    console.log(`[Firebase Test Lab] Getting artifacts for matrix: ${runId}`);
    return [];
  }

  async cancelRun(runId: string): Promise<void> {
    console.log(`[Firebase Test Lab] Cancelling matrix: ${runId}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// LOCAL SIMULATOR/EMULATOR PROVIDER
// ═══════════════════════════════════════════════════════════════════════════

class LocalDeviceProvider implements DeviceCloudProvider {
  name: DeviceProvider = 'local';

  constructor() {}

  async uploadApp(appPath: string, platform: 'ios' | 'android'): Promise<string> {
    console.log(`[Local] Using local app: ${appPath}`);
    return appPath;
  }

  async uploadTests(testPath: string): Promise<string> {
    console.log(`[Local] Using local tests: ${testPath}`);
    return testPath;
  }

  async startTestRun(config: TestRunConfig): Promise<string> {
    console.log(`[Local] Starting local test run`);

    // For iOS: xcrun simctl boot "iPhone 15" && xcrun simctl install booted $app
    // For Android: emulator -avd $avd -no-window && adb install $app
    // Then run: maestro test $flows

    return `local-run-${Date.now()}`;
  }

  async getTestStatus(runId: string): Promise<TestRunStatus> {
    return { status: 'completed' };
  }

  async getTestResults(runId: string): Promise<DeviceTestResult[]> {
    return [];
  }

  async getArtifacts(runId: string, deviceId: string): Promise<DeviceArtifact[]> {
    return [];
  }

  async cancelRun(runId: string): Promise<void> {
    console.log(`[Local] Cancelling run: ${runId}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DEVICE CLOUD SERVICE
// ═══════════════════════════════════════════════════════════════════════════

export class DeviceCloudService {
  private providers: Map<DeviceProvider, DeviceCloudProvider> = new Map();
  private defaultProvider: DeviceProvider = 'local';
  private sessions: Map<string, DeviceTestSession> = new Map();

  constructor(configs?: DeviceCloudConfig[]) {
    // Always register local provider
    this.providers.set('local', new LocalDeviceProvider());

    // Register configured providers
    if (configs) {
      for (const config of configs) {
        this.registerProvider(config);
      }
    }
  }

  /**
   * Register a cloud provider
   */
  registerProvider(config: DeviceCloudConfig): void {
    let provider: DeviceCloudProvider;

    switch (config.provider) {
      case 'aws-device-farm':
        provider = new AWSDeviceFarmProvider(config.credentials as ProviderCredentials['aws-device-farm']);
        break;
      case 'browserstack':
        provider = new BrowserStackProvider(config.credentials as ProviderCredentials['browserstack']);
        break;
      case 'maestro-cloud':
        provider = new MaestroCloudProvider(config.credentials as ProviderCredentials['maestro-cloud']);
        break;
      case 'firebase-test-lab':
        provider = new FirebaseTestLabProvider(config.credentials as ProviderCredentials['firebase-test-lab']);
        break;
      case 'local':
        provider = new LocalDeviceProvider();
        break;
      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }

    this.providers.set(config.provider, provider);

    // Set first non-local provider as default
    if (config.provider !== 'local') {
      this.defaultProvider = config.provider;
    }
  }

  /**
   * Start a test session on devices
   */
  async startTestSession(options: {
    projectId: string;
    buildId: string;
    appPath: string;
    testPath: string;
    config?: DeviceTestConfig;
    onProgress?: (session: DeviceTestSession) => void;
  }): Promise<DeviceTestSession> {
    const { projectId, buildId, appPath, testPath, config, onProgress } = options;

    const providerName = config?.provider || this.defaultProvider;
    const provider = this.providers.get(providerName);

    if (!provider) {
      throw new Error(`Provider not registered: ${providerName}`);
    }

    const devices = config?.devices || DEFAULT_DEVICE_MATRIX.minimal;
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Initialize session
    const session: DeviceTestSession = {
      id: sessionId,
      provider: providerName,
      projectId,
      buildId,
      status: 'queued',
      startedAt: new Date(),
      results: [],
      summary: {
        totalDevices: devices.length,
        passedDevices: 0,
        failedDevices: 0,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        duration: 0,
      },
    };

    this.sessions.set(sessionId, session);
    onProgress?.(session);

    try {
      // Upload app for each platform
      const iosDevices = devices.filter(d => d.platform === 'ios');
      const androidDevices = devices.filter(d => d.platform === 'android');

      const appIds: { ios?: string; android?: string } = {};

      if (iosDevices.length > 0) {
        appIds.ios = await provider.uploadApp(appPath.replace(/\.(apk|aab)$/, '.ipa'), 'ios');
      }
      if (androidDevices.length > 0) {
        appIds.android = await provider.uploadApp(appPath, 'android');
      }

      // Upload tests
      const testId = await provider.uploadTests(testPath);

      // Start test run
      session.status = 'running';
      onProgress?.(session);

      const runId = await provider.startTestRun({
        appId: appIds.ios || appIds.android || '',
        testId,
        devices,
        testType: 'maestro',
        timeout: config?.timeout || 600000,
        parallel: config?.parallel ?? true,
      });

      // Poll for completion
      await this.pollForCompletion(provider, runId, session, onProgress, config?.timeout || 600000);

      // Get results
      session.results = await provider.getTestResults(runId);

      // Calculate summary
      session.summary = this.calculateSummary(session.results);
      session.status = 'completed';
      session.completedAt = new Date();

    } catch (error) {
      session.status = 'failed';
      session.completedAt = new Date();
      console.error(`[DeviceCloudService] Test session failed:`, error);
    }

    onProgress?.(session);
    return session;
  }

  /**
   * Poll provider for test completion
   */
  private async pollForCompletion(
    provider: DeviceCloudProvider,
    runId: string,
    session: DeviceTestSession,
    onProgress?: (session: DeviceTestSession) => void,
    timeout: number = 600000
  ): Promise<void> {
    const startTime = Date.now();
    const pollInterval = 10000; // 10 seconds

    while (Date.now() - startTime < timeout) {
      const status = await provider.getTestStatus(runId);

      if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
        return;
      }

      if (status.progress) {
        // Update session with progress
        onProgress?.(session);
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Test run timed out');
  }

  /**
   * Calculate test summary
   */
  private calculateSummary(results: DeviceTestResult[]): DeviceTestSummary {
    const summary: DeviceTestSummary = {
      totalDevices: results.length,
      passedDevices: 0,
      failedDevices: 0,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      duration: 0,
    };

    for (const result of results) {
      if (result.status === 'passed') {
        summary.passedDevices++;
      } else {
        summary.failedDevices++;
      }

      summary.totalTests += result.tests.length;
      summary.passedTests += result.tests.filter((t: { status: string }) => t.status === 'passed').length;
      summary.failedTests += result.tests.filter((t: { status: string }) => t.status === 'failed').length;
      summary.duration += result.duration;
    }

    return summary;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): DeviceTestSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Cancel a running session
   */
  async cancelSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'running') {
      return;
    }

    const provider = this.providers.get(session.provider);
    if (provider) {
      await provider.cancelRun(sessionId);
    }

    session.status = 'failed';
    session.completedAt = new Date();
  }

  /**
   * Get available devices from provider
   */
  async getAvailableDevices(providerName?: DeviceProvider): Promise<DeviceSpec[]> {
    const provider = providerName || this.defaultProvider;

    // Return device matrices based on provider
    // In production, these would come from the provider APIs
    return DEFAULT_DEVICE_MATRIX.comprehensive;
  }

  /**
   * Get recommended device matrix based on app type
   */
  getRecommendedDevices(options: {
    tier: 'minimal' | 'standard' | 'comprehensive';
    platforms?: ('ios' | 'android')[];
  }): DeviceSpec[] {
    let devices = DEFAULT_DEVICE_MATRIX[options.tier];

    if (options.platforms) {
      devices = devices.filter(d => options.platforms!.includes(d.platform));
    }

    return devices;
  }
}

// Export singleton instance
export const deviceCloudService = new DeviceCloudService();

// Export types
export type { DeviceCloudProvider, TestRunConfig, TestRunStatus };
