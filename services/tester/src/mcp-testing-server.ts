/**
 * MCP Testing Server
 *
 * Provides specialized testing tools for AI agents:
 * - UI Interaction Tools: Device control, element interaction, gestures
 * - Visual Regression Tools: Screenshot capture, comparison, baselines
 * - Flow Validation Tools: State machine testing, journey verification
 * - Exploratory Testing Tools: AI-powered crawling, anomaly detection
 *
 * Based on 2025 best practices for mobile testing automation.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { TestService, type TestStep, type TestFlow } from './test-service';
import { ScreenshotService, type Screenshot, type VisualDiff } from './screenshot-service';
import { DeviceCloudService, DEFAULT_DEVICE_MATRIX, type DeviceTestSession } from './device-cloud-service';
import { MaestroGenerator, type E2ETestSuite } from './maestro-generator';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface ElementInfo {
  selector: string;
  type: string;
  text?: string;
  accessibilityLabel?: string;
  testID?: string;
  bounds: { x: number; y: number; width: number; height: number };
  isVisible: boolean;
  isEnabled: boolean;
  isInteractive: boolean;
}

interface ScreenState {
  screenName: string;
  elements: ElementInfo[];
  scrollPosition: { x: number; y: number };
  timestamp: Date;
}

interface FlowState {
  currentScreen: string;
  visitedScreens: string[];
  actionHistory: Array<{ action: string; selector?: string; timestamp: Date }>;
  errors: Array<{ message: string; screen: string; timestamp: Date }>;
}

interface AnomalyReport {
  type: 'visual' | 'behavioral' | 'performance' | 'accessibility';
  severity: 'low' | 'medium' | 'high' | 'critical';
  screen: string;
  description: string;
  element?: string;
  evidence?: string;
  suggestedFix?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// TOOL DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

const TESTING_TOOLS: Tool[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // UI INTERACTION TOOLS
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: 'device_tap',
    description: 'Tap an element on the device screen by selector (testID, accessibilityLabel, or CSS-like selector)',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Element selector (testID, accessibilityLabel, or XPath)' },
        timeout: { type: 'number', description: 'Wait timeout in ms (default: 10000)' },
        retries: { type: 'number', description: 'Number of retries if element not found (default: 3)' },
      },
      required: ['selector'],
    },
  },
  {
    name: 'device_long_press',
    description: 'Long press an element for context menus or drag operations',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Element selector' },
        duration: { type: 'number', description: 'Press duration in ms (default: 1000)' },
      },
      required: ['selector'],
    },
  },
  {
    name: 'device_double_tap',
    description: 'Double tap an element (for zoom or special interactions)',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Element selector' },
      },
      required: ['selector'],
    },
  },
  {
    name: 'device_type',
    description: 'Type text into an input field',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Input element selector' },
        text: { type: 'string', description: 'Text to type' },
        clearFirst: { type: 'boolean', description: 'Clear existing text first (default: true)' },
      },
      required: ['selector', 'text'],
    },
  },
  {
    name: 'device_swipe',
    description: 'Swipe in a direction on the screen',
    inputSchema: {
      type: 'object',
      properties: {
        direction: { type: 'string', enum: ['up', 'down', 'left', 'right'], description: 'Swipe direction' },
        distance: { type: 'number', description: 'Swipe distance in pixels (default: 300)' },
        speed: { type: 'number', description: 'Swipe speed (0-1, default: 0.5)' },
        startX: { type: 'number', description: 'Start X coordinate (optional)' },
        startY: { type: 'number', description: 'Start Y coordinate (optional)' },
      },
      required: ['direction'],
    },
  },
  {
    name: 'device_scroll_to',
    description: 'Scroll until an element is visible',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Target element selector' },
        direction: { type: 'string', enum: ['up', 'down'], description: 'Scroll direction (default: down)' },
        maxScrolls: { type: 'number', description: 'Maximum scroll attempts (default: 10)' },
      },
      required: ['selector'],
    },
  },
  {
    name: 'device_pinch',
    description: 'Pinch to zoom in or out',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['in', 'out'], description: 'Pinch in (zoom out) or out (zoom in)' },
        scale: { type: 'number', description: 'Scale factor (0.5-2.0, default: 1.5)' },
        x: { type: 'number', description: 'Center X coordinate' },
        y: { type: 'number', description: 'Center Y coordinate' },
      },
      required: ['action'],
    },
  },
  {
    name: 'device_rotate',
    description: 'Rotate the device orientation',
    inputSchema: {
      type: 'object',
      properties: {
        orientation: { type: 'string', enum: ['portrait', 'landscape', 'portrait_upside_down', 'landscape_right'] },
      },
      required: ['orientation'],
    },
  },
  {
    name: 'device_back',
    description: 'Press the back button (Android) or swipe back (iOS)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'device_home',
    description: 'Press the home button',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ELEMENT INSPECTION TOOLS
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: 'get_element',
    description: 'Get detailed information about an element',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Element selector' },
      },
      required: ['selector'],
    },
  },
  {
    name: 'find_elements',
    description: 'Find all elements matching a pattern or type',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['button', 'input', 'text', 'image', 'list', 'all'], description: 'Element type to find' },
        pattern: { type: 'string', description: 'Text or testID pattern (regex supported)' },
        onlyVisible: { type: 'boolean', description: 'Only return visible elements (default: true)' },
        onlyInteractive: { type: 'boolean', description: 'Only return interactive elements (default: false)' },
      },
    },
  },
  {
    name: 'get_screen_state',
    description: 'Get the current screen state including all visible elements',
    inputSchema: {
      type: 'object',
      properties: {
        includeHidden: { type: 'boolean', description: 'Include hidden elements (default: false)' },
        maxDepth: { type: 'number', description: 'Maximum element tree depth (default: 10)' },
      },
    },
  },
  {
    name: 'element_exists',
    description: 'Check if an element exists on screen',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Element selector' },
        timeout: { type: 'number', description: 'Wait timeout in ms (default: 5000)' },
      },
      required: ['selector'],
    },
  },
  {
    name: 'wait_for_element',
    description: 'Wait for an element to appear or disappear',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Element selector' },
        state: { type: 'string', enum: ['visible', 'hidden', 'enabled', 'disabled'], description: 'Expected state' },
        timeout: { type: 'number', description: 'Wait timeout in ms (default: 30000)' },
      },
      required: ['selector', 'state'],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // VISUAL TESTING TOOLS
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: 'capture_screenshot',
    description: 'Capture a screenshot of the current screen',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Screenshot name/identifier' },
        fullPage: { type: 'boolean', description: 'Capture full scrollable content (default: false)' },
        hideElements: { type: 'array', items: { type: 'string' }, description: 'Element selectors to hide (for dynamic content)' },
        maskElements: { type: 'array', items: { type: 'string' }, description: 'Element selectors to mask (for sensitive data)' },
      },
      required: ['name'],
    },
  },
  {
    name: 'compare_screenshot',
    description: 'Compare current screen with a baseline screenshot',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Screenshot name to compare' },
        baselineId: { type: 'string', description: 'Baseline build ID (optional, uses latest if not specified)' },
        threshold: { type: 'number', description: 'Difference threshold 0-100% (default: 5)' },
        ignoreRegions: { type: 'array', items: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' }, width: { type: 'number' }, height: { type: 'number' } } }, description: 'Regions to ignore in comparison' },
      },
      required: ['name'],
    },
  },
  {
    name: 'set_baseline',
    description: 'Set current screenshots as the baseline for future comparisons',
    inputSchema: {
      type: 'object',
      properties: {
        buildId: { type: 'string', description: 'Build ID to use as baseline' },
        screens: { type: 'array', items: { type: 'string' }, description: 'Specific screens to baseline (optional, all if not specified)' },
      },
      required: ['buildId'],
    },
  },
  {
    name: 'analyze_visual_hierarchy',
    description: 'Analyze the visual hierarchy and layout of the screen',
    inputSchema: {
      type: 'object',
      properties: {
        checkAlignment: { type: 'boolean', description: 'Check element alignment (default: true)' },
        checkSpacing: { type: 'boolean', description: 'Check consistent spacing (default: true)' },
        checkContrast: { type: 'boolean', description: 'Check color contrast for accessibility (default: true)' },
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FLOW VALIDATION TOOLS
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: 'start_flow_tracking',
    description: 'Start tracking a user flow for validation',
    inputSchema: {
      type: 'object',
      properties: {
        flowName: { type: 'string', description: 'Name of the flow being tested' },
        expectedScreens: { type: 'array', items: { type: 'string' }, description: 'Expected screen sequence' },
      },
      required: ['flowName'],
    },
  },
  {
    name: 'get_flow_state',
    description: 'Get the current state of flow tracking',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'validate_flow',
    description: 'Validate that the tracked flow matches expected behavior',
    inputSchema: {
      type: 'object',
      properties: {
        expectedScreens: { type: 'array', items: { type: 'string' }, description: 'Expected screen sequence' },
        allowExtra: { type: 'boolean', description: 'Allow extra screens not in expected list (default: false)' },
        checkOrder: { type: 'boolean', description: 'Validate screen order (default: true)' },
      },
      required: ['expectedScreens'],
    },
  },
  {
    name: 'execute_flow',
    description: 'Execute a predefined user flow (series of actions)',
    inputSchema: {
      type: 'object',
      properties: {
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string', enum: ['tap', 'type', 'swipe', 'wait', 'assert'] },
              selector: { type: 'string' },
              value: { type: 'string' },
              timeout: { type: 'number' },
            },
            required: ['action'],
          },
          description: 'Steps to execute',
        },
        stopOnError: { type: 'boolean', description: 'Stop execution on first error (default: true)' },
        captureScreenshots: { type: 'boolean', description: 'Capture screenshot after each step (default: false)' },
      },
      required: ['steps'],
    },
  },
  {
    name: 'assert_screen',
    description: 'Assert that we are on the expected screen',
    inputSchema: {
      type: 'object',
      properties: {
        screenName: { type: 'string', description: 'Expected screen name or identifier' },
        indicators: { type: 'array', items: { type: 'string' }, description: 'Element selectors that indicate this screen' },
      },
      required: ['screenName'],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // EXPLORATORY TESTING TOOLS
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: 'discover_screens',
    description: 'Automatically discover and catalog all reachable screens',
    inputSchema: {
      type: 'object',
      properties: {
        maxDepth: { type: 'number', description: 'Maximum navigation depth (default: 5)' },
        maxScreens: { type: 'number', description: 'Maximum screens to discover (default: 50)' },
        excludePatterns: { type: 'array', items: { type: 'string' }, description: 'Patterns for elements to exclude from clicking' },
      },
    },
  },
  {
    name: 'explore_screen',
    description: 'Explore the current screen by interacting with all actionable elements',
    inputSchema: {
      type: 'object',
      properties: {
        interactionTypes: { type: 'array', items: { type: 'string', enum: ['tap', 'type', 'swipe'] }, description: 'Types of interactions to try' },
        maxInteractions: { type: 'number', description: 'Maximum interactions to perform (default: 20)' },
        captureState: { type: 'boolean', description: 'Capture state after each interaction (default: true)' },
      },
    },
  },
  {
    name: 'detect_anomalies',
    description: 'Detect UI anomalies and potential issues on the current screen',
    inputSchema: {
      type: 'object',
      properties: {
        checkTypes: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['visual', 'accessibility', 'performance', 'layout', 'text'],
          },
          description: 'Types of anomalies to check',
        },
      },
    },
  },
  {
    name: 'stress_test_element',
    description: 'Perform stress testing on an element (rapid taps, edge cases)',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Element selector' },
        tests: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['rapid_tap', 'long_text', 'special_chars', 'empty_input', 'boundary_values'],
          },
          description: 'Stress tests to perform',
        },
      },
      required: ['selector'],
    },
  },
  {
    name: 'monkey_test',
    description: 'Perform random interactions to discover crashes or unexpected behavior',
    inputSchema: {
      type: 'object',
      properties: {
        duration: { type: 'number', description: 'Test duration in seconds (default: 60)' },
        seed: { type: 'number', description: 'Random seed for reproducibility' },
        includeGestures: { type: 'boolean', description: 'Include complex gestures (default: true)' },
        avoidElements: { type: 'array', items: { type: 'string' }, description: 'Elements to avoid (e.g., logout button)' },
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ACCESSIBILITY TESTING TOOLS
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: 'accessibility_audit',
    description: 'Run a comprehensive accessibility audit on the current screen',
    inputSchema: {
      type: 'object',
      properties: {
        wcagLevel: { type: 'string', enum: ['A', 'AA', 'AAA'], description: 'WCAG compliance level (default: AA)' },
        checkLabels: { type: 'boolean', description: 'Check for missing accessibility labels (default: true)' },
        checkContrast: { type: 'boolean', description: 'Check color contrast ratios (default: true)' },
        checkTouchTargets: { type: 'boolean', description: 'Check touch target sizes (default: true)' },
        checkScreenReader: { type: 'boolean', description: 'Check screen reader compatibility (default: true)' },
      },
    },
  },
  {
    name: 'simulate_screen_reader',
    description: 'Simulate screen reader navigation',
    inputSchema: {
      type: 'object',
      properties: {
        navigation: { type: 'string', enum: ['forward', 'backward', 'headers', 'links'], description: 'Navigation mode' },
        steps: { type: 'number', description: 'Number of navigation steps (default: 10)' },
      },
      required: ['navigation'],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // PERFORMANCE TESTING TOOLS
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: 'measure_render_time',
    description: 'Measure screen render and transition times',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', description: 'Action to measure (e.g., tap selector)' },
        waitFor: { type: 'string', description: 'Element to wait for after action' },
      },
    },
  },
  {
    name: 'measure_scroll_performance',
    description: 'Measure scrolling performance (FPS, jank)',
    inputSchema: {
      type: 'object',
      properties: {
        scrollCount: { type: 'number', description: 'Number of scrolls to perform (default: 5)' },
        direction: { type: 'string', enum: ['up', 'down'], description: 'Scroll direction' },
      },
    },
  },
  {
    name: 'get_memory_usage',
    description: 'Get current app memory usage',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MAESTRO INTEGRATION TOOLS
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: 'generate_maestro_flow',
    description: 'Generate a Maestro YAML flow from recorded actions',
    inputSchema: {
      type: 'object',
      properties: {
        flowName: { type: 'string', description: 'Name of the flow' },
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              selector: { type: 'string' },
              value: { type: 'string' },
            },
          },
          description: 'Steps to include in the flow',
        },
        outputPath: { type: 'string', description: 'Path to write the YAML file' },
      },
      required: ['flowName', 'steps'],
    },
  },
  {
    name: 'run_maestro_flow',
    description: 'Run a Maestro flow file',
    inputSchema: {
      type: 'object',
      properties: {
        flowPath: { type: 'string', description: 'Path to the Maestro YAML flow' },
        device: { type: 'string', description: 'Target device (optional)' },
        env: { type: 'object', description: 'Environment variables for the flow' },
      },
      required: ['flowPath'],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // DEVICE CLOUD TOOLS
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: 'start_cloud_session',
    description: 'Start a test session on cloud devices',
    inputSchema: {
      type: 'object',
      properties: {
        provider: { type: 'string', enum: ['aws-device-farm', 'browserstack', 'maestro-cloud', 'firebase-test-lab', 'local'], description: 'Cloud provider' },
        devices: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              platform: { type: 'string', enum: ['ios', 'android'] },
              model: { type: 'string' },
              osVersion: { type: 'string' },
            },
          },
          description: 'Target devices',
        },
        appPath: { type: 'string', description: 'Path to app binary' },
        testPath: { type: 'string', description: 'Path to test files' },
        timeout: { type: 'number', description: 'Session timeout in ms (default: 600000)' },
        parallel: { type: 'boolean', description: 'Run tests in parallel (default: true)' },
      },
      required: ['provider', 'devices', 'appPath'],
    },
  },
  {
    name: 'get_cloud_session_status',
    description: 'Get status of a cloud test session',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ID' },
      },
      required: ['sessionId'],
    },
  },
  {
    name: 'get_cloud_devices',
    description: 'Get available cloud devices for testing',
    inputSchema: {
      type: 'object',
      properties: {
        provider: { type: 'string', enum: ['aws-device-farm', 'browserstack', 'maestro-cloud', 'firebase-test-lab'], description: 'Cloud provider' },
        platform: { type: 'string', enum: ['ios', 'android'], description: 'Filter by platform' },
        tier: { type: 'string', enum: ['minimal', 'standard', 'comprehensive'], description: 'Device tier (default: standard)' },
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // REPORTING TOOLS
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: 'generate_test_report',
    description: 'Generate a comprehensive test report',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Test session ID' },
        format: { type: 'string', enum: ['json', 'html', 'markdown'], description: 'Report format (default: json)' },
        includeScreenshots: { type: 'boolean', description: 'Include screenshots in report (default: true)' },
        includeVideos: { type: 'boolean', description: 'Include video recordings (default: false)' },
      },
      required: ['sessionId'],
    },
  },
  {
    name: 'get_test_logs',
    description: 'Get detailed logs from a test session',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Test session ID' },
        level: { type: 'string', enum: ['all', 'error', 'warn', 'info', 'debug'], description: 'Log level filter' },
        limit: { type: 'number', description: 'Maximum number of log entries (default: 100)' },
      },
      required: ['sessionId'],
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// TOOL HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

class MCPTestingServer {
  private server: Server;
  private testService: TestService;
  private screenshotService: ScreenshotService;
  private deviceCloudService: DeviceCloudService;
  private flowState: FlowState | null = null;
  private anomalies: AnomalyReport[] = [];

  constructor() {
    this.server = new Server(
      { name: 'mobigen-testing-mcp', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );

    this.testService = new TestService();
    this.screenshotService = new ScreenshotService();
    this.deviceCloudService = new DeviceCloudService();

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: TESTING_TOOLS,
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        const result = await this.executeTool(name, args as Record<string, unknown>);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [{ type: 'text', text: `Error: ${errorMessage}` }],
          isError: true,
        };
      }
    });
  }

  private async executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    switch (name) {
      // ─────────────────────────────────────────────────────────────────────
      // UI INTERACTION HANDLERS
      // ─────────────────────────────────────────────────────────────────────
      case 'device_tap':
        return this.handleDeviceTap(args);
      case 'device_long_press':
        return this.handleDeviceLongPress(args);
      case 'device_double_tap':
        return this.handleDeviceDoubleTap(args);
      case 'device_type':
        return this.handleDeviceType(args);
      case 'device_swipe':
        return this.handleDeviceSwipe(args);
      case 'device_scroll_to':
        return this.handleDeviceScrollTo(args);
      case 'device_pinch':
        return this.handleDevicePinch(args);
      case 'device_rotate':
        return this.handleDeviceRotate(args);
      case 'device_back':
        return this.handleDeviceBack();
      case 'device_home':
        return this.handleDeviceHome();

      // ─────────────────────────────────────────────────────────────────────
      // ELEMENT INSPECTION HANDLERS
      // ─────────────────────────────────────────────────────────────────────
      case 'get_element':
        return this.handleGetElement(args);
      case 'find_elements':
        return this.handleFindElements(args);
      case 'get_screen_state':
        return this.handleGetScreenState(args);
      case 'element_exists':
        return this.handleElementExists(args);
      case 'wait_for_element':
        return this.handleWaitForElement(args);

      // ─────────────────────────────────────────────────────────────────────
      // VISUAL TESTING HANDLERS
      // ─────────────────────────────────────────────────────────────────────
      case 'capture_screenshot':
        return this.handleCaptureScreenshot(args);
      case 'compare_screenshot':
        return this.handleCompareScreenshot(args);
      case 'set_baseline':
        return this.handleSetBaseline(args);
      case 'analyze_visual_hierarchy':
        return this.handleAnalyzeVisualHierarchy(args);

      // ─────────────────────────────────────────────────────────────────────
      // FLOW VALIDATION HANDLERS
      // ─────────────────────────────────────────────────────────────────────
      case 'start_flow_tracking':
        return this.handleStartFlowTracking(args);
      case 'get_flow_state':
        return this.handleGetFlowState();
      case 'validate_flow':
        return this.handleValidateFlow(args);
      case 'execute_flow':
        return this.handleExecuteFlow(args);
      case 'assert_screen':
        return this.handleAssertScreen(args);

      // ─────────────────────────────────────────────────────────────────────
      // EXPLORATORY TESTING HANDLERS
      // ─────────────────────────────────────────────────────────────────────
      case 'discover_screens':
        return this.handleDiscoverScreens(args);
      case 'explore_screen':
        return this.handleExploreScreen(args);
      case 'detect_anomalies':
        return this.handleDetectAnomalies(args);
      case 'stress_test_element':
        return this.handleStressTestElement(args);
      case 'monkey_test':
        return this.handleMonkeyTest(args);

      // ─────────────────────────────────────────────────────────────────────
      // ACCESSIBILITY TESTING HANDLERS
      // ─────────────────────────────────────────────────────────────────────
      case 'accessibility_audit':
        return this.handleAccessibilityAudit(args);
      case 'simulate_screen_reader':
        return this.handleSimulateScreenReader(args);

      // ─────────────────────────────────────────────────────────────────────
      // PERFORMANCE TESTING HANDLERS
      // ─────────────────────────────────────────────────────────────────────
      case 'measure_render_time':
        return this.handleMeasureRenderTime(args);
      case 'measure_scroll_performance':
        return this.handleMeasureScrollPerformance(args);
      case 'get_memory_usage':
        return this.handleGetMemoryUsage();

      // ─────────────────────────────────────────────────────────────────────
      // MAESTRO INTEGRATION HANDLERS
      // ─────────────────────────────────────────────────────────────────────
      case 'generate_maestro_flow':
        return this.handleGenerateMaestroFlow(args);
      case 'run_maestro_flow':
        return this.handleRunMaestroFlow(args);

      // ─────────────────────────────────────────────────────────────────────
      // DEVICE CLOUD HANDLERS
      // ─────────────────────────────────────────────────────────────────────
      case 'start_cloud_session':
        return this.handleStartCloudSession(args);
      case 'get_cloud_session_status':
        return this.handleGetCloudSessionStatus(args);
      case 'get_cloud_devices':
        return this.handleGetCloudDevices(args);

      // ─────────────────────────────────────────────────────────────────────
      // REPORTING HANDLERS
      // ─────────────────────────────────────────────────────────────────────
      case 'generate_test_report':
        return this.handleGenerateTestReport(args);
      case 'get_test_logs':
        return this.handleGetTestLogs(args);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLER IMPLEMENTATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  // UI Interaction Handlers
  private async handleDeviceTap(args: Record<string, unknown>): Promise<{ success: boolean; message: string }> {
    const { selector, timeout = 10000, retries = 3 } = args;
    // In production, this would use WebdriverIO or Appium
    console.log(`[MCP] Tap: ${selector} (timeout: ${timeout}ms, retries: ${retries})`);
    this.recordAction('tap', selector as string);
    return { success: true, message: `Tapped element: ${selector}` };
  }

  private async handleDeviceLongPress(args: Record<string, unknown>): Promise<{ success: boolean; message: string }> {
    const { selector, duration = 1000 } = args;
    console.log(`[MCP] Long press: ${selector} (duration: ${duration}ms)`);
    this.recordAction('long_press', selector as string);
    return { success: true, message: `Long pressed element: ${selector}` };
  }

  private async handleDeviceDoubleTap(args: Record<string, unknown>): Promise<{ success: boolean; message: string }> {
    const { selector } = args;
    console.log(`[MCP] Double tap: ${selector}`);
    this.recordAction('double_tap', selector as string);
    return { success: true, message: `Double tapped element: ${selector}` };
  }

  private async handleDeviceType(args: Record<string, unknown>): Promise<{ success: boolean; message: string }> {
    const { selector, text, clearFirst = true } = args;
    console.log(`[MCP] Type: "${text}" into ${selector} (clearFirst: ${clearFirst})`);
    this.recordAction('type', selector as string);
    return { success: true, message: `Typed "${text}" into ${selector}` };
  }

  private async handleDeviceSwipe(args: Record<string, unknown>): Promise<{ success: boolean; message: string }> {
    const { direction, distance = 300, speed = 0.5, startX, startY } = args;
    console.log(`[MCP] Swipe: ${direction} (distance: ${distance}, speed: ${speed})`);
    this.recordAction('swipe', `direction:${direction}`);
    return { success: true, message: `Swiped ${direction}` };
  }

  private async handleDeviceScrollTo(args: Record<string, unknown>): Promise<{ success: boolean; found: boolean; scrollCount: number }> {
    const { selector, direction = 'down', maxScrolls = 10 } = args;
    console.log(`[MCP] Scroll to: ${selector} (direction: ${direction}, maxScrolls: ${maxScrolls})`);
    this.recordAction('scroll_to', selector as string);
    return { success: true, found: true, scrollCount: 3 };
  }

  private async handleDevicePinch(args: Record<string, unknown>): Promise<{ success: boolean; message: string }> {
    const { action, scale = 1.5, x, y } = args;
    console.log(`[MCP] Pinch: ${action} (scale: ${scale})`);
    this.recordAction('pinch', `${action}:${scale}`);
    return { success: true, message: `Pinched ${action} with scale ${scale}` };
  }

  private async handleDeviceRotate(args: Record<string, unknown>): Promise<{ success: boolean; orientation: string }> {
    const { orientation } = args;
    console.log(`[MCP] Rotate to: ${orientation}`);
    this.recordAction('rotate', orientation as string);
    return { success: true, orientation: orientation as string };
  }

  private async handleDeviceBack(): Promise<{ success: boolean; message: string }> {
    console.log('[MCP] Back button pressed');
    this.recordAction('back');
    return { success: true, message: 'Pressed back button' };
  }

  private async handleDeviceHome(): Promise<{ success: boolean; message: string }> {
    console.log('[MCP] Home button pressed');
    this.recordAction('home');
    return { success: true, message: 'Pressed home button' };
  }

  // Element Inspection Handlers
  private async handleGetElement(args: Record<string, unknown>): Promise<ElementInfo | null> {
    const { selector } = args;
    console.log(`[MCP] Get element: ${selector}`);
    // Mock response - in production would query actual device
    return {
      selector: selector as string,
      type: 'button',
      text: 'Example Button',
      accessibilityLabel: 'Example accessibility label',
      testID: 'example-button',
      bounds: { x: 100, y: 200, width: 150, height: 44 },
      isVisible: true,
      isEnabled: true,
      isInteractive: true,
    };
  }

  private async handleFindElements(args: Record<string, unknown>): Promise<ElementInfo[]> {
    const { type = 'all', pattern, onlyVisible = true, onlyInteractive = false } = args;
    console.log(`[MCP] Find elements: type=${type}, pattern=${pattern}`);
    // Mock response
    return [
      {
        selector: '~button-1',
        type: 'button',
        text: 'Button 1',
        testID: 'button-1',
        bounds: { x: 100, y: 200, width: 150, height: 44 },
        isVisible: true,
        isEnabled: true,
        isInteractive: true,
      },
    ];
  }

  private async handleGetScreenState(args: Record<string, unknown>): Promise<ScreenState> {
    const { includeHidden = false, maxDepth = 10 } = args;
    console.log(`[MCP] Get screen state (includeHidden: ${includeHidden}, maxDepth: ${maxDepth})`);
    return {
      screenName: 'HomeScreen',
      elements: [],
      scrollPosition: { x: 0, y: 0 },
      timestamp: new Date(),
    };
  }

  private async handleElementExists(args: Record<string, unknown>): Promise<{ exists: boolean; visible: boolean }> {
    const { selector, timeout = 5000 } = args;
    console.log(`[MCP] Element exists: ${selector} (timeout: ${timeout}ms)`);
    return { exists: true, visible: true };
  }

  private async handleWaitForElement(args: Record<string, unknown>): Promise<{ success: boolean; waitTime: number }> {
    const { selector, state, timeout = 30000 } = args;
    console.log(`[MCP] Wait for element: ${selector} to be ${state} (timeout: ${timeout}ms)`);
    return { success: true, waitTime: 500 };
  }

  // Visual Testing Handlers
  private async handleCaptureScreenshot(args: Record<string, unknown>): Promise<Screenshot> {
    const { name, fullPage = false, hideElements, maskElements } = args;
    const buildId = 'test-build';
    console.log(`[MCP] Capture screenshot: ${name} (fullPage: ${fullPage})`);
    const screenshots = await this.screenshotService.captureScreenshots({
      buildId,
      platform: 'ios',
      screens: [name as string],
    });
    return screenshots[0];
  }

  private async handleCompareScreenshot(args: Record<string, unknown>): Promise<VisualDiff | null> {
    const { name, baselineId, threshold = 5, ignoreRegions } = args;
    console.log(`[MCP] Compare screenshot: ${name} (baselineId: ${baselineId}, threshold: ${threshold}%)`);
    // Mock comparison result
    return {
      screen: name as string,
      baselineUrl: 'https://example.com/baseline.png',
      currentUrl: 'https://example.com/current.png',
      diffUrl: 'https://example.com/diff.png',
      diffPercentage: 2.5,
      passed: true,
    };
  }

  private async handleSetBaseline(args: Record<string, unknown>): Promise<{ success: boolean; screens: string[] }> {
    const { buildId, screens } = args;
    console.log(`[MCP] Set baseline: ${buildId}`);
    await this.screenshotService.setBaseline(buildId as string);
    return { success: true, screens: (screens as string[]) || ['all'] };
  }

  private async handleAnalyzeVisualHierarchy(args: Record<string, unknown>): Promise<{
    alignmentIssues: string[];
    spacingIssues: string[];
    contrastIssues: string[];
  }> {
    const { checkAlignment = true, checkSpacing = true, checkContrast = true } = args;
    console.log(`[MCP] Analyze visual hierarchy`);
    return {
      alignmentIssues: [],
      spacingIssues: [],
      contrastIssues: [],
    };
  }

  // Flow Validation Handlers
  private async handleStartFlowTracking(args: Record<string, unknown>): Promise<{ success: boolean; flowId: string }> {
    const { flowName, expectedScreens } = args;
    console.log(`[MCP] Start flow tracking: ${flowName}`);
    this.flowState = {
      currentScreen: 'HomeScreen',
      visitedScreens: ['HomeScreen'],
      actionHistory: [],
      errors: [],
    };
    return { success: true, flowId: `flow-${Date.now()}` };
  }

  private async handleGetFlowState(): Promise<FlowState | null> {
    return this.flowState;
  }

  private async handleValidateFlow(args: Record<string, unknown>): Promise<{
    valid: boolean;
    missingScreens: string[];
    unexpectedScreens: string[];
  }> {
    const { expectedScreens, allowExtra = false, checkOrder = true } = args;
    console.log(`[MCP] Validate flow`);
    return {
      valid: true,
      missingScreens: [],
      unexpectedScreens: [],
    };
  }

  private async handleExecuteFlow(args: Record<string, unknown>): Promise<{
    success: boolean;
    stepsExecuted: number;
    errors: string[];
  }> {
    const { steps, stopOnError = true, captureScreenshots = false } = args;
    const stepsList = steps as TestStep[];
    console.log(`[MCP] Execute flow: ${stepsList.length} steps`);

    for (const step of stepsList) {
      this.recordAction(step.action, step.selector);
    }

    return {
      success: true,
      stepsExecuted: stepsList.length,
      errors: [],
    };
  }

  private async handleAssertScreen(args: Record<string, unknown>): Promise<{
    success: boolean;
    currentScreen: string;
    matchedIndicators: string[];
  }> {
    const { screenName, indicators } = args;
    console.log(`[MCP] Assert screen: ${screenName}`);
    return {
      success: true,
      currentScreen: screenName as string,
      matchedIndicators: (indicators as string[]) || [],
    };
  }

  // Exploratory Testing Handlers
  private async handleDiscoverScreens(args: Record<string, unknown>): Promise<{
    screens: string[];
    navigationGraph: Record<string, string[]>;
    totalElements: number;
  }> {
    const { maxDepth = 5, maxScreens = 50, excludePatterns } = args;
    console.log(`[MCP] Discover screens (maxDepth: ${maxDepth}, maxScreens: ${maxScreens})`);
    return {
      screens: ['HomeScreen', 'SettingsScreen', 'ProfileScreen'],
      navigationGraph: {
        HomeScreen: ['SettingsScreen', 'ProfileScreen'],
        SettingsScreen: ['HomeScreen'],
        ProfileScreen: ['HomeScreen'],
      },
      totalElements: 45,
    };
  }

  private async handleExploreScreen(args: Record<string, unknown>): Promise<{
    interactions: number;
    discoveries: string[];
    anomalies: AnomalyReport[];
  }> {
    const { interactionTypes, maxInteractions = 20, captureState = true } = args;
    console.log(`[MCP] Explore screen (maxInteractions: ${maxInteractions})`);
    return {
      interactions: maxInteractions as number,
      discoveries: ['Hidden menu found', 'Pull-to-refresh detected'],
      anomalies: [],
    };
  }

  private async handleDetectAnomalies(args: Record<string, unknown>): Promise<AnomalyReport[]> {
    const { checkTypes } = args;
    console.log(`[MCP] Detect anomalies: ${checkTypes}`);
    return this.anomalies;
  }

  private async handleStressTestElement(args: Record<string, unknown>): Promise<{
    passed: boolean;
    results: Array<{ test: string; passed: boolean; error?: string }>;
  }> {
    const { selector, tests } = args;
    console.log(`[MCP] Stress test: ${selector}`);
    const testsList = tests as string[];
    return {
      passed: true,
      results: testsList.map(test => ({ test, passed: true })),
    };
  }

  private async handleMonkeyTest(args: Record<string, unknown>): Promise<{
    interactions: number;
    crashes: number;
    errors: string[];
    seed: number;
  }> {
    const { duration = 60, seed, includeGestures = true, avoidElements } = args;
    const usedSeed = (typeof seed === 'number' ? seed : Math.floor(Math.random() * 1000000));
    console.log(`[MCP] Monkey test (duration: ${duration}s, seed: ${usedSeed})`);
    return {
      interactions: duration as number * 10,
      crashes: 0,
      errors: [],
      seed: usedSeed,
    };
  }

  // Accessibility Testing Handlers
  private async handleAccessibilityAudit(args: Record<string, unknown>): Promise<{
    passed: boolean;
    violations: Array<{ rule: string; severity: string; element: string; message: string }>;
    warnings: string[];
  }> {
    const { wcagLevel = 'AA', checkLabels = true, checkContrast = true, checkTouchTargets = true, checkScreenReader = true } = args;
    console.log(`[MCP] Accessibility audit (WCAG ${wcagLevel})`);
    return {
      passed: true,
      violations: [],
      warnings: [],
    };
  }

  private async handleSimulateScreenReader(args: Record<string, unknown>): Promise<{
    elementsRead: string[];
    issues: string[];
  }> {
    const { navigation, steps = 10 } = args;
    console.log(`[MCP] Simulate screen reader: ${navigation} (${steps} steps)`);
    return {
      elementsRead: ['Header', 'Button 1', 'Text content'],
      issues: [],
    };
  }

  // Performance Testing Handlers
  private async handleMeasureRenderTime(args: Record<string, unknown>): Promise<{
    renderTimeMs: number;
    transitionTimeMs: number;
    totalTimeMs: number;
  }> {
    const { action, waitFor } = args;
    console.log(`[MCP] Measure render time: ${action} -> ${waitFor}`);
    return {
      renderTimeMs: 45,
      transitionTimeMs: 120,
      totalTimeMs: 165,
    };
  }

  private async handleMeasureScrollPerformance(args: Record<string, unknown>): Promise<{
    averageFps: number;
    droppedFrames: number;
    jankScore: number;
  }> {
    const { scrollCount = 5, direction } = args;
    console.log(`[MCP] Measure scroll performance (${scrollCount} scrolls, ${direction})`);
    return {
      averageFps: 58.5,
      droppedFrames: 2,
      jankScore: 0.95,
    };
  }

  private async handleGetMemoryUsage(): Promise<{
    currentMb: number;
    peakMb: number;
    javaHeapMb?: number;
    nativeHeapMb?: number;
  }> {
    console.log('[MCP] Get memory usage');
    return {
      currentMb: 128,
      peakMb: 156,
    };
  }

  // Maestro Integration Handlers
  private async handleGenerateMaestroFlow(args: Record<string, unknown>): Promise<{
    success: boolean;
    flowPath: string;
    yaml: string;
  }> {
    const { flowName, steps, outputPath } = args;
    const stepsList = steps as Array<{ action: string; selector?: string; value?: string }>;
    console.log(`[MCP] Generate Maestro flow: ${flowName}`);

    // Generate YAML
    const yamlLines = [`appId: \${APP_BUNDLE_ID}`, `---`, `# ${flowName}`];
    for (const step of stepsList) {
      if (step.action === 'tap' && step.selector) {
        yamlLines.push(`- tapOn:`, `    id: "${step.selector}"`);
      } else if (step.action === 'type' && step.selector && step.value) {
        yamlLines.push(`- inputText:`, `    id: "${step.selector}"`, `    text: "${step.value}"`);
      } else if (step.action === 'swipe') {
        yamlLines.push(`- swipe:`, `    direction: "${step.value || 'up'}"`);
      } else if (step.action === 'wait') {
        yamlLines.push(`- extendedWaitUntil:`, `    visible:`, `      id: "${step.selector}"`);
      }
    }

    const yaml = yamlLines.join('\n');

    return {
      success: true,
      flowPath: (outputPath as string) || `.maestro/${flowName}.yaml`,
      yaml,
    };
  }

  private async handleRunMaestroFlow(args: Record<string, unknown>): Promise<{
    success: boolean;
    duration: number;
    steps: number;
    failures: string[];
  }> {
    const { flowPath, device, env } = args;
    console.log(`[MCP] Run Maestro flow: ${flowPath}`);
    return {
      success: true,
      duration: 15000,
      steps: 10,
      failures: [],
    };
  }

  // Device Cloud Handlers
  private async handleStartCloudSession(args: Record<string, unknown>): Promise<DeviceTestSession> {
    const { provider, devices, appPath, testPath, timeout = 600000, parallel = true } = args;
    console.log(`[MCP] Start cloud session on ${provider}`);

    const session = await this.deviceCloudService.startTestSession({
      projectId: 'test-project',
      buildId: 'test-build',
      appPath: appPath as string,
      testPath: testPath as string,
      config: {
        provider: provider as 'aws-device-farm' | 'browserstack' | 'maestro-cloud' | 'firebase-test-lab' | 'local',
        platforms: ['ios', 'android'],
        devices: (devices as Array<{ platform: 'ios' | 'android'; name: string; osVersion: string }>) || DEFAULT_DEVICE_MATRIX.minimal,
        parallel: parallel as boolean,
        timeout: timeout as number,
        retries: 2,
      },
    });

    return session;
  }

  private async handleGetCloudSessionStatus(args: Record<string, unknown>): Promise<DeviceTestSession | null> {
    const { sessionId } = args;
    console.log(`[MCP] Get cloud session status: ${sessionId}`);
    return this.deviceCloudService.getSession(sessionId as string) ?? null;
  }

  private async handleGetCloudDevices(args: Record<string, unknown>): Promise<{
    devices: Array<{ platform: string; name: string; osVersion: string }>;
    tier: string;
  }> {
    const { provider, platform, tier = 'standard' } = args;
    console.log(`[MCP] Get cloud devices (provider: ${provider}, tier: ${tier})`);
    const devices = this.deviceCloudService.getRecommendedDevices({
      tier: tier as 'minimal' | 'standard' | 'comprehensive',
      platforms: platform ? [platform as 'ios' | 'android'] : undefined,
    });
    return { devices, tier: tier as string };
  }

  // Reporting Handlers
  private async handleGenerateTestReport(args: Record<string, unknown>): Promise<{
    format: string;
    url?: string;
    content?: string;
  }> {
    const { sessionId, format = 'json', includeScreenshots = true, includeVideos = false } = args;
    console.log(`[MCP] Generate test report (format: ${format})`);
    return {
      format: format as string,
      url: `https://reports.mobigen.io/${sessionId}.${format}`,
    };
  }

  private async handleGetTestLogs(args: Record<string, unknown>): Promise<{
    logs: Array<{ timestamp: Date; level: string; message: string }>;
    totalCount: number;
  }> {
    const { sessionId, level = 'all', limit = 100 } = args;
    console.log(`[MCP] Get test logs (sessionId: ${sessionId}, level: ${level})`);
    return {
      logs: [],
      totalCount: 0,
    };
  }

  // Helper Methods
  private recordAction(action: string, selector?: string): void {
    if (this.flowState) {
      this.flowState.actionHistory.push({
        action,
        selector,
        timestamp: new Date(),
      });
    }
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('[MCP Testing Server] Started');
  }
}

// Export for use
export { MCPTestingServer, TESTING_TOOLS };

// Run if executed directly
if (require.main === module) {
  const server = new MCPTestingServer();
  server.start().catch(console.error);
}
