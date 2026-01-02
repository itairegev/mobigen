// Utility functions for the Sports Team template

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Calculate win percentage
 */
export function calculateWinPercentage(won: number, played: number): number {
  if (played === 0) return 0;
  return Math.round((won / played) * 100);
}

/**
 * Get form emoji
 */
export function getFormEmoji(form: 'W' | 'D' | 'L'): string {
  const emojiMap = {
    W: '🟢',
    D: '🟡',
    L: '🔴',
  };
  return emojiMap[form] || '⚪';
}

/**
 * Truncate text to max length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
