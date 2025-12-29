/**
 * Metadata Service
 *
 * Generates and validates app metadata for store submissions
 */

import type { AppMetadata } from './types';

// ============================================================================
// APP CATEGORIES
// ============================================================================

export const IOS_CATEGORIES = [
  'Books',
  'Business',
  'Developer Tools',
  'Education',
  'Entertainment',
  'Finance',
  'Food & Drink',
  'Games',
  'Graphics & Design',
  'Health & Fitness',
  'Lifestyle',
  'Magazines & Newspapers',
  'Medical',
  'Music',
  'Navigation',
  'News',
  'Photo & Video',
  'Productivity',
  'Reference',
  'Shopping',
  'Social Networking',
  'Sports',
  'Travel',
  'Utilities',
  'Weather',
] as const;

export const ANDROID_CATEGORIES = [
  'Art & Design',
  'Auto & Vehicles',
  'Beauty',
  'Books & Reference',
  'Business',
  'Comics',
  'Communication',
  'Dating',
  'Education',
  'Entertainment',
  'Events',
  'Finance',
  'Food & Drink',
  'Health & Fitness',
  'House & Home',
  'Libraries & Demo',
  'Lifestyle',
  'Maps & Navigation',
  'Medical',
  'Music & Audio',
  'News & Magazines',
  'Parenting',
  'Personalization',
  'Photography',
  'Productivity',
  'Shopping',
  'Social',
  'Sports',
  'Tools',
  'Travel & Local',
  'Video Players & Editors',
  'Weather',
] as const;

// ============================================================================
// CONTENT RATINGS
// ============================================================================

export const IOS_CONTENT_RATINGS = ['4+', '9+', '12+', '17+'] as const;

export const ANDROID_CONTENT_RATINGS = [
  'Everyone',
  'Everyone 10+',
  'Teen',
  'Mature 17+',
  'Adults only 18+',
] as const;

// ============================================================================
// METADATA SERVICE
// ============================================================================

export class MetadataService {
  /**
   * Generate default metadata template based on project info
   */
  generateTemplate(projectInfo: {
    name: string;
    description?: string;
    category?: string;
    userEmail?: string;
  }): AppMetadata {
    const appName = projectInfo.name || 'My App';
    const category = projectInfo.category || 'Utilities';

    return {
      appName,
      appSubtitle: `Powered by ${appName}`,
      promotionalText: `Experience the power of ${appName} on your mobile device`,
      shortDescription: projectInfo.description || `${appName} - Mobile Application`,
      fullDescription:
        projectInfo.description ||
        `Welcome to ${appName}!\n\nThis mobile application provides a seamless experience for [describe your app's main features here].\n\nKey Features:\n- Feature 1\n- Feature 2\n- Feature 3\n\nDownload now and start using ${appName} today!`,
      keywords: [
        appName.toLowerCase(),
        'mobile',
        'app',
        category.toLowerCase().replace(/\s+/g, '-'),
      ],
      category,
      privacyPolicyUrl: '',
      supportUrl: '',
      supportEmail: projectInfo.userEmail || '',
      contentRating: '4+',
      contentWarnings: [],
    };
  }

