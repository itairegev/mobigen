/**
 * Type definitions for Maestro E2E tests
 */

export interface MaestroConfig {
  appId: string;
  testDir: string;
  platform: 'ios' | 'android' | 'both';
  cloud?: boolean;
  apiKey?: string;
  timeout?: number;
}

export interface MaestroFlow {
  appId: string;
  name?: string;
  tags?: string[];
  env?: Record<string, string>;
  steps: MaestroStep[];
}

export type MaestroStep =
  | LaunchAppStep
  | TapOnStep
  | AssertVisibleStep
  | AssertNotVisibleStep
  | InputTextStep
  | ScrollStep
  | SwipeStep
  | WaitStep
  | TakeScreenshotStep
  | RunFlowStep
  | BackStep
  | ClearStateStep
  | RepeatStep;

export interface LaunchAppStep {
  launchApp: {
    appId?: string;
    clearState?: boolean;
    clearKeychain?: boolean;
    arguments?: Record<string, string>;
  };
}

export interface TapOnStep {
  tapOn: string | {
    id?: string;
    text?: string;
    index?: number;
    point?: { x: number; y: number };
    retryTapIfNoChange?: boolean;
  };
}

export interface AssertVisibleStep {
  assertVisible: string | {
    id?: string;
    text?: string;
    index?: number;
    enabled?: boolean;
  };
}

export interface AssertNotVisibleStep {
  assertNotVisible: string | {
    id?: string;
    text?: string;
  };
}

export interface InputTextStep {
  inputText: string | {
    id?: string;
    text: string;
  };
}

export interface ScrollStep {
  scroll: {
    direction?: 'up' | 'down' | 'left' | 'right';
    duration?: number;
  };
}

export interface SwipeStep {
  swipe: {
    direction: 'up' | 'down' | 'left' | 'right';
    start?: { x: number | string; y: number | string };
    end?: { x: number | string; y: number | string };
  };
}

export interface WaitStep {
  wait: {
    visible?: string | { id?: string; text?: string };
    notVisible?: string | { id?: string; text?: string };
    timeout?: number;
  };
}

export interface TakeScreenshotStep {
  takeScreenshot: string;
}

export interface RunFlowStep {
  runFlow: string | {
    file: string;
    env?: Record<string, string>;
  };
}

export interface BackStep {
  back: boolean;
}

export interface ClearStateStep {
  clearState: boolean;
}

export interface RepeatStep {
  repeat: {
    times: number;
    commands: MaestroStep[];
  };
}

export interface MaestroTestResult {
  flowName: string;
  passed: boolean;
  duration: number;
  failureReason?: string;
  screenshot?: string;
  video?: string;
  steps: StepResult[];
}

export interface StepResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  screenshot?: string;
}

export interface MaestroRunOptions {
  flows?: string[];
  tags?: string[];
  device?: string;
  parallel?: number;
  retries?: number;
  video?: boolean;
  screenshots?: boolean;
  outputDir?: string;
}
