/**
 * Maestro E2E Test Generator
 *
 * Generates Maestro flow files from template configurations
 */

import * as yaml from 'yaml';
import type {
  MaestroFlow,
  MaestroStep,
  MaestroConfig,
} from './types';

export interface ScreenConfig {
  name: string;
  route: string;
  testId: string;
  requiredElements: string[];
  interactions?: InteractionConfig[];
}

export interface InteractionConfig {
  type: 'tap' | 'input' | 'scroll';
  targetId: string;
  value?: string;
  expectedResult?: string;
}

export interface TemplateE2EConfig {
  templateId: string;
  appId: string;
  screens: ScreenConfig[];
  criticalPaths: CriticalPath[];
}

export interface CriticalPath {
  name: string;
  description: string;
  tags: string[];
  steps: PathStep[];
}

export interface PathStep {
  screen: string;
  action: 'navigate' | 'tap' | 'input' | 'assert' | 'scroll';
  target?: string;
  value?: string;
  expectedText?: string;
}

/**
 * Generate Maestro YAML flow from configuration
 */
export function generateMaestroFlow(
  config: TemplateE2EConfig,
  path: CriticalPath
): string {
  const flow: MaestroFlow = {
    appId: config.appId,
    name: path.name,
    tags: path.tags,
    steps: [],
  };

  // Add launch step
  flow.steps.push({
    launchApp: {
      clearState: true,
    },
  });

  // Convert path steps to Maestro steps
  for (const step of path.steps) {
    const maestroSteps = convertPathStepToMaestro(step, config);
    flow.steps.push(...maestroSteps);
  }

  // Generate YAML with proper formatting
  const yamlContent = generateYamlContent(flow);
  return yamlContent;
}

/**
 * Convert a path step to Maestro steps
 */
function convertPathStepToMaestro(
  step: PathStep,
  config: TemplateE2EConfig
): MaestroStep[] {
  const steps: MaestroStep[] = [];

  switch (step.action) {
    case 'navigate':
      // Navigate by tapping on navigation element
      if (step.target) {
        steps.push({
          tapOn: { id: step.target },
        });
      }
      break;

    case 'tap':
      steps.push({
        tapOn: step.target ? { id: step.target } : (step.expectedText || ''),
      });
      break;

    case 'input':
      if (step.target && step.value) {
        steps.push({
          tapOn: { id: step.target },
        });
        steps.push({
          inputText: step.value,
        });
      }
      break;

    case 'assert':
      if (step.expectedText) {
        steps.push({
          assertVisible: step.expectedText,
        });
      } else if (step.target) {
        steps.push({
          assertVisible: { id: step.target },
        });
      }
      break;

    case 'scroll':
      steps.push({
        scroll: {
          direction: 'down',
        },
      });
      break;
  }

  return steps;
}

/**
 * Generate proper YAML content with Maestro-specific formatting
 */
function generateYamlContent(flow: MaestroFlow): string {
  const lines: string[] = [];

  // Header
  lines.push(`appId: ${flow.appId}`);
  if (flow.name) {
    lines.push(`name: ${flow.name}`);
  }
  if (flow.tags && flow.tags.length > 0) {
    lines.push('tags:');
    for (const tag of flow.tags) {
      lines.push(`  - ${tag}`);
    }
  }
  if (flow.env && Object.keys(flow.env).length > 0) {
    lines.push('env:');
    for (const [key, value] of Object.entries(flow.env)) {
      lines.push(`  ${key}: ${value}`);
    }
  }

  // Separator
  lines.push('---');

  // Steps
  for (const step of flow.steps) {
    lines.push(formatMaestroStep(step));
  }

  return lines.join('\n');
}

/**
 * Format a single Maestro step to YAML
 */
