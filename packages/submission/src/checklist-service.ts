/**
 * Checklist Service
 *
 * Generates platform-specific submission checklists
 */

import type { ChecklistItem, SubmissionGuide, GuideStep } from './types';

// ============================================================================
// CHECKLIST GENERATION
// ============================================================================

export class ChecklistService {
  /**
   * Generate submission checklist based on platform
   */
  getChecklist(platform: 'ios' | 'android' | 'both'): ChecklistItem[] {
    const common = this.getCommonChecklist();
    const ios = platform === 'ios' || platform === 'both' ? this.getIOSChecklist() : [];
    const android =
      platform === 'android' || platform === 'both' ? this.getAndroidChecklist() : [];

    return [...common, ...ios, ...android];
  }

  /**
   * Common checklist items for both platforms
   */
  private getCommonChecklist(): ChecklistItem[] {
    return [
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
        description:
          'Fill in app description, keywords, category, and contact information',
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
      {
        id: 'test-app',
        title: 'Test Your App',
        description: 'Thoroughly test all features on physical devices',
        platform: 'both',
        required: true,
        estimatedTime: '2 hours',
        category: 'Testing',
      },
    ];
  }

  /**
   * iOS-specific checklist items
   */
  private getIOSChecklist(): ChecklistItem[] {
    return [
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
        dependencies: ['apple-developer-account'],
      },
      {
        id: 'ios-certificates',
        title: 'Configure Certificates & Provisioning',
        description: 'Set up distribution certificates and provisioning profiles',
        platform: 'ios',
        required: true,
        estimatedTime: '1 hour',
        category: 'Configuration',
        dependencies: ['apple-developer-account'],
      },
      {
        id: 'ios-build',
        title: 'Create Production Build',
        description: 'Build your app for App Store distribution',
        platform: 'ios',
        required: true,
        estimatedTime: '30 minutes',
        category: 'Build',
        dependencies: ['ios-certificates'],
      },
      {
        id: 'ios-upload',
        title: 'Upload to App Store Connect',
        description: 'Upload your build using Transporter or Xcode',
        platform: 'ios',
        required: true,
        estimatedTime: '15 minutes',
        category: 'Submission',
        dependencies: ['ios-build', 'app-store-connect'],
      },
      {
        id: 'ios-submit',
        title: 'Submit for Review',
        description: 'Complete the submission form and submit for Apple review',
        platform: 'ios',
        required: true,
        estimatedTime: '30 minutes',
        category: 'Submission',
        dependencies: ['ios-upload', 'prepare-assets', 'complete-metadata'],
      },
    ];
  }

  /**
   * Android-specific checklist items
   */
  private getAndroidChecklist(): ChecklistItem[] {
    return [
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
        dependencies: ['google-play-account'],
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
        dependencies: ['android-keystore'],
      },
      {
        id: 'android-upload',
        title: 'Upload to Play Console',
        description: 'Upload your AAB to Play Console',
        platform: 'android',
        required: true,
        estimatedTime: '15 minutes',
        category: 'Submission',
        dependencies: ['android-build', 'play-console-setup'],
      },
      {
        id: 'content-rating',
        title: 'Complete Content Rating Questionnaire',
        description: 'Answer questions to receive content rating for your app',
        platform: 'android',
        required: true,
        estimatedTime: '15 minutes',
        category: 'Submission',
        dependencies: ['play-console-setup'],
      },
      {
        id: 'android-release',
        title: 'Create Release & Submit',
        description: 'Create a production release and submit for review',
        platform: 'android',
        required: true,
        estimatedTime: '30 minutes',
        category: 'Submission',
        dependencies: [
          'android-upload',
          'content-rating',
          'prepare-assets',
          'complete-metadata',
        ],
      },
    ];
  }

  /**
   * Get detailed step-by-step guide for a specific step
   */
  getStepGuide(stepId: string, platform: 'ios' | 'android'): GuideStep | null {
    // Import step guides from separate files for better organization
    // This is a simplified version - in production, these would be comprehensive
    const guides: Record<string, GuideStep> = {
      'apple-developer-account': {
        id: 'apple-developer-account',
        title: 'Create Apple Developer Account',
        description: 'Set up your Apple Developer Program membership',
        estimatedTime: '1-2 business days',
        sections: [
          {
            title: 'Overview',
            content:
              'To publish apps on the App Store, you need to enroll in the Apple Developer Program. This costs $99 USD per year.',
            type: 'text',
          },
          {
            title: 'Step 1: Create Apple ID',
            content:
              'If you don\'t have an Apple ID, create one at https://appleid.apple.com. Use a professional email address that you have permanent access to.',
            type: 'text',
          },
          {
            title: 'Step 2: Enroll in Developer Program',
            content:
              'Visit https://developer.apple.com/programs/enroll/ and click "Start Your Enrollment". Sign in with your Apple ID.',
            type: 'text',
          },
          {
            title: 'Step 3: Complete Entity Information',
            content:
              'Choose between Individual or Organization enrollment. Organization requires D-U-N-S number and takes longer to verify.',
            type: 'text',
          },
          {
            title: 'Step 4: Accept License Agreement',
            content: 'Read and accept the Apple Developer Program License Agreement.',
            type: 'text',
          },
          {
            title: 'Step 5: Complete Purchase',
            content:
              'Pay the $99 annual fee. Apple will send a confirmation email once your enrollment is processed (usually within 24-48 hours).',
            type: 'text',
          },
        ],
        resources: [
          {
            title: 'Apple Developer Program',
            url: 'https://developer.apple.com/programs/',
            type: 'documentation',
          },
          {
            title: 'Enrollment Guide',
            url: 'https://developer.apple.com/support/enrollment/',
            type: 'documentation',
          },
        ],
      },
      // Add more step guides here...
    };

    return guides[stepId] || null;
  }

  /**
   * Get estimated total time for submission
   */
  getTotalEstimatedTime(platform: 'ios' | 'android' | 'both'): string {
    const checklist = this.getChecklist(platform);

    // Parse time strings and sum up (simplified)
    let totalMinutes = 0;
    for (const item of checklist) {
      const time = item.estimatedTime.toLowerCase();
      if (time.includes('day')) {
        totalMinutes += parseInt(time) * 8 * 60; // 8 hour work day
      } else if (time.includes('hour')) {
        totalMinutes += parseInt(time) * 60;
      } else if (time.includes('minute')) {
        totalMinutes += parseInt(time);
      }
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 16) {
      return `${Math.ceil(hours / 8)} working days`;
    } else if (hours > 0) {
      return `${hours} hours ${minutes > 0 ? `${minutes} minutes` : ''}`;
    } else {
      return `${minutes} minutes`;
    }
  }
}

// Export singleton instance
export const checklistService = new ChecklistService();
