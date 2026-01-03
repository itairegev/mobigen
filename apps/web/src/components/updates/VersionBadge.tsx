interface VersionBadgeProps {
  version: string;
  isCurrent?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function VersionBadge({ version, isCurrent = false, size = 'md' }: VersionBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg font-mono font-medium ${
        isCurrent
          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 ring-2 ring-blue-500/20'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
      } ${sizeClasses[size]}`}
    >
      <span className="text-xs">v</span>
      <span>{version}</span>
      {isCurrent && <span className="text-xs">✓</span>}
    </span>
  );
}
