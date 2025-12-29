import type { PricingTier, LicenseType, Discount } from './types';

/**
 * Standard pricing tiers for templates
 */
export const PRICING_TIERS: Record<string, PricingTier> = {
  free: {
    tier: 'free',
    basePrice: 0,
    currency: 'usd',
    features: [
      'Full template source code',
      'Basic customization',
      'Community support',
      'Single project license',
    ],
    licenseTypes: [
      {
        type: 'single',
        maxProjects: 1,
        maxUsers: 1,
        priceMultiplier: 1,
      },
    ],
  },
  premium: {
    tier: 'premium',
    basePrice: 4900, // $49.00
    currency: 'usd',
    features: [
      'Full template source code',
      'Advanced customization',
      'Priority support',
      'Multiple project licenses available',
      'Regular updates',
      'Premium components',
    ],
    licenseTypes: [
      {
        type: 'single',
        maxProjects: 1,
        maxUsers: 1,
        priceMultiplier: 1,
      },
      {
        type: 'team',
        maxProjects: 5,
        maxUsers: 5,
        priceMultiplier: 3,
      },
      {
        type: 'enterprise',
        maxProjects: -1, // unlimited
        maxUsers: -1,
        priceMultiplier: 8,
      },
    ],
  },
  enterprise: {
    tier: 'enterprise',
    basePrice: 19900, // $199.00
    currency: 'usd',
    features: [
      'Full template source code',
      'White-label support',
      'Dedicated support',
      'Custom modifications',
      'Unlimited projects',
      'Source code access',
      'Priority updates',
    ],
    licenseTypes: [
      {
        type: 'enterprise',
        maxProjects: -1,
        maxUsers: -1,
        priceMultiplier: 1,
      },
    ],
  },
};

/**
 * Calculate final price for a template purchase
 */
export function calculatePrice(
  basePrice: number,
  licenseType: 'single' | 'team' | 'enterprise',
  discount?: Discount
): {
  basePrice: number;
  licenseMultiplier: number;
  subtotal: number;
  discountAmount: number;
  finalPrice: number;
} {
  // Get license multiplier
  const tier = Object.values(PRICING_TIERS).find((t) =>
    t.licenseTypes.some((lt) => lt.type === licenseType)
  );

  const licenseConfig = tier?.licenseTypes.find((lt) => lt.type === licenseType);
  const licenseMultiplier = licenseConfig?.priceMultiplier || 1;

  const subtotal = basePrice * licenseMultiplier;

  // Apply discount if valid
  let discountAmount = 0;
  if (discount && isDiscountValid(discount)) {
    discountAmount = Math.floor((subtotal * discount.percent) / 100);
  }

  const finalPrice = Math.max(0, subtotal - discountAmount);

  return {
    basePrice,
    licenseMultiplier,
    subtotal,
    discountAmount,
    finalPrice,
  };
}

/**
 * Check if a discount is currently valid
 */
export function isDiscountValid(discount: Discount): boolean {
  const now = new Date();

  // Check date range
  if (now < discount.validFrom || now > discount.validUntil) {
    return false;
  }

  // Check usage limit
  if (discount.maxUses && discount.currentUses >= discount.maxUses) {
    return false;
  }

  return true;
}

/**
 * Calculate revenue sharing for a template sale
 */
export function calculateRevenueShare(
  saleAmount: number,
  publisherSharePercent: number = 70 // Default: 70% to publisher, 30% to Mobigen
): {
  total: number;
  publisherShare: number;
  platformShare: number;
  publisherPercent: number;
  platformPercent: number;
} {
  const platformPercent = 100 - publisherSharePercent;
  const publisherShare = Math.floor((saleAmount * publisherSharePercent) / 100);
  const platformShare = saleAmount - publisherShare;

  return {
    total: saleAmount,
    publisherShare,
    platformShare,
    publisherPercent: publisherSharePercent,
    platformPercent,
  };
}

/**
 * Generate promotional discount
 */
export function createPromotion(
  templateId: string,
  percent: number,
  durationDays: number,
  maxUses?: number,
  code?: string
): Omit<Discount, 'id' | 'currentUses'> {
  const now = new Date();
  const validUntil = new Date(now);
  validUntil.setDate(validUntil.getDate() + durationDays);

  return {
    templateId,
    percent: Math.min(100, Math.max(0, percent)),
    validFrom: now,
    validUntil,
    maxUses,
    code,
  };
}

/**
 * Suggested pricing based on template complexity and features
 */
export function suggestPricing(templateConfig: {
  capabilities: string[];
  backendFeatures: string[];
  customizableAreas: number;
  testCoverage: number;
  qualityScore: number;
}): {
  suggestedTier: 'free' | 'premium' | 'enterprise';
  suggestedPrice: number;
  reasoning: string[];
} {
  const reasoning: string[] = [];
  let score = 0;

  // Factor 1: Number of capabilities
  if (templateConfig.capabilities.length >= 10) {
    score += 3;
    reasoning.push('High number of capabilities');
  } else if (templateConfig.capabilities.length >= 5) {
    score += 2;
    reasoning.push('Moderate number of capabilities');
  } else {
    score += 1;
  }

  // Factor 2: Backend features
  if (templateConfig.backendFeatures.length >= 5) {
    score += 3;
    reasoning.push('Complex backend integration');
  } else if (templateConfig.backendFeatures.length > 0) {
    score += 2;
    reasoning.push('Basic backend features');
  }

  // Factor 3: Customization options
  if (templateConfig.customizableAreas >= 10) {
    score += 2;
    reasoning.push('Highly customizable');
  } else if (templateConfig.customizableAreas >= 5) {
    score += 1;
  }

  // Factor 4: Quality score
  if (templateConfig.qualityScore >= 90) {
    score += 3;
    reasoning.push('Excellent quality score');
  } else if (templateConfig.qualityScore >= 75) {
    score += 2;
    reasoning.push('Good quality score');
  } else if (templateConfig.qualityScore >= 60) {
    score += 1;
  }

  // Factor 5: Test coverage
  if (templateConfig.testCoverage >= 80) {
    score += 2;
    reasoning.push('High test coverage');
  } else if (templateConfig.testCoverage >= 60) {
    score += 1;
  }

  // Determine tier and price based on score
  let suggestedTier: 'free' | 'premium' | 'enterprise';
  let suggestedPrice: number;

  if (score <= 4) {
    suggestedTier = 'free';
    suggestedPrice = 0;
    reasoning.push('Basic template suitable for free tier');
  } else if (score <= 9) {
    suggestedTier = 'premium';
    suggestedPrice = 4900; // $49
    reasoning.push('Feature-rich template suitable for premium tier');
  } else {
    suggestedTier = 'enterprise';
    suggestedPrice = 19900; // $199
    reasoning.push('Advanced template with enterprise-grade features');
  }

  return {
    suggestedTier,
    suggestedPrice,
    reasoning,
  };
}
