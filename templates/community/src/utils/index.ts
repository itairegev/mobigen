import { formatDistanceToNow, format } from 'date-fns';

export function formatRelativeTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatDate(date: Date, formatString: string = 'MMM d, yyyy'): string {
  return format(date, formatString);
}

export function formatEventDate(date: Date): string {
  return format(date, 'EEE, MMM d • h:mm a');
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function getTierColor(tier: string): string {
  const colors: Record<string, string> = {
    free: '#94a3b8',
    supporter: '#60a5fa',
    premium: '#ec4899',
    vip: '#f59e0b',
  };
  return colors[tier] || colors.free;
}

export function getTierLabel(tier: string): string {
  const labels: Record<string, string> = {
    free: 'Free',
    supporter: 'Supporter',
    premium: 'Premium',
    vip: 'VIP',
  };
  return labels[tier] || 'Member';
}
