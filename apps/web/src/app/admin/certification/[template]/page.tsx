'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CertificationBadge,
  TierProgress,
  ValidationResult,
} from '@/components/certification';

type CertificationLevel = 'gold' | 'silver' | 'bronze' | 'failed' | 'pending';

interface HistoryEntry {
  date: Date;
  passed: boolean;
  certification: CertificationLevel;
}

interface TemplateDetails {
  name: string;
  slug: string;
  description: string;
  category: string;
  lastRun: Date;
  tier1: {
    passed: boolean;
    totalChecks: number;
    passedChecks: number;
    duration: number;
    checks: Array<{ name: string; passed: boolean; required: boolean; duration: number; errors?: Array<{ file?: string; line?: number; message: string; fixable?: boolean }> }>;
  };
  tier2: {
    passed: boolean;
    totalChecks: number;
    passedChecks: number;
    duration: number;
    checks: Array<{ name: string; passed: boolean; required: boolean; duration: number; errors?: Array<{ file?: string; line?: number; message: string; fixable?: boolean }> }>;
  };
  tier3: {
    passed: boolean;
    totalChecks: number;
    passedChecks: number;
    duration: number;
    checks: Array<{ name: string; passed: boolean; required: boolean; duration: number; errors?: Array<{ file?: string; line?: number; message: string; fixable?: boolean }> }>;
  };
  history: HistoryEntry[];
}

// Mock validation data - in production this would come from API
const MOCK_TEMPLATE_DETAILS: Record<string, TemplateDetails> = {
  'ecommerce-base': {
    name: 'E-commerce Base',
    slug: 'ecommerce-base',
    description: 'Full-featured e-commerce template with cart, checkout, and payment integration',
    category: 'E-commerce',
    lastRun: new Date('2024-01-03T10:30:00'),
    tier1: {
      passed: true,
      totalChecks: 5,
      passedChecks: 5,
      duration: 24500,
      checks: [
        { name: 'TypeScript Check', passed: true, required: true, duration: 8200 },
        { name: 'ESLint Critical', passed: true, required: true, duration: 5300 },
        { name: 'Import Resolution', passed: true, required: true, duration: 3100 },
        { name: 'Navigation Graph', passed: true, required: true, duration: 4900 },
        { name: 'Required Exports', passed: true, required: true, duration: 3000 },
      ],
    },
    tier2: {
      passed: true,
      totalChecks: 5,
      passedChecks: 5,
      duration: 98000,
      checks: [
        { name: 'Full ESLint', passed: true, required: true, duration: 12000 },
        { name: 'Prettier Check', passed: true, required: false, duration: 3500 },
        { name: 'Metro Bundle Check', passed: true, required: true, duration: 45000 },
        { name: 'Expo Doctor', passed: true, required: false, duration: 8500 },
        { name: 'Component Smoke Render', passed: true, required: true, duration: 29000 },
      ],
    },
    tier3: {
      passed: true,
      totalChecks: 5,
      passedChecks: 5,
      duration: 420000,
      checks: [
        { name: 'Expo Prebuild', passed: true, required: true, duration: 85000 },
        { name: 'Maestro E2E Tests', passed: true, required: true, duration: 280000 },
        { name: 'Visual Snapshots', passed: true, required: false, duration: 45000 },
        { name: 'Bundle Size Check', passed: true, required: false, duration: 8000 },
        { name: 'Accessibility Audit', passed: true, required: false, duration: 12000 },
      ],
    },
    history: [
      { date: new Date('2024-01-03T10:30:00'), passed: true, certification: 'gold' },
      { date: new Date('2024-01-02T14:20:00'), passed: true, certification: 'gold' },
      { date: new Date('2024-01-01T09:15:00'), passed: true, certification: 'gold' },
      { date: new Date('2023-12-31T16:45:00'), passed: false, certification: 'silver' },
      { date: new Date('2023-12-30T11:30:00'), passed: true, certification: 'gold' },
    ],
  },
  'social-media': {
    name: 'Social Media',
    slug: 'social-media',
    description: 'Social networking template with posts, comments, and user profiles',
    category: 'Social',
    lastRun: new Date('2024-01-03T09:15:00'),
    tier1: {
      passed: true,
      totalChecks: 5,
      passedChecks: 5,
      duration: 22000,
      checks: [
        { name: 'TypeScript Check', passed: true, required: true, duration: 7500 },
        { name: 'ESLint Critical', passed: true, required: true, duration: 5000 },
        { name: 'Import Resolution', passed: true, required: true, duration: 2800 },
        { name: 'Navigation Graph', passed: true, required: true, duration: 4200 },
        { name: 'Required Exports', passed: true, required: true, duration: 2500 },
      ],
    },
    tier2: {
      passed: true,
      totalChecks: 5,
      passedChecks: 5,
      duration: 105000,
      checks: [
        { name: 'Full ESLint', passed: true, required: true, duration: 13500 },
        { name: 'Prettier Check', passed: true, required: false, duration: 4000 },
        { name: 'Metro Bundle Check', passed: true, required: true, duration: 48000 },
        { name: 'Expo Doctor', passed: true, required: false, duration: 9500 },
        { name: 'Component Smoke Render', passed: true, required: true, duration: 30000 },
      ],
    },
    tier3: {
      passed: false,
      totalChecks: 5,
      passedChecks: 3,
      duration: 380000,
      checks: [
        { name: 'Expo Prebuild', passed: true, required: true, duration: 82000 },
        {
          name: 'Maestro E2E Tests',
          passed: false,
          required: true,
          duration: 250000,
          errors: [
            {
              file: '.maestro/comment-flow.yaml',
              line: 23,
              message: 'Element with id "comment-input" not found after 5s timeout',
              fixable: false,
            },
            {
              file: '.maestro/comment-flow.yaml',
              line: 28,
              message: 'Navigation assertion failed: Expected "Comments" screen but found "Feed"',
              fixable: false,
            },
          ],
        },
        { name: 'Visual Snapshots', passed: true, required: false, duration: 42000 },
        { name: 'Bundle Size Check', passed: false, required: false, duration: 6000, errors: [
          { message: 'Bundle size 8.2MB exceeds limit of 7MB by 1.2MB', fixable: false }
        ]},
        { name: 'Accessibility Audit', passed: true, required: false, duration: 10000 },
      ],
    },
    history: [
      { date: new Date('2024-01-03T09:15:00'), passed: false, certification: 'silver' },
      { date: new Date('2024-01-02T15:30:00'), passed: false, certification: 'silver' },
      { date: new Date('2024-01-01T10:45:00'), passed: true, certification: 'gold' },
      { date: new Date('2023-12-31T14:20:00'), passed: true, certification: 'gold' },
    ],
  },
};

