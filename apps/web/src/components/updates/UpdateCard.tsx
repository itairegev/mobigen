import { ChannelBadge } from './ChannelBadge';
import { VersionBadge } from './VersionBadge';
import { RolloutProgress } from './RolloutProgress';
import { UpdateActions } from './UpdateActions';

interface UpdateCardProps {
  update: {
    id: string;
    version: string;
    channel: 'production' | 'staging' | 'development';
    status: 'active' | 'paused' | 'completed' | 'rolled-back' | 'superseded';
    message: string;
    publishedAt: Date;
    rolloutPercentage: number;
    downloads: number;
    errorRate: number;
  };
  isCurrent?: boolean;
}

export function UpdateCard({ update, isCurrent = false }: UpdateCardProps) {
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return '🚀';
      case 'paused':
        return '⏸️';
      case 'completed':
        return '✅';
      case 'rolled-back':
        return '↩️';
      case 'superseded':
        return '📦';
      default:
        return '📋';
    }
  };

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-lg border ${
        isCurrent
          ? 'border-blue-500 dark:border-blue-600 shadow-lg'
          : 'border-slate-200 dark:border-slate-700 shadow-sm'
      } p-6 transition-all hover:shadow-md`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{getStatusIcon(update.status)}</span>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <VersionBadge version={update.version} isCurrent={isCurrent} />
              <ChannelBadge channel={update.channel} size="sm" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">{update.message}</p>
          </div>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {formatDate(update.publishedAt)}
        </span>
      </div>

      {/* Rollout Progress */}
      {update.status !== 'superseded' && (
        <div className="mb-4">
          <RolloutProgress percentage={update.rolloutPercentage} status={update.status} />
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Downloads</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {update.downloads.toLocaleString()}
          </div>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Error Rate</div>
          <div
            className={`text-lg font-bold ${
              update.errorRate > 5
                ? 'text-red-600 dark:text-red-400'
                : update.errorRate > 2
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-green-600 dark:text-green-400'
            }`}
          >
            {update.errorRate.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Actions */}
      {update.status !== 'superseded' && (
        <UpdateActions
          updateId={update.id}
          status={update.status}
          channel={update.channel}
          onPause={() => console.log('Pause:', update.id)}
          onResume={() => console.log('Resume:', update.id)}
          onRollback={() => console.log('Rollback:', update.id)}
          onPromote={() => console.log('Promote:', update.id)}
        />
      )}
    </div>
  );
}
