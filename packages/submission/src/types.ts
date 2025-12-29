/**
 * Type definitions for submission service
 */

export interface IconSize {
  size: number;
  scale: number;
  idiom: 'iphone' | 'ipad' | 'ios-marketing' | 'android';
  filename: string;
}

export interface ScreenshotSpec {
  width: number;
  height: number;
  platform: 'ios' | 'android';
  deviceType: string;
  required: boolean;
}

export interface AppMetadata {
  appName: string;
  appSubtitle?: string;
  promotionalText?: string;
  shortDescription: string;
  fullDescription: string;
  keywords: string[];
  category: string;
  privacyPolicyUrl: string;
  supportUrl: string;
  marketingUrl?: string;
  supportEmail: string;
  supportPhone?: string;
  contentRating?: string;
  contentWarnings?: string[];
}

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  platform: 'ios' | 'android' | 'both';
  required: boolean;
  estimatedTime: string;
  category: string;
  dependencies?: string[];
}

export interface SubmissionGuide {
  platform: 'ios' | 'android';
  steps: GuideStep[];
}

export interface GuideStep {
  id: string;
  title: string;
  description: string;
  sections: GuideSection[];
  resources: Resource[];
  estimatedTime: string;
}

export interface GuideSection {
  title: string;
  content: string;
  type: 'text' | 'code' | 'image' | 'video';
  code?: string;
  imageUrl?: string;
  videoUrl?: string;
}

export interface Resource {
  title: string;
  url: string;
  type: 'documentation' | 'video' | 'tool' | 'example';
}

export interface AssetGenerationOptions {
  projectId: string;
  projectPath: string;
  logoPath?: string;
  primaryColor?: string;
  backgroundColor?: string;
}

export interface IconGenerationResult {
  success: boolean;
  generatedIcons: Array<{
    path: string;
    size: number;
    platform: 'ios' | 'android';
  }>;
  errors?: string[];
}

export interface ScreenshotGenerationResult {
  success: boolean;
  generatedScreenshots: Array<{
    path: string;
    width: number;
    height: number;
    platform: 'ios' | 'android';
    deviceType: string;
  }>;
  errors?: string[];
}