function formatMaestroStep(step: MaestroStep): string {
  if ('launchApp' in step) {
    const opts: string[] = [];
    if (step.launchApp.clearState) {
      opts.push('clearState: true');
    }
    if (step.launchApp.clearKeychain) {
      opts.push('clearKeychain: true');
    }
    if (opts.length === 0) {
      return '- launchApp';
    }
    return `- launchApp:\n    ${opts.join('\n    ')}`;
  }

  if ('tapOn' in step) {
    if (typeof step.tapOn === 'string') {
      return `- tapOn: "${step.tapOn}"`;
    }
    if (step.tapOn.id) {
      return `- tapOn:\n    id: "${step.tapOn.id}"`;
    }
    if (step.tapOn.text) {
      return `- tapOn:\n    text: "${step.tapOn.text}"`;
    }
    return '- tapOn: ""';
  }

  if ('assertVisible' in step) {
    if (typeof step.assertVisible === 'string') {
      return `- assertVisible: "${step.assertVisible}"`;
    }
    if (step.assertVisible.id) {
      return `- assertVisible:\n    id: "${step.assertVisible.id}"`;
    }
    if (step.assertVisible.text) {
      return `- assertVisible:\n    text: "${step.assertVisible.text}"`;
    }
    return '- assertVisible: ""';
  }

  if ('assertNotVisible' in step) {
    if (typeof step.assertNotVisible === 'string') {
      return `- assertNotVisible: "${step.assertNotVisible}"`;
    }
    if (step.assertNotVisible.id) {
      return `- assertNotVisible:\n    id: "${step.assertNotVisible.id}"`;
    }
    return '- assertNotVisible: ""';
  }

  if ('inputText' in step) {
    if (typeof step.inputText === 'string') {
      return `- inputText: "${step.inputText}"`;
    }
    return `- inputText:\n    id: "${step.inputText.id}"\n    text: "${step.inputText.text}"`;
  }

  if ('scroll' in step) {
    return `- scroll:\n    direction: ${step.scroll.direction || 'down'}`;
  }

  if ('swipe' in step) {
    return `- swipe:\n    direction: ${step.swipe.direction}`;
  }

  if ('wait' in step) {
    if (step.wait.visible) {
      if (typeof step.wait.visible === 'string') {
        return `- wait:\n    visible: "${step.wait.visible}"`;
      }
      return `- wait:\n    visible:\n      id: "${step.wait.visible.id}"`;
    }
    return '- wait: {}';
  }

  if ('takeScreenshot' in step) {
    return `- takeScreenshot: ${step.takeScreenshot}`;
  }

  if ('back' in step) {
    return '- back';
  }

  if ('clearState' in step) {
    return '- clearState';
  }

  return '# Unknown step';
}

/**
 * Generate navigation test for all screens
 */
export function generateNavigationTest(
  config: TemplateE2EConfig
): string {
  const flow: MaestroFlow = {
    appId: config.appId,
    name: 'Navigation Test',
    tags: ['smoke', 'navigation'],
    steps: [
      { launchApp: { clearState: true } },
    ],
  };

  // Add steps to navigate to each screen and verify it loads
  for (const screen of config.screens) {
    // Tap navigation element
    flow.steps.push({
      tapOn: { id: screen.testId },
    });

    // Assert screen loaded
    for (const element of screen.requiredElements) {
      flow.steps.push({
        assertVisible: { id: element },
      });
    }
  }

  return generateYamlContent(flow);
}

/**
 * Generate smoke test for a screen
 */
export function generateScreenSmokeTest(
  appId: string,
  screen: ScreenConfig
): string {
  const flow: MaestroFlow = {
    appId,
    name: `${screen.name} Smoke Test`,
    tags: ['smoke', screen.name.toLowerCase().replace(/\s+/g, '-')],
    steps: [
      { launchApp: { clearState: true } },
      { tapOn: { id: screen.testId } },
    ],
  };

  // Assert all required elements are visible
  for (const element of screen.requiredElements) {
    flow.steps.push({
      assertVisible: { id: element },
    });
  }

  // Add any interactions
  if (screen.interactions) {
    for (const interaction of screen.interactions) {
      switch (interaction.type) {
        case 'tap':
          flow.steps.push({ tapOn: { id: interaction.targetId } });
          break;
        case 'input':
          flow.steps.push({ tapOn: { id: interaction.targetId } });
          if (interaction.value) {
            flow.steps.push({ inputText: interaction.value });
          }
          break;
        case 'scroll':
          flow.steps.push({ scroll: { direction: 'down' } });
          break;
      }

      if (interaction.expectedResult) {
        flow.steps.push({ assertVisible: interaction.expectedResult });
      }
    }
  }

  return generateYamlContent(flow);
}
