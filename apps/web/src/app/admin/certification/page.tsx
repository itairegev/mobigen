'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  CertificationBadge,
  CertificationCard,
} from '@/components/certification';

// Mock data - in production this would come from API/database
const MOCK_TEMPLATES = [
  {
    id: '1',
    name: 'E-commerce Base',
    slug: 'ecommerce-base',
    tier1: { passed: true, passedChecks: 5, totalChecks: 5 },
    tier2: { passed: true, passedChecks: 5, totalChecks: 5 },
    tier3: { passed: true, passedChecks: 5, totalChecks: 5 },
    lastRun: new Date('2024-01-03T10:30:00'),
  },
  {
    id: '2',
    name: 'Social Media',
    slug: 'social-media',
    tier1: { passed: true, passedChecks: 5, totalChecks: 5 },
    tier2: { passed: true, passedChecks: 5, totalChecks: 5 },
    tier3: { passed: false, passedChecks: 3, totalChecks: 5 },
    lastRun: new Date('2024-01-03T09:15:00'),
  },
  {
    id: '3',
    name: 'Fitness Tracker',
    slug: 'fitness-tracker',
    tier1: { passed: true, passedChecks: 5, totalChecks: 5 },
    tier2: { passed: false, passedChecks: 3, totalChecks: 5 },
    tier3: { passed: false, passedChecks: 0, totalChecks: 5 },
    lastRun: new Date('2024-01-02T16:45:00'),
  },
  {
    id: '4',
    name: 'News Reader',
    slug: 'news-reader',
    tier1: { passed: false, passedChecks: 2, totalChecks: 5 },
    tier2: { passed: false, passedChecks: 0, totalChecks: 5 },
    tier3: { passed: false, passedChecks: 0, totalChecks: 5 },
    lastRun: new Date('2024-01-02T14:20:00'),
  },
  {
    id: '5',
    name: 'Food Delivery',
    slug: 'food-delivery',
    tier1: { passed: true, passedChecks: 5, totalChecks: 5 },
    tier2: { passed: true, passedChecks: 5, totalChecks: 5 },
    tier3: { passed: true, passedChecks: 5, totalChecks: 5 },
    lastRun: new Date('2024-01-03T11:00:00'),
  },
  {
    id: '6',
    name: 'Booking System',
    slug: 'booking-system',
    tier1: { passed: true, passedChecks: 5, totalChecks: 5 },
    tier2: { passed: true, passedChecks: 4, totalChecks: 5 },
    tier3: { passed: false, passedChecks: 2, totalChecks: 5 },
    lastRun: new Date('2024-01-03T08:30:00'),
  },
  {
    id: '7',
    name: 'Chat App',
    slug: 'chat-app',
    tier1: { passed: true, passedChecks: 5, totalChecks: 5 },
    tier2: { passed: true, passedChecks: 5, totalChecks: 5 },
    tier3: { passed: true, passedChecks: 5, totalChecks: 5 },
    lastRun: new Date('2024-01-03T10:00:00'),
  },
  {
    id: '8',
    name: 'Finance Dashboard',
    slug: 'finance-dashboard',
    tier1: { passed: true, passedChecks: 5, totalChecks: 5 },
    tier2: { passed: true, passedChecks: 5, totalChecks: 5 },
    tier3: { passed: false, passedChecks: 4, totalChecks: 5 },
    lastRun: new Date('2024-01-02T17:30:00'),
  },
];

// Generate more mock templates to reach 20
for (let i = 9; i <= 20; i++) {
  const tier1Passed = Math.random() > 0.1;
  const tier2Passed = tier1Passed && Math.random() > 0.3;
  const tier3Passed = tier2Passed && Math.random() > 0.5;

  MOCK_TEMPLATES.push({
    id: String(i),
    name: `Template ${i}`,
    slug: `template-${i}`,
    tier1: { passed: tier1Passed, passedChecks: tier1Passed ? 5 : Math.floor(Math.random() * 4), totalChecks: 5 },
    tier2: { passed: tier2Passed, passedChecks: tier2Passed ? 5 : Math.floor(Math.random() * 4), totalChecks: 5 },
    tier3: { passed: tier3Passed, passedChecks: tier3Passed ? 5 : Math.floor(Math.random() * 4), totalChecks: 5 },
    lastRun: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
  });
}

type CertificationLevel = 'all' | 'gold' | 'silver' | 'bronze' | 'failed';
type SortField = 'name' | 'status' | 'lastRun';
type SortOrder = 'asc' | 'desc';

