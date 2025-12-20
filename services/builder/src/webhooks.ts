import { Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '@mobigen/db';
import { getBuildService } from './build-service';
import { getArtifactStorage } from './artifact-storage';

interface EASWebhookPayload {
  id: string;
  accountName: string;
  projectName: string;
  buildId: string;
  platform: 'ios' | 'android';
  status: 'in-queue' | 'in-progress' | 'finished' | 'errored' | 'canceled';
  artifacts?: {
    buildUrl?: string;
    logsUrl?: string;
  };
  error?: {
    message: string;
    errorCode?: string;
  };
  createdAt: string;
  completedAt?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Verify webhook signature from EAS
 */
function verifyWebhookSignature(
  payload: string,
  signature: string | undefined,
  secret: string
): boolean {
  if (!signature) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${expectedSignature}`)
  );
}

/**
 * Handle EAS build webhook
 */
export async function handleEASWebhook(req: Request, res: Response): Promise<void> {
  const webhookSecret = process.env.EAS_WEBHOOK_SECRET;

  // Verify signature if secret is configured
  if (webhookSecret) {
    const signature = req.headers['expo-signature'] as string;
    const payload = JSON.stringify(req.body);

    if (!verifyWebhookSignature(payload, signature, webhookSecret)) {
      console.error('Invalid webhook signature');
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }
  }

  try {
    const event = req.body as EASWebhookPayload;
    console.log(`Received EAS webhook: ${event.status} for build ${event.buildId}`);

    // Find our build record by EAS build ID
    const build = await prisma.build.findFirst({
      where: { easBuildId: event.buildId },
    });

    if (!build) {
      console.warn(`Build not found for EAS build ID: ${event.buildId}`);
      res.status(200).json({ message: 'Build not found, ignoring' });
      return;
    }

    const buildService = getBuildService();

    // Update build status
    await buildService.updateBuildFromEAS(
      build.id,
      event.status,
      event.artifacts
    );

    // Handle completed builds
    if (event.status === 'finished' && event.artifacts?.buildUrl) {
      // Download and store artifact
      try {
        const artifactStorage = getArtifactStorage();
        await artifactStorage.downloadAndStore(
          build.id,
          event.artifacts.buildUrl,
          build.platform as 'ios' | 'android'
        );
      } catch (error) {
        console.error('Failed to store artifact:', error);
      }
    }

    // Handle errors
    if (event.status === 'errored' && event.error) {
      await prisma.build.update({
        where: { id: build.id },
        data: {
          errorSummary: event.error.message,
        },
      });
    }

    // Store logs if available
    if (event.artifacts?.logsUrl) {
      try {
        const artifactStorage = getArtifactStorage();
        await artifactStorage.storeLogs(build.id, event.artifacts.logsUrl);
      } catch (error) {
        console.error('Failed to store logs:', error);
      }
    }

    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Register webhook routes
 */
export function registerWebhookRoutes(app: import('express').Application): void {
  // EAS build status webhook
  app.post('/webhooks/eas', handleEASWebhook);

  // Health check for webhooks
  app.get('/webhooks/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'builder-webhooks',
      timestamp: new Date().toISOString(),
    });
  });
}
