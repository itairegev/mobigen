interface ChannelBadgeProps {
  channel: 'production' | 'staging' | 'development';
  size?: 'sm' | 'md';
}

export function ChannelBadge({ channel, size = 'md' }: ChannelBadgeProps) {
  const styles = {
    production: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-700 dark:text-green-400',
      icon: '🟢',
    },
    staging: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-700 dark:text-yellow-400',
      icon: '🟡',
    },
    development: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-400',
      icon: '🔵',
    },
  };

  const style = styles[channel];
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${style.bg} ${style.text} ${sizeClasses}`}
    >
      <span className="text-xs">{style.icon}</span>
      <span className="capitalize">{channel}</span>
    </span>
  );
}