export default function CertificationPage() {
  const [filter, setFilter] = useState<CertificationLevel>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate certification level for each template
  const templatesWithStatus = useMemo(() => {
    return MOCK_TEMPLATES.map((template) => {
      let level: 'gold' | 'silver' | 'bronze' | 'failed';
      if (template.tier1.passed && template.tier2.passed && template.tier3.passed) {
        level = 'gold';
      } else if (template.tier1.passed && template.tier2.passed) {
        level = 'silver';
      } else if (template.tier1.passed) {
        level = 'bronze';
      } else {
        level = 'failed';
      }
      return { ...template, certificationLevel: level };
    });
  }, []);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const gold = templatesWithStatus.filter((t) => t.certificationLevel === 'gold').length;
    const silver = templatesWithStatus.filter((t) => t.certificationLevel === 'silver').length;
    const bronze = templatesWithStatus.filter((t) => t.certificationLevel === 'bronze').length;
    const failed = templatesWithStatus.filter((t) => t.certificationLevel === 'failed').length;
    return { gold, silver, bronze, failed, total: MOCK_TEMPLATES.length };
  }, [templatesWithStatus]);

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let filtered = templatesWithStatus;

    // Apply certification level filter
    if (filter !== 'all') {
      filtered = filtered.filter((t) => t.certificationLevel === filter);
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'status') {
        const statusOrder = { gold: 0, silver: 1, bronze: 2, failed: 3 };
        comparison = statusOrder[a.certificationLevel] - statusOrder[b.certificationLevel];
      } else if (sortField === 'lastRun') {
        comparison = a.lastRun.getTime() - b.lastRun.getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [templatesWithStatus, filter, searchQuery, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Template Certification Dashboard
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Quality assurance status for all {summary.total} templates
              </p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2">
              <span>🔄</span>
              <span>Run All Tests</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <CertificationCard level="gold" count={summary.gold} total={summary.total} />
          <CertificationCard level="silver" count={summary.silver} total={summary.total} />
          <CertificationCard level="bronze" count={summary.bronze} total={summary.total} />
          <CertificationCard level="failed" count={summary.failed} total={summary.total} />
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Certification Level Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('gold')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                  filter === 'gold'
                    ? 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                <span>🥇</span>
                <span>Gold</span>
              </button>
              <button
                onClick={() => setFilter('silver')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                  filter === 'silver'
                    ? 'bg-slate-200 text-slate-900 dark:bg-slate-600 dark:text-slate-100'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                <span>🥈</span>
                <span>Silver</span>
              </button>
              <button
                onClick={() => setFilter('bronze')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                  filter === 'bronze'
                    ? 'bg-orange-100 text-orange-900 dark:bg-orange-900 dark:text-orange-100'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                <span>🥉</span>
                <span>Bronze</span>
              </button>
              <button
                onClick={() => setFilter('failed')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                  filter === 'failed'
                    ? 'bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                <span>❌</span>
                <span>Failed</span>
              </button>
            </div>
          </div>
        </div>

        {/* Templates Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    >
                      <span>Template</span>
                      {sortField === 'name' && (
                        <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-center">
                    <button
                      onClick={() => handleSort('status')}
                      className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    >
                      <span>Status</span>
                      {sortField === 'status' && (
                        <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                    Tier 1
                  </th>
                  <th className="px-6 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                    Tier 2
                  </th>
                  <th className="px-6 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                    Tier 3
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('lastRun')}
                      className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    >
                      <span>Last Run</span>
                      {sortField === 'lastRun' && (
                        <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredTemplates.map((template) => (
                  <tr
                    key={template.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {template.name}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {template.slug}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <CertificationBadge level={template.certificationLevel} size="md" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 text-sm ${
                        template.tier1.passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        <span>{template.tier1.passed ? '✓' : '✗'}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {template.tier1.passedChecks}/{template.tier1.totalChecks}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 text-sm ${
                        template.tier2.passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        <span>{template.tier2.passed ? '✓' : '✗'}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {template.tier2.passedChecks}/{template.tier2.totalChecks}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 text-sm ${
                        template.tier3.passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        <span>{template.tier3.passed ? '✓' : '✗'}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {template.tier3.passedChecks}/{template.tier3.totalChecks}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {formatRelativeTime(template.lastRun)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link
                        href={`/admin/certification/${template.slug}`}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-2">🔍</div>
                <p className="text-slate-600 dark:text-slate-400">
                  No templates found matching your filters
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Results Summary */}
        {filteredTemplates.length > 0 && (
          <div className="mt-4 text-sm text-slate-600 dark:text-slate-400 text-center">
            Showing {filteredTemplates.length} of {summary.total} templates
          </div>
        )}
      </main>
    </div>
  );
}
