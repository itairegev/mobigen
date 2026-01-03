/**
 * TemplateStatus Component
 *
 * Table displaying certification status for all templates.
 * Features:
 * - Sortable columns
 * - Filter by certification level
 * - Certification badges
 * - Issue indicators
 * - Link to template details
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  Award,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { format } from 'date-fns';
import type { TemplateCertification, CertificationLevel } from './types';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface TemplateStatusProps {
  templates: TemplateCertification[];
  className?: string;
}

type SortField = 'name' | 'level' | 'successRate' | 'totalGenerations' | 'lastCertified';
type SortDirection = 'asc' | 'desc';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UTILITIES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getCertificationConfig(level: CertificationLevel) {
  switch (level) {
    case 'gold':
      return {
        label: 'Gold',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-300',
        icon: '🥇',
      };
    case 'silver':
      return {
        label: 'Silver',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        borderColor: 'border-gray-300',
        icon: '🥈',
      };
    case 'bronze':
      return {
        label: 'Bronze',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800',
        borderColor: 'border-orange-300',
        icon: '🥉',
      };
    case 'uncertified':
      return {
        label: 'Uncertified',
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        borderColor: 'border-red-300',
        icon: '⚠️',
      };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CERTIFICATION BADGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface CertificationBadgeProps {
  level: CertificationLevel;
}

function CertificationBadge({ level }: CertificationBadgeProps) {
  const config = getCertificationConfig(level);

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
        ${config.bgColor} ${config.textColor} ${config.borderColor}
      `}
    >
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SORTABLE HEADER
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface SortableHeaderProps {
  field: SortField;
  currentField: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
  children: React.ReactNode;
}

function SortableHeader({
  field,
  currentField,
  direction,
  onSort,
  children,
}: SortableHeaderProps) {
  const isActive = currentField === field;

  return (
    <th className="px-6 py-3 text-left">
      <button
        onClick={() => onSort(field)}
        className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
      >
        {children}
        {isActive ? (
          direction === 'asc' ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </button>
    </th>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function TemplateStatus({ templates, className = '' }: TemplateStatusProps) {
  const [sortField, setSortField] = useState<SortField>('successRate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [levelFilter, setLevelFilter] = useState<CertificationLevel | 'all'>('all');

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filter and sort templates
  const processedTemplates = useMemo(() => {
    let filtered = templates;

    // Filter by certification level
    if (levelFilter !== 'all') {
      filtered = filtered.filter((t) => t.level === levelFilter);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.templateName.toLowerCase();
          bValue = b.templateName.toLowerCase();
          break;
        case 'level':
          const levelOrder: Record<CertificationLevel, number> = {
            gold: 4,
            silver: 3,
            bronze: 2,
            uncertified: 1,
          };
          aValue = levelOrder[a.level];
          bValue = levelOrder[b.level];
          break;
        case 'successRate':
          aValue = a.successRate;
          bValue = b.successRate;
          break;
        case 'totalGenerations':
          aValue = a.totalGenerations;
          bValue = b.totalGenerations;
          break;
        case 'lastCertified':
          aValue = a.lastCertified.getTime();
          bValue = b.lastCertified.getTime();
          break;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [templates, levelFilter, sortField, sortDirection]);

  // Calculate counts for filter
  const levelCounts = {
    all: templates.length,
    gold: templates.filter((t) => t.level === 'gold').length,
    silver: templates.filter((t) => t.level === 'silver').length,
    bronze: templates.filter((t) => t.level === 'bronze').length,
    uncertified: templates.filter((t) => t.level === 'uncertified').length,
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Template Certification Status
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Quality certification levels for all templates
            </p>
          </div>

          <Award className="h-6 w-6 text-gray-400" />
        </div>

        {/* Level filter */}
        <div className="flex gap-2">
          {(['all', 'gold', 'silver', 'bronze', 'uncertified'] as const).map(
            (level) => (
              <button
                key={level}
                onClick={() => setLevelFilter(level)}
                className={`
                  px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                  ${
                    levelFilter === level
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {level === 'all' ? 'All' : getCertificationConfig(level).label}
                <span className="ml-1.5 text-xs opacity-75">
                  ({levelCounts[level]})
                </span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortableHeader
                field="name"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              >
                Template
              </SortableHeader>

              <SortableHeader
                field="level"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              >
                Certification
              </SortableHeader>

              <SortableHeader
                field="successRate"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              >
                Success Rate
              </SortableHeader>

              <SortableHeader
                field="totalGenerations"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              >
                Generations
              </SortableHeader>

              <SortableHeader
                field="lastCertified"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              >
                Last Certified
              </SortableHeader>

              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Issues
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {processedTemplates.map((template) => {
              const criticalIssues = template.issues.filter(
                (i) => i.severity === 'critical'
              ).length;
              const majorIssues = template.issues.filter(
                (i) => i.severity === 'major'
              ).length;

              return (
                <tr key={template.templateId} className="hover:bg-gray-50">
                  {/* Template Name */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {template.templateName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {template.category}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Certification Level */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <CertificationBadge level={template.level} />
                  </td>

                  {/* Success Rate */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-semibold ${
                          template.successRate >= 99
                            ? 'text-green-600'
                            : template.successRate >= 95
                              ? 'text-yellow-600'
                              : 'text-red-600'
                        }`}
                      >
                        {template.successRate.toFixed(1)}%
                      </span>
                      {template.successRate >= 99 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </td>

                  {/* Total Generations */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {template.totalGenerations.toLocaleString()}
                    </span>
                  </td>

                  {/* Last Certified */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">
                      {format(template.lastCertified, 'MMM d, yyyy')}
                    </span>
                  </td>

                  {/* Issues */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {template.issues.length > 0 ? (
                      <div className="flex items-center gap-1">
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-gray-900">
                          {criticalIssues > 0 && (
                            <span className="text-red-600 font-medium">
                              {criticalIssues} critical
                            </span>
                          )}
                          {criticalIssues > 0 && majorIssues > 0 && ', '}
                          {majorIssues > 0 && (
                            <span className="text-yellow-600">
                              {majorIssues} major
                            </span>
                          )}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-green-600">None</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <a
                      href={`/admin/templates/${template.templateId}`}
                      className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      View Details
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {processedTemplates.length === 0 && (
        <div className="p-12 text-center">
          <Award className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            No templates found with the selected filter
          </p>
        </div>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LOADING SKELETON
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function TemplateStatusSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 animate-pulse">
      <div className="p-6 border-b border-gray-200">
        <div className="h-6 w-64 bg-gray-200 rounded mb-4" />
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-9 w-24 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
      <div className="p-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-gray-50 rounded mb-2" />
        ))}
      </div>
    </div>
  );
}
