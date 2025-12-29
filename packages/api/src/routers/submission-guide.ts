import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

const submissionPlatformSchema = z.enum(['ios', 'android', 'both']);

const updateProgressSchema = z.object({
  projectId: z.string().uuid(),
  step: z.string(),
  platform: z.enum(['ios', 'android']).optional(),
});

const updateMetadataSchema = z.object({
  projectId: z.string().uuid(),
  appDescription: z.string().optional(),
  appKeywords: z.array(z.string()).optional(),
  appCategory: z.string().optional(),
  privacyPolicyUrl: z.string().url().optional(),
  supportUrl: z.string().url().optional(),
  marketingUrl: z.string().url().optional(),
});

const updateStatusSchema = z.object({
  projectId: z.string().uuid(),
  platform: z.enum(['ios', 'android']),
  status: z.enum(['not_started', 'in_progress', 'review', 'live', 'rejected']),
  appId: z.string().optional(),
  storeUrl: z.string().url().optional(),
  reviewStatus: z.string().optional(),
  rejectionNotes: z.string().optional(),
});

const storeCredentialsSchema = z.object({
  projectId: z.string().uuid(),
  platform: z.enum(['ios', 'android']),
  credentialType: z.enum([
    'app_store_connect_api_key',
    'google_play_service_account',
    'apple_developer_cert',
  ]),
  credentials: z.record(z.any()), // Will be encrypted
  description: z.string().optional(),
  expiresAt: z.date().optional(),
});

// ============================================================================
// ROUTER
// ============================================================================

