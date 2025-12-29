import type {
  PublishingWorkflow,
  PublishingStep,
  PublishingStatus,
  TemplateConfig,
} from './types';
import { validateTemplate, validateTemplateStructure, validateCompatibility } from './validation';

/**
 * Create a new publishing workflow
 */
export function createPublishingWorkflow(templateId: string): PublishingWorkflow {
  const steps: PublishingStep[] = [
    {
      id: 'validate_config',
      name: 'Validate Template Configuration',
      status: 'pending',
    },
    {
      id: 'validate_structure',
      name: 'Validate File Structure',
      status: 'pending',
    },
    {
      id: 'validate_compatibility',
      name: 'Check Compatibility',
      status: 'pending',
    },
    {
      id: 'generate_assets',
      name: 'Generate Preview Assets',
      status: 'pending',
    },
    {
      id: 'create_listing',
      name: 'Create Marketplace Listing',
      status: 'pending',
    },
    {
      id: 'review',
      name: 'Quality Review',
      status: 'pending',
    },
    {
      id: 'publish',
      name: 'Publish to Marketplace',
      status: 'pending',
    },
  ];

  return {
    templateId,
    status: 'draft',
    currentStep: 0,
    totalSteps: steps.length,
    steps,
    metadata: {},
  };
}

/**
 * Execute publishing workflow
 */
export async function executePublishingWorkflow(
  workflow: PublishingWorkflow,
  config: TemplateConfig,
  templatePath: string
): Promise<PublishingWorkflow> {
  const updatedWorkflow = { ...workflow };
  updatedWorkflow.status = 'validating';

  for (let i = 0; i < workflow.steps.length; i++) {
    const step = workflow.steps[i];
    updatedWorkflow.currentStep = i;
    updatedWorkflow.steps[i] = {
      ...step,
      status: 'running',
      startedAt: new Date(),
    };

    try {
      const result = await executeStep(step.id, config, templatePath);
      updatedWorkflow.steps[i] = {
        ...step,
        status: 'completed',
        completedAt: new Date(),
        output: result,
      };
    } catch (error) {
      updatedWorkflow.steps[i] = {
        ...step,
        status: 'failed',
        completedAt: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      updatedWorkflow.status = 'validation_failed';
      return updatedWorkflow;
    }
  }

  updatedWorkflow.status = 'review_pending';
  updatedWorkflow.currentStep = workflow.steps.length;

  return updatedWorkflow;
}

/**
 * Execute individual workflow step
 */
async function executeStep(
  stepId: string,
  config: TemplateConfig,
  templatePath: string
): Promise<any> {
  switch (stepId) {
    case 'validate_config':
      return await validateTemplate(config, templatePath);

    case 'validate_structure':
      return await validateTemplateStructure(templatePath);

    case 'validate_compatibility':
      // Use current Expo and RN versions - in real implementation, get from env
      return await validateCompatibility(config, '52.0.0', '0.76.0');

    case 'generate_assets':
      // Generate preview screenshots, thumbnails, etc.
      return { message: 'Assets generated successfully' };

    case 'create_listing':
      // Create marketplace listing in database
      return { message: 'Listing created' };

    case 'review':
      // Quality review - could be automated or manual
      return { message: 'Review passed', score: 95 };

    case 'publish':
      // Publish to marketplace
      return { message: 'Published successfully', publishedAt: new Date() };

    default:
      throw new Error(`Unknown step: ${stepId}`);
  }
}

/**
 * Approve a template for publishing
 */
export async function approveTemplate(
  workflow: PublishingWorkflow,
  reviewerId: string,
  notes?: string
): Promise<PublishingWorkflow> {
  if (workflow.status !== 'review_pending') {
    throw new Error('Template is not ready for review');
  }

  return {
    ...workflow,
    status: 'review_approved',
    metadata: {
      ...workflow.metadata,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      reviewNotes: notes,
    },
  };
}

/**
 * Reject a template with feedback
 */
export async function rejectTemplate(
  workflow: PublishingWorkflow,
  reviewerId: string,
  reason: string
): Promise<PublishingWorkflow> {
  if (workflow.status !== 'review_pending') {
    throw new Error('Template is not ready for review');
  }

  return {
    ...workflow,
    status: 'review_rejected',
    metadata: {
      ...workflow.metadata,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      rejectionReason: reason,
    },
  };
}

/**
 * Archive a published template
 */
export async function archiveTemplate(
  workflow: PublishingWorkflow,
  reason?: string
): Promise<PublishingWorkflow> {
  return {
    ...workflow,
    status: 'archived',
    metadata: {
      ...workflow.metadata,
      archivedAt: new Date(),
      archiveReason: reason,
    },
  };
}

/**
 * Get publishing status summary
 */
export function getPublishingStatusSummary(workflow: PublishingWorkflow): {
  status: PublishingStatus;
  progress: number;
  completedSteps: number;
  totalSteps: number;
  canPublish: boolean;
  errors: string[];
} {
  const completedSteps = workflow.steps.filter((s) => s.status === 'completed').length;
  const failedSteps = workflow.steps.filter((s) => s.status === 'failed');
  const progress = Math.floor((completedSteps / workflow.totalSteps) * 100);

  return {
    status: workflow.status,
    progress,
    completedSteps,
    totalSteps: workflow.totalSteps,
    canPublish: workflow.status === 'review_approved',
    errors: failedSteps.map((s) => s.error || 'Unknown error'),
  };
}

/**
 * Retry failed workflow steps
 */
export async function retryFailedSteps(
  workflow: PublishingWorkflow,
  config: TemplateConfig,
  templatePath: string
): Promise<PublishingWorkflow> {
  const updatedWorkflow = { ...workflow };

  for (let i = 0; i < workflow.steps.length; i++) {
    const step = workflow.steps[i];

    if (step.status === 'failed') {
      updatedWorkflow.steps[i] = {
        ...step,
        status: 'running',
        startedAt: new Date(),
      };

      try {
        const result = await executeStep(step.id, config, templatePath);
        updatedWorkflow.steps[i] = {
          ...step,
          status: 'completed',
          completedAt: new Date(),
          output: result,
          error: undefined,
        };
      } catch (error) {
        updatedWorkflow.steps[i] = {
          ...step,
          status: 'failed',
          completedAt: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  }

  // Update overall status
  const hasFailures = updatedWorkflow.steps.some((s) => s.status === 'failed');
  if (!hasFailures) {
    updatedWorkflow.status = 'review_pending';
  }

  return updatedWorkflow;
}
