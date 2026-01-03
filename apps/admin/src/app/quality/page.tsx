/**
 * Quality Dashboard Page
 *
 * Admin page for monitoring Mobigen generation quality metrics.
 * Displays the QualityOverview component with all quality monitoring widgets.
 */

import { QualityOverview } from '@/components/quality';

export const metadata = {
  title: 'Quality Dashboard - Mobigen Admin',
  description: 'Monitor generation quality, validation metrics, and template certification status',
};

export default function QualityDashboardPage() {
  return (
    <QualityOverview
      defaultPeriod="7d"
      enablePolling={true}
      pollInterval={30000}
    />
  );
}