export const submissionGuideRouter = router({
  // Get submission checklist for a project
  getChecklist: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        platform: submissionPlatformSchema,
      })
    )
    .query(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      // Generate platform-specific checklist
      const checklist = generateChecklist(input.platform, project);

      // Get existing progress
      const progress = await ctx.prisma.submissionProgress.findUnique({
        where: { projectId: input.projectId },
      });

      return {
        checklist,
        completedSteps: progress?.completedSteps || [],
        currentStep: progress?.currentStep || checklist[0]?.id,
        totalSteps: checklist.length,
        progress: progress,
      };
    }),

  // Get platform-specific instructions
  getInstructions: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        platform: z.enum(['ios', 'android']),
        step: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      // Return detailed step instructions
      return getStepInstructions(input.platform, input.step, project);
    }),

  // Initialize submission progress
  initializeProgress: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        platform: submissionPlatformSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      // Create or update submission progress
      const checklist = generateChecklist(input.platform, project);

      return ctx.prisma.submissionProgress.upsert({
        where: { projectId: input.projectId },
        create: {
          projectId: input.projectId,
          platform: input.platform,
          totalSteps: checklist.length,
          currentStep: checklist[0]?.id,
        },
        update: {
          platform: input.platform,
          totalSteps: checklist.length,
        },
      });
    }),

  // Update checklist progress
  updateProgress: protectedProcedure
    .input(updateProgressSchema)
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      const progress = await ctx.prisma.submissionProgress.findUnique({
        where: { projectId: input.projectId },
      });

      if (!progress) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Submission progress not initialized',
        });
      }

      // Add step to completed steps if not already there
      const completedSteps = progress.completedSteps.includes(input.step)
        ? progress.completedSteps
        : [...progress.completedSteps, input.step];

      return ctx.prisma.submissionProgress.update({
        where: { projectId: input.projectId },
        data: {
          completedSteps,
          currentStep: input.step,
        },
      });
    }),

  // Update submission metadata
  updateMetadata: protectedProcedure
    .input(updateMetadataSchema)
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      const { projectId, ...metadata } = input;

      return ctx.prisma.submissionProgress.upsert({
        where: { projectId },
        create: {
          projectId,
          platform: 'both',
          ...metadata,
        },
        update: metadata,
      });
    }),

  // Update platform-specific submission status
  updateStatus: protectedProcedure
    .input(updateStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      const updateData: any = {};

      if (input.platform === 'ios') {
        updateData.iosStatus = input.status;
        if (input.appId) updateData.iosAppId = input.appId;
        if (input.storeUrl) updateData.iosAppStoreUrl = input.storeUrl;
        if (input.reviewStatus) updateData.iosReviewStatus = input.reviewStatus;
        if (input.rejectionNotes) updateData.iosRejectionNotes = input.rejectionNotes;
        if (input.status === 'review') updateData.iosSubmittedAt = new Date();
        if (input.status === 'live') updateData.iosApprovedAt = new Date();
      } else {
        updateData.androidStatus = input.status;
        if (input.appId) updateData.androidPackageName = input.appId;
        if (input.storeUrl) updateData.androidPlayStoreUrl = input.storeUrl;
        if (input.reviewStatus) updateData.androidReviewStatus = input.reviewStatus;
        if (input.rejectionNotes) updateData.androidRejectionNotes = input.rejectionNotes;
        if (input.status === 'review') updateData.androidSubmittedAt = new Date();
        if (input.status === 'live') updateData.androidApprovedAt = new Date();
      }

      return ctx.prisma.submissionProgress.upsert({
        where: { projectId: input.projectId },
        create: {
          projectId: input.projectId,
          platform: input.platform,
          ...updateData,
        },
        update: updateData,
      });
    }),

  // Get submission progress
  getProgress: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      return ctx.prisma.submissionProgress.findUnique({
        where: { projectId: input.projectId },
      });
    }),

  // Store encrypted credentials (Pro/Enterprise tier only)
  storeCredentials: protectedProcedure
    .input(storeCredentialsSchema)
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      // Check user tier (Pro/Enterprise only)
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.userId },
      });

      if (!user || !['pro', 'enterprise'].includes(user.tier)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Credential storage requires Pro or Enterprise tier',
        });
      }

      // Encrypt credentials using AES-256-GCM
      const { encrypted, iv, tag } = await encryptCredentials(input.credentials);

      return ctx.prisma.storeCredentials.create({
        data: {
          projectId: input.projectId,
          userId: ctx.userId!,
          platform: input.platform,
          credentialType: input.credentialType,
          credentialsEncrypted: encrypted,
          credentialsIv: iv,
          credentialsTag: tag,
          description: input.description,
          expiresAt: input.expiresAt,
        },
      });
    }),

  // Get stored credentials (decrypted)
  getCredentials: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        platform: z.enum(['ios', 'android']),
      })
    )
    .query(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      const credentials = await ctx.prisma.storeCredentials.findMany({
        where: {
          projectId: input.projectId,
          userId: ctx.userId,
          platform: input.platform,
        },
      });

      // Update access tracking
      for (const cred of credentials) {
        await ctx.prisma.storeCredentials.update({
          where: { id: cred.id },
          data: {
            lastAccessedAt: new Date(),
            accessCount: cred.accessCount + 1,
          },
        });
      }

      // Decrypt and return
      return credentials.map((cred) => ({
        id: cred.id,
        credentialType: cred.credentialType,
        description: cred.description,
        expiresAt: cred.expiresAt,
        credentials: decryptCredentials(
          cred.credentialsEncrypted,
          cred.credentialsIv,
          cred.credentialsTag
        ),
      }));
    }),

  // Generate app metadata template
  generateMetadata: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
        include: { user: true },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      // Generate template metadata based on project
      const metadata = generateAppMetadata(project);

      return ctx.prisma.appMetadata.upsert({
        where: { projectId: input.projectId },
        create: {
          projectId: input.projectId,
          ...metadata,
        },
        update: metadata,
      });
    }),

  // Get app metadata
  getMetadata: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      return ctx.prisma.appMetadata.findUnique({
        where: { projectId: input.projectId },
      });
    }),

  // Update app metadata
  updateAppMetadata: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        appName: z.string().optional(),
        appSubtitle: z.string().optional(),
        promotionalText: z.string().optional(),
        shortDescription: z.string().optional(),
        fullDescription: z.string().optional(),
        keywords: z.array(z.string()).optional(),
        category: z.string().optional(),
        privacyPolicyUrl: z.string().url().optional(),
        supportUrl: z.string().url().optional(),
        marketingUrl: z.string().url().optional(),
        supportEmail: z.string().email().optional(),
        supportPhone: z.string().optional(),
        contentRating: z.string().optional(),
        contentWarnings: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      const { projectId, ...data } = input;

      return ctx.prisma.appMetadata.upsert({
        where: { projectId },
        create: {
          projectId,
          appName: data.appName || project.name,
          shortDescription: data.shortDescription || '',
          fullDescription: data.fullDescription || '',
          category: data.category || 'Utilities',
          privacyPolicyUrl: data.privacyPolicyUrl || '',
          supportUrl: data.supportUrl || '',
          supportEmail: data.supportEmail || '',
          keywords: data.keywords || [],
          ...data,
        },
        update: data,
      });
    }),

  // Mark assets as generated
  markAssetsGenerated: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        assetType: z.enum(['icons', 'screenshots', 'metadata']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Project not found' });
      }

      const updateData: any = {};
      if (input.assetType === 'icons') updateData.iconsGenerated = true;
      if (input.assetType === 'screenshots') updateData.screenshotsGenerated = true;
      if (input.assetType === 'metadata') updateData.metadataCompleted = true;

      return ctx.prisma.submissionProgress.upsert({
        where: { projectId: input.projectId },
        create: {
          projectId: input.projectId,
          platform: 'both',
          ...updateData,
        },
        update: updateData,
      });
    }),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  platform: 'ios' | 'android' | 'both';
  required: boolean;
  estimatedTime: string;
  category: string;
}

