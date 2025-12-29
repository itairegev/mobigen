import { z } from 'zod';

// ============================================================================
// TEMPLATE TYPES
// ============================================================================

export const TemplateConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  version: z.string(),

  // AI context for code generation
  aiDescription: z.string(),
  keywords: z.array(z.string()),
  capabilities: z.array(z.string()),

  // Customization points
  customizableAreas: z.array(z.object({
    id: z.string(),
    path: z.string(),
    type: z.enum(['screen', 'component', 'config', 'style']),
    description: z.string(),
    aiInstructions: z.string(),
    constraints: z.array(z.string()),
  })),

  // Dependencies
  requiredDependencies: z.array(z.string()),
  optionalDependencies: z.array(z.object({
    name: z.string(),
    reason: z.string(),
    defaultEnabled: z.boolean(),
  })),

  // Backend requirements
  backendFeatures: z.array(z.string()),

  // Testing
  testSuites: z.array(z.string()),
  e2eFlows: z.array(z.object({
    name: z.string(),
    description: z.string(),
    steps: z.array(z.string()),
  })),

  // Compatibility
  minExpoVersion: z.string().optional(),
  minRNVersion: z.string().optional(),
  platforms: z.array(z.enum(['ios', 'android', 'web'])),
});

export type TemplateConfig = z.infer<typeof TemplateConfigSchema>;

// ============================================================================
// MARKETPLACE LISTING TYPES
// ============================================================================

export interface TemplateListingInput {
  templateId: string;
  name: string;
  slug: string;
  categoryId: string;
  shortDescription: string;
  fullDescription: string;
  features: string[];
  keywords: string[];
  tags: string[];
  tier: 'free' | 'premium' | 'enterprise';
  price: number; // in cents
  currency: string;
  publisherId: string;
  thumbnailUrl?: string;
  previewImages?: string[];
  demoUrl?: string;
  videoUrl?: string;
}

export interface TemplateVersion {
  version: string;
  releaseNotes: string;
  breaking: boolean;
  deprecated?: string[];
  added?: string[];
  fixed?: string[];
  changed?: string[];
}

// ============================================================================
// PRICING TYPES
// ============================================================================

export interface PricingTier {
  tier: 'free' | 'premium' | 'enterprise';
  basePrice: number;
  currency: string;
  features: string[];
  licenseTypes: LicenseType[];
}

export interface LicenseType {
  type: 'single' | 'team' | 'enterprise';
  maxProjects: number;
  maxUsers: number;
  priceMultiplier: number;
}

export interface Discount {
  id: string;
  templateId: string;
  percent: number;
  validFrom: Date;
  validUntil: Date;
  maxUses?: number;
  currentUses: number;
  code?: string;
}

// ============================================================================
// REVENUE SHARING TYPES
// ============================================================================

export interface RevenueShare {
  templateId: string;
  publisherId: string;
  platformPercent: number; // Mobigen's cut
  publisherPercent: number; // Publisher's cut
  totalRevenue: number;
  platformRevenue: number;
  publisherRevenue: number;
  payoutStatus: 'pending' | 'processing' | 'paid';
  payoutDate?: Date;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface TemplateValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number; // 0-100
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

// ============================================================================
// PUBLISHING WORKFLOW TYPES
// ============================================================================

export type PublishingStatus =
  | 'draft'
  | 'validating'
  | 'validation_failed'
  | 'review_pending'
  | 'review_approved'
  | 'review_rejected'
  | 'publishing'
  | 'published'
  | 'archived';

export interface PublishingWorkflow {
  templateId: string;
  status: PublishingStatus;
  currentStep: number;
  totalSteps: number;
  steps: PublishingStep[];
  metadata: Record<string, any>;
}

export interface PublishingStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  output?: any;
}
