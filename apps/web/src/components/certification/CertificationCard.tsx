interface CertificationCardProps {
  level: 'gold' | 'silver' | 'bronze' | 'failed';
  count: number;
  total: number;
}

export function CertificationCard({ level, count, total }: CertificationCardProps) {
  const configs = {
    gold: {
      icon: '🥇',
      label: 'Gold Certified',
      description: 'All tiers passed',
      bgColor: 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20',
      textColor: 'text-yellow-900 dark:text-yellow-100',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
    },
    silver: {
      icon: '🥈',
      label: 'Silver Certified',
      description: 'Tier 1 & 2 passed',
      bgColor: 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/20 dark:to-slate-700/20',
      textColor: 'text-slate-900 dark:text-slate-100',
      borderColor: 'border-slate-200 dark:border-slate-700',
    },
    bronze: {
      icon: '🥉',
      label: 'Bronze Certified',
      description: 'Tier 1 passed',
      bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20',
      textColor: 'text-orange-900 dark:text-orange-100',
      borderColor: 'border-orange-200 dark:border-orange-800',
    },
    failed: {
      icon: '❌',
      label: 'Failed',
      description: 'Certification failed',
      bgColor: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20',
      textColor: 'text-red-900 dark:text-red-100',
      borderColor: 'border-red-200 dark:border-red-800',
    },
  };

  const config = configs[level];
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className={`${config.bgColor} ${config.borderColor} border-2 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-4xl">{config.icon}</span>
        <div className="text-right">
          <div className={`text-3xl font-bold ${config.textColor}`}>{count}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {percentage}%
          </div>
        </div>
      </div>
      <div>
        <h3 className={`text-lg font-semibold ${config.textColor} mb-1`}>
          {config.label}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {config.description}
        </p>
      </div>
    </div>
  );
}