function generateChecklist(
  platform: string,
  project: any
): ChecklistItem[] {
  const commonSteps: ChecklistItem[] = [
    {
      id: 'prepare-assets',
      title: 'Prepare App Assets',
      description: 'Generate app icons and screenshots in required sizes',
      platform: 'both',
      required: true,
      estimatedTime: '15 minutes',
      category: 'Assets',
    },
    {
      id: 'complete-metadata',
      title: 'Complete App Metadata',
      description: 'Fill in app description, keywords, category, and contact information',
      platform: 'both',
      required: true,
      estimatedTime: '30 minutes',
      category: 'Metadata',
    },
    {
      id: 'privacy-policy',
      title: 'Create Privacy Policy',
      description: 'Create and host a privacy policy (required for app stores)',
      platform: 'both',
      required: true,
      estimatedTime: '1 hour',
      category: 'Legal',
    },
  ];

  const iosSteps: ChecklistItem[] = [
    {
      id: 'apple-developer-account',
      title: 'Create Apple Developer Account',
      description: 'Sign up for Apple Developer Program ($99/year)',
      platform: 'ios',
      required: true,
      estimatedTime: '1 day',
      category: 'Setup',
    },
    {
      id: 'app-store-connect',
      title: 'Set Up App Store Connect',
      description: 'Create your app listing in App Store Connect',
      platform: 'ios',
      required: true,
      estimatedTime: '30 minutes',
      category: 'Setup',
    },
    {
      id: 'ios-certificates',
      title: 'Configure Certificates & Provisioning',
      description: 'Set up distribution certificates and provisioning profiles',
      platform: 'ios',
      required: true,
      estimatedTime: '1 hour',
      category: 'Configuration',
    },
    {
      id: 'ios-build',
      title: 'Create Production Build',
      description: 'Build your app for App Store distribution',
      platform: 'ios',
      required: true,
      estimatedTime: '30 minutes',
      category: 'Build',
    },
    {
      id: 'ios-upload',
      title: 'Upload to App Store Connect',
      description: 'Upload your build using Transporter or Xcode',
      platform: 'ios',
      required: true,
      estimatedTime: '15 minutes',
      category: 'Submission',
    },
    {
      id: 'ios-submit',
      title: 'Submit for Review',
      description: 'Complete the submission form and submit for Apple review',
      platform: 'ios',
      required: true,
      estimatedTime: '30 minutes',
      category: 'Submission',
    },
  ];

  const androidSteps: ChecklistItem[] = [
    {
      id: 'google-play-account',
      title: 'Create Google Play Developer Account',
      description: 'Sign up for Google Play Console ($25 one-time fee)',
      platform: 'android',
      required: true,
      estimatedTime: '1 day',
      category: 'Setup',
    },
    {
      id: 'play-console-setup',
      title: 'Set Up Play Console Listing',
      description: 'Create your app listing in Google Play Console',
      platform: 'android',
      required: true,
      estimatedTime: '30 minutes',
      category: 'Setup',
    },
    {
      id: 'android-keystore',
      title: 'Generate App Signing Key',
      description: 'Create a keystore for signing your Android app',
      platform: 'android',
      required: true,
      estimatedTime: '15 minutes',
      category: 'Configuration',
    },
    {
      id: 'android-build',
      title: 'Create Production Build (AAB)',
      description: 'Build your app as Android App Bundle',
      platform: 'android',
      required: true,
      estimatedTime: '30 minutes',
      category: 'Build',
    },
    {
      id: 'android-upload',
      title: 'Upload to Play Console',
      description: 'Upload your AAB to Play Console',
      platform: 'android',
      required: true,
      estimatedTime: '15 minutes',
      category: 'Submission',
    },
    {
      id: 'android-release',
      title: 'Create Release & Submit',
      description: 'Create a production release and submit for review',
      platform: 'android',
      required: true,
      estimatedTime: '30 minutes',
      category: 'Submission',
    },
  ];

  if (platform === 'ios') {
    return [...commonSteps, ...iosSteps];
  } else if (platform === 'android') {
    return [...commonSteps, ...androidSteps];
  } else {
    return [...commonSteps, ...iosSteps, ...androidSteps];
  }
}

