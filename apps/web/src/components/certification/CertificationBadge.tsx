interface CertificationBadgeProps {
  level: 'gold' | 'silver' | 'bronze' | 'failed' | 'pending';
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export function CertificationBadge({
  level,
  size = 'md',
  showTooltip = true
}: CertificationBadgeProps) {
  const badges = {
    gold: { icon: '🥇', label: 'Gold Certified', description: 'All tiers passed' },
    silver: { icon: '🥈', label: 'Silver Certified', description: 'Tier 1 & 2 passed' },
    bronze: { icon: '🥉', label: 'Bronze Certified', description: 'Tier 1 passed' },
    failed: { icon: '❌', label: 'Failed', description: 'Certification failed' },
    pending: { icon: '⏳', label: 'Pending', description: 'Not yet tested' },
  };

  const badge = badges[level];

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  return (
    <div className="relative inline-block group">
      <span className={`${sizeClasses[size]} cursor-default`} title={badge.label}>
        {badge.icon}
      </span>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
          <div className="font-semibold">{badge.label}</div>
          <div className="text-slate-300">{badge.description}</div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-slate-900"></div>
          </div>
        </div>
      )}
    </div>
  );
}
