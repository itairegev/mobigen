/**
 * AlertFeed Component
 *
 * Real-time feed of quality alerts with actions.
 * Features:
 * - Severity-based color coding
 * - Acknowledge/snooze buttons
 * - Filter by severity
 * - Link to related project/template details
 * - Auto-refresh
 */

'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Check,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Alert, AlertSeverity } from './types';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface AlertFeedProps {
  alerts: Alert[];
  onAcknowledge?: (alertId: string) => void;
  onSnooze?: (alertId: string, duration: number) => void;
  maxItems?: number;
  className?: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UTILITIES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getSeverityConfig(severity: AlertSeverity) {
  switch (severity) {
    case 'critical':
      return {
        icon: AlertTriangle,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        iconColor: 'text-red-600',
        badgeColor: 'bg-red-100 text-red-800',
        label: 'Critical',
      };
    case 'warning':
      return {
        icon: AlertCircle,
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        iconColor: 'text-yellow-600',
        badgeColor: 'bg-yellow-100 text-yellow-800',
        label: 'Warning',
      };
    case 'info':
      return {
        icon: Info,
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        iconColor: 'text-blue-600',
        badgeColor: 'bg-blue-100 text-blue-800',
        label: 'Info',
      };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ALERT ITEM COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface AlertItemProps {
  alert: Alert;
  onAcknowledge?: (alertId: string) => void;
  onSnooze?: (alertId: string, duration: number) => void;
}

function AlertItem({ alert, onAcknowledge, onSnooze }: AlertItemProps) {
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);

  const config = getSeverityConfig(alert.severity);
  const Icon = config.icon;

  const handleSnooze = (hours: number) => {
    onSnooze?.(alert.id, hours);
    setShowSnoozeMenu(false);
  };

  return (
    <div
      className={`
        relative border-l-4 p-4 rounded-r-lg
        ${config.borderColor} ${config.bgColor}
        ${alert.acknowledged ? 'opacity-60' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 ${config.iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${config.badgeColor}`}>
                {config.label}
              </span>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
              </span>
            </div>

            {alert.acknowledged && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <Check className="h-3 w-3" />
                Acknowledged
              </span>
            )}
          </div>

          {/* Message */}
          <p className="mt-2 text-sm font-medium text-gray-900">
            {alert.message}
          </p>

          {/* Details */}
          {alert.details && (
            <p className="mt-1 text-sm text-gray-600">{alert.details}</p>
          )}

          {/* Links */}
          {(alert.projectId || alert.templateId) && (
            <div className="mt-2 flex items-center gap-3 text-xs">
              {alert.projectId && (
                <a
                  href={`/admin/projects/${alert.projectId}`}
                  className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  View Project
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {alert.templateId && (
                <a
                  href={`/admin/templates/${alert.templateId}`}
                  className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  View Template
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}

          {/* Actions */}
          {!alert.acknowledged && (
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => onAcknowledge?.(alert.id)}
                className="text-xs font-medium text-green-700 hover:text-green-800
                         bg-green-100 hover:bg-green-200 px-3 py-1.5 rounded transition-colors"
              >
                Acknowledge
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowSnoozeMenu(!showSnoozeMenu)}
                  className="text-xs font-medium text-gray-700 hover:text-gray-800
                           bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded transition-colors
                           flex items-center gap-1"
                >
                  <Clock className="h-3 w-3" />
                  Snooze
                </button>

                {showSnoozeMenu && (
                  <div className="absolute left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => handleSnooze(1)}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      1 hour
                    </button>
                    <button
                      onClick={() => handleSnooze(4)}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      4 hours
                    </button>
                    <button
                      onClick={() => handleSnooze(24)}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      24 hours
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FILTER COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface FilterProps {
  selected: AlertSeverity | 'all';
  onChange: (severity: AlertSeverity | 'all') => void;
  counts: Record<AlertSeverity | 'all', number>;
}

function SeverityFilter({ selected, onChange, counts }: FilterProps) {
  const options: Array<{ value: AlertSeverity | 'all'; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'critical', label: 'Critical' },
    { value: 'warning', label: 'Warning' },
    { value: 'info', label: 'Info' },
  ];

  return (
    <div className="flex gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`
            px-3 py-1.5 text-sm font-medium rounded-md transition-colors
            ${
              selected === option.value
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
        >
          {option.label}
          <span className="ml-1.5 text-xs opacity-75">
            ({counts[option.value]})
          </span>
        </button>
      ))}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function AlertFeed({
  alerts,
  onAcknowledge,
  onSnooze,
  maxItems = 10,
  className = '',
}: AlertFeedProps) {
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'all'>(
    'all'
  );

  // Calculate counts
  const counts: Record<AlertSeverity | 'all', number> = {
    all: alerts.length,
    critical: alerts.filter((a) => a.severity === 'critical').length,
    warning: alerts.filter((a) => a.severity === 'warning').length,
    info: alerts.filter((a) => a.severity === 'info').length,
  };

  // Filter alerts
  const filteredAlerts =
    severityFilter === 'all'
      ? alerts
      : alerts.filter((a) => a.severity === severityFilter);

  // Sort by timestamp (newest first)
  const sortedAlerts = [...filteredAlerts]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, maxItems);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Alerts
          </h3>
          <span className="text-sm text-gray-500">
            {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''}
          </span>
        </div>

        <SeverityFilter
          selected={severityFilter}
          onChange={setSeverityFilter}
          counts={counts}
        />
      </div>

      {/* Alert list */}
      <div className="divide-y divide-gray-200">
        {sortedAlerts.length > 0 ? (
          sortedAlerts.map((alert) => (
            <div key={alert.id} className="p-4">
              <AlertItem
                alert={alert}
                onAcknowledge={onAcknowledge}
                onSnooze={onSnooze}
              />
            </div>
          ))
        ) : (
          <div className="p-12 text-center">
            <Info className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              No alerts to display
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      {filteredAlerts.length > maxItems && (
        <div className="p-4 border-t border-gray-200 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all {filteredAlerts.length} alerts
          </button>
        </div>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LOADING SKELETON
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function AlertFeedSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 animate-pulse">
      <div className="p-6 border-b border-gray-200">
        <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-9 w-24 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4">
            <div className="h-20 bg-gray-50 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
