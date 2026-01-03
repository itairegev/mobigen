interface RolloutProgressProps {
  percentage: number;
  status: 'active' | 'paused' | 'completed' | 'rolled-back';
  showLabel?: boolean;
}

export function RolloutProgress({ percentage, status, showLabel = true }: RolloutProgressProps) {
  const statusConfig = {
    active: {
      bg: 'bg-blue-500',
      text: 'text-blue-700 dark:text-blue-400',
      label: 'Rolling out',
    },
    paused: {
      bg: 'bg-yellow-500',
      text: 'text-yellow-700 dark:text-yellow-400',
      label: 'Paused',
    },
    completed: {
      bg: 'bg-green-500',
      text: 'text-green-700 dark:text-green-400',
      label: 'Completed',
    },
    'rolled-back': {
      bg: 'bg-red-500',
      text: 'text-red-700 dark:text-red-400',
      label: 'Rolled back',
    },
  };

  const config = statusConfig[status];

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-medium ${config.text}`}>{config.label}</span>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {percentage}%
          </span>
        </div>
      )}
      <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${config.bg} transition-all duration-500 ${
            status === 'active' ? 'animate-pulse' : ''
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
