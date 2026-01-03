interface TierProgressProps {
  tier: 'tier1' | 'tier2' | 'tier3';
  passed: boolean;
  totalChecks: number;
  passedChecks: number;
}

export function TierProgress({ tier, passed, totalChecks, passedChecks }: TierProgressProps) {
  const tierConfig = {
    tier1: {
      name: 'Tier 1: Instant',
      description: '< 30 seconds',
      color: 'blue',
    },
    tier2: {
      name: 'Tier 2: Fast',
      description: '< 2 minutes',
      color: 'purple',
    },
    tier3: {
      name: 'Tier 3: Thorough',
      description: '< 10 minutes',
      color: 'indigo',
    },
  };

  const config = tierConfig[tier];
  const percentage = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-semibold text-slate-900 dark:text-white">{config.name}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">{config.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {passedChecks}/{totalChecks}
          </span>
          {passed ? (
            <span className="text-green-500 text-xl">✓</span>
          ) : (
            <span className="text-red-500 text-xl">✗</span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`absolute top-0 left-0 h-full transition-all duration-300 ${
            passed
              ? 'bg-green-500'
              : percentage > 50
              ? 'bg-yellow-500'
              : 'bg-red-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 text-right">
        {percentage}% complete
      </div>
    </div>
  );
}