export default function TemplateCertificationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const templateSlug = params.template as string;

  // Get template details (mock data)
  const template = MOCK_TEMPLATE_DETAILS[templateSlug as keyof typeof MOCK_TEMPLATE_DETAILS];

  if (!template) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Template Not Found
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            The template "{templateSlug}" does not exist
          </p>
          <Link
            href="/admin/certification"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-block"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Determine certification level
  let certificationLevel: 'gold' | 'silver' | 'bronze' | 'failed';
  if (template.tier1.passed && template.tier2.passed && template.tier3.passed) {
    certificationLevel = 'gold';
  } else if (template.tier1.passed && template.tier2.passed) {
    certificationLevel = 'silver';
  } else if (template.tier1.passed) {
    certificationLevel = 'bronze';
  } else {
    certificationLevel = 'failed';
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/admin/certification"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-2"
            >
              <span>←</span>
              <span>Back to Dashboard</span>
            </Link>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                View Logs
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2">
                <span>🔄</span>
                <span>Re-run Certification</span>
              </button>
            </div>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {template.name}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mb-3">
                {template.description}
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full font-medium">
                  {template.category}
                </span>
                <span className="text-slate-600 dark:text-slate-400">
                  Last run: {formatRelativeTime(template.lastRun)}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <CertificationBadge level={certificationLevel} size="lg" showTooltip={false} />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-2">
                {certificationLevel === 'gold' && 'Gold Certified'}
                {certificationLevel === 'silver' && 'Silver Certified'}
                {certificationLevel === 'bronze' && 'Bronze Certified'}
                {certificationLevel === 'failed' && 'Certification Failed'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Tier Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <TierProgress
            tier="tier1"
            passed={template.tier1.passed}
            totalChecks={template.tier1.totalChecks}
            passedChecks={template.tier1.passedChecks}
          />
          <TierProgress
            tier="tier2"
            passed={template.tier2.passed}
            totalChecks={template.tier2.totalChecks}
            passedChecks={template.tier2.passedChecks}
          />
          <TierProgress
            tier="tier3"
            passed={template.tier3.passed}
            totalChecks={template.tier3.totalChecks}
            passedChecks={template.tier3.passedChecks}
          />
        </div>

        {/* Detailed Results */}
        <div className="space-y-6">
          {/* Tier 1 */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Tier 1: Instant Validation
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Fast checks that run after every edit (&lt; 30 seconds)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Duration: {formatDuration(template.tier1.duration)}
                </span>
                {template.tier1.passed ? (
                  <span className="text-2xl text-green-500">✓</span>
                ) : (
                  <span className="text-2xl text-red-500">✗</span>
                )}
              </div>
            </div>
            <div className="space-y-4">
              {template.tier1.checks.map((check, idx) => (
                <ValidationResult key={idx} {...check} />
              ))}
            </div>
          </div>

          {/* Tier 2 */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Tier 2: Fast Validation
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Comprehensive checks before preview (&lt; 2 minutes)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Duration: {formatDuration(template.tier2.duration)}
                </span>
                {template.tier2.passed ? (
                  <span className="text-2xl text-green-500">✓</span>
                ) : (
                  <span className="text-2xl text-red-500">✗</span>
                )}
              </div>
            </div>
            <div className="space-y-4">
              {template.tier2.checks.map((check, idx) => (
                <ValidationResult key={idx} {...check} />
              ))}
            </div>
          </div>

          {/* Tier 3 */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Tier 3: Thorough Validation
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Extensive testing before build (&lt; 10 minutes)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Duration: {formatDuration(template.tier3.duration)}
                </span>
                {template.tier3.passed ? (
                  <span className="text-2xl text-green-500">✓</span>
                ) : (
                  <span className="text-2xl text-red-500">✗</span>
                )}
              </div>
            </div>
            <div className="space-y-4">
              {template.tier3.checks.map((check, idx) => (
                <ValidationResult key={idx} {...check} />
              ))}
            </div>
          </div>
        </div>

        {/* Test History */}
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
            Test History
          </h2>
          <div className="space-y-3">
            {template.history.map((run, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <CertificationBadge
                    level={run.certification}
                    size="sm"
                    showTooltip={false}
                  />
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      {run.date.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      {formatRelativeTime(run.date)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {run.passed ? (
                    <span className="text-green-600 dark:text-green-400 font-medium text-sm">
                      Passed
                    </span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400 font-medium text-sm">
                      Failed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