  /**
   * Validate metadata for completeness and requirements
   */
  validateMetadata(
    metadata: Partial<AppMetadata>,
    platform: 'ios' | 'android'
  ): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!metadata.appName || metadata.appName.trim() === '') {
      errors.push('App name is required');
    } else if (metadata.appName.length > 30) {
      errors.push('App name must be 30 characters or less');
    }

    if (!metadata.shortDescription || metadata.shortDescription.trim() === '') {
      errors.push('Short description is required');
    } else if (platform === 'android' && metadata.shortDescription.length > 80) {
      errors.push('Short description must be 80 characters or less for Android');
    }

    if (!metadata.fullDescription || metadata.fullDescription.trim() === '') {
      errors.push('Full description is required');
    } else if (metadata.fullDescription.length > 4000) {
      errors.push('Full description must be 4000 characters or less');
    }

    if (!metadata.category) {
      errors.push('Category is required');
    } else {
      const validCategories =
        platform === 'ios' ? IOS_CATEGORIES : ANDROID_CATEGORIES;
      if (!validCategories.includes(metadata.category as any)) {
        errors.push(`Invalid category for ${platform.toUpperCase()}`);
      }
    }

    if (!metadata.privacyPolicyUrl || !this.isValidUrl(metadata.privacyPolicyUrl)) {
      errors.push('Valid privacy policy URL is required');
    }

    if (!metadata.supportUrl || !this.isValidUrl(metadata.supportUrl)) {
      errors.push('Valid support URL is required');
    }

    if (!metadata.supportEmail || !this.isValidEmail(metadata.supportEmail)) {
      errors.push('Valid support email is required');
    }

    // Keywords
    if (!metadata.keywords || metadata.keywords.length === 0) {
      warnings.push('No keywords provided - consider adding keywords for better discoverability');
    } else {
      if (platform === 'ios' && metadata.keywords.length > 100) {
        errors.push('iOS allows maximum 100 keywords');
      }

      const keywordString = metadata.keywords.join(',');
      if (platform === 'ios' && keywordString.length > 100) {
        errors.push('iOS keyword string must be 100 characters or less');
      }
    }

    // Content rating
    if (metadata.contentRating) {
      const validRatings: readonly string[] =
        platform === 'ios' ? IOS_CONTENT_RATINGS : ANDROID_CONTENT_RATINGS;
      if (!validRatings.includes(metadata.contentRating)) {
        errors.push(`Invalid content rating for ${platform.toUpperCase()}`);
      }
    }

    // Subtitle (iOS only)
    if (platform === 'ios' && metadata.appSubtitle && metadata.appSubtitle.length > 30) {
      errors.push('iOS app subtitle must be 30 characters or less');
    }

    // Promotional text (iOS only)
    if (
      platform === 'ios' &&
      metadata.promotionalText &&
      metadata.promotionalText.length > 170
    ) {
      warnings.push('iOS promotional text should be 170 characters or less');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get metadata field requirements and guidelines
   */
  getFieldRequirements(
    field: keyof AppMetadata,
    platform: 'ios' | 'android'
  ): {
    required: boolean;
    maxLength?: number;
    minLength?: number;
    guidelines: string;
  } {
    const requirements: Record<
      string,
      Record<string, { required: boolean; maxLength?: number; guidelines: string }>
    > = {
      appName: {
        ios: {
          required: true,
          maxLength: 30,
          guidelines:
            "Your app's name as it will appear on the App Store. Keep it concise and memorable.",
        },
        android: {
          required: true,
          maxLength: 30,
          guidelines: 'The name of your app as it will appear on Google Play.',
        },
      },
      appSubtitle: {
        ios: {
          required: false,
          maxLength: 30,
          guidelines:
            'A brief description of your app that appears below the name on the App Store.',
        },
        android: {
          required: false,
          guidelines: 'Not used on Google Play.',
        },
      },
      promotionalText: {
        ios: {
          required: false,
          maxLength: 170,
          guidelines:
            "Promotional text appears at the top of your app's description and can be updated without submitting a new version.",
        },
        android: {
          required: false,
          guidelines: 'Not used on Google Play.',
        },
      },
      shortDescription: {
        ios: {
          required: false,
          guidelines: 'Not used on iOS App Store.',
        },
        android: {
          required: true,
          maxLength: 80,
          guidelines:
            'A short description that highlights what makes your app great. Appears in search results.',
        },
      },
      fullDescription: {
        ios: {
          required: true,
          maxLength: 4000,
          guidelines:
            "Your app's full description. Describe your app's features and functionality. First few lines are most important as they appear above the fold.",
        },
        android: {
          required: true,
          maxLength: 4000,
          guidelines:
            'The full description of your app. Use this space to describe features, functionality, and benefits.',
        },
      },
      keywords: {
        ios: {
          required: false,
          maxLength: 100,
          guidelines:
            'Comma-separated keywords. Total string must be 100 characters or less. Choose keywords that describe your app and how people might search for it.',
        },
        android: {
          required: false,
          guidelines:
            'Keywords are not explicitly used on Google Play, but your app description should contain relevant search terms.',
        },
      },
    };

    return (
      requirements[field]?.[platform] || {
        required: false,
        guidelines: 'No specific requirements',
      }
    );
  }

  /**
   * Get suggested keywords based on app info
   */
  suggestKeywords(appInfo: {
    name: string;
    category: string;
    description?: string;
  }): string[] {
    const suggestions = new Set<string>();

    // Add app name variations
    const nameParts = appInfo.name.toLowerCase().split(/\s+/);
    nameParts.forEach((part) => {
      if (part.length > 2) suggestions.add(part);
    });

    // Add category-related keywords
    const category = appInfo.category.toLowerCase().replace(/\s+/g, '');
    suggestions.add(category);

    // Add common keywords based on category
    const categoryKeywords: Record<string, string[]> = {
      ecommerce: ['shop', 'store', 'buy', 'product', 'cart', 'order'],
      social: ['chat', 'message', 'share', 'friend', 'community', 'post'],
      productivity: ['task', 'organize', 'manage', 'schedule', 'planner'],
      health: ['fitness', 'workout', 'health', 'wellness', 'tracker'],
      finance: ['money', 'budget', 'expense', 'payment', 'wallet'],
      education: ['learn', 'study', 'course', 'tutorial', 'lesson'],
    };

    const categoryLower = appInfo.category.toLowerCase();
    for (const [key, keywords] of Object.entries(categoryKeywords)) {
      if (categoryLower.includes(key)) {
        keywords.forEach((kw) => suggestions.add(kw));
      }
    }

    return Array.from(suggestions).slice(0, 20);
  }

  /**
   * Get category mapping between iOS and Android
   */
  getCategoryMapping(category: string, from: 'ios' | 'android'): string | null {
    const mapping: Record<string, { ios: string; android: string }> = {
      books: { ios: 'Books', android: 'Books & Reference' },
      business: { ios: 'Business', android: 'Business' },
      education: { ios: 'Education', android: 'Education' },
      entertainment: { ios: 'Entertainment', android: 'Entertainment' },
      finance: { ios: 'Finance', android: 'Finance' },
      food: { ios: 'Food & Drink', android: 'Food & Drink' },
      health: { ios: 'Health & Fitness', android: 'Health & Fitness' },
      lifestyle: { ios: 'Lifestyle', android: 'Lifestyle' },
      music: { ios: 'Music', android: 'Music & Audio' },
      news: { ios: 'News', android: 'News & Magazines' },
      productivity: { ios: 'Productivity', android: 'Productivity' },
      shopping: { ios: 'Shopping', android: 'Shopping' },
      social: { ios: 'Social Networking', android: 'Social' },
      sports: { ios: 'Sports', android: 'Sports' },
      travel: { ios: 'Travel', android: 'Travel & Local' },
      utilities: { ios: 'Utilities', android: 'Tools' },
      weather: { ios: 'Weather', android: 'Weather' },
    };

    const to = from === 'ios' ? 'android' : 'ios';
    const categoryLower = category.toLowerCase();

    for (const [key, value] of Object.entries(mapping)) {
      if (value[from].toLowerCase() === categoryLower) {
        return value[to];
      }
    }

    return null;
  }

  // Helper methods
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

// Export singleton instance
export const metadataService = new MetadataService();
