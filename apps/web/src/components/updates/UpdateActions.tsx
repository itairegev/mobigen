'use client';

interface UpdateActionsProps {
  updateId: string;
  status: 'active' | 'paused' | 'completed' | 'rolled-back' | 'superseded';
  channel: 'production' | 'staging' | 'development';
  onPromote?: () => void;
  onRollback?: () => void;
  onPause?: () => void;
  onResume?: () => void;
}

export function UpdateActions({
  updateId,
  status,
  channel,
  onPromote,
  onRollback,
  onPause,
  onResume,
}: UpdateActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Pause/Resume for active updates */}
      {status === 'active' && (
        <button
          onClick={onPause}
          className="px-3 py-1.5 text-sm font-medium text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded-lg transition-colors"
        >
          Pause
        </button>
      )}

      {status === 'paused' && (
        <button
          onClick={onResume}
          className="px-3 py-1.5 text-sm font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
        >
          Resume
        </button>
      )}

      {/* Rollback for active or completed updates */}
      {(status === 'active' || status === 'completed') && (
        <button
          onClick={onRollback}
          className="px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
        >
          Rollback
        </button>
      )}

      {/* Promote from staging to production */}
      {channel === 'staging' && status === 'completed' && (
        <button
          onClick={onPromote}
          className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
        >
          Promote to Production
        </button>
      )}

      {/* View details link */}
      <a
        href={`/projects/${updateId.split('-')[0]}/updates/${updateId}`}
        className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        View Details →
      </a>
    </div>
  );
}