function getStepInstructions(platform: string, step: string, project: any): any {
  // This would return detailed step-by-step instructions
  // For now, return a basic structure
  return {
    step,
    platform,
    title: `Instructions for ${step}`,
    sections: [
      {
        title: 'Overview',
        content: `Detailed instructions for completing ${step}`,
      },
      {
        title: 'Prerequisites',
        content: 'What you need before starting this step',
      },
      {
        title: 'Step-by-Step Guide',
        content: 'Detailed walkthrough with screenshots',
      },
      {
        title: 'Common Issues',
        content: 'Troubleshooting tips',
      },
    ],
    resources: [
      {
        title: 'Official Documentation',
        url: '#',
      },
    ],
  };
}

function generateAppMetadata(project: any): any {
  // Generate template metadata based on project name and template
  return {
    appName: project.name,
    appSubtitle: `A mobile app built with Mobigen`,
    shortDescription: `${project.name} - Mobile App`,
    fullDescription: `Welcome to ${project.name}! This mobile application was built using Mobigen.`,
    keywords: [project.name.toLowerCase(), 'mobile', 'app'],
    category: 'Utilities',
    privacyPolicyUrl: '',
    supportUrl: '',
    supportEmail: project.user?.email || '',
    contentRating: '4+',
    contentWarnings: [],
  };
}

// Encryption helpers (simplified - in production use proper encryption library)
async function encryptCredentials(credentials: any): Promise<{
  encrypted: string;
  iv: string;
  tag: string;
}> {
  const crypto = await import('crypto');
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex');
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(credentials), 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return {
    encrypted: encrypted.toString('hex'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  };
}

function decryptCredentials(
  encrypted: string,
  ivHex: string,
  tagHex: string
): any {
  const crypto = require('crypto');
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted, 'hex')),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString('utf8'));
}
