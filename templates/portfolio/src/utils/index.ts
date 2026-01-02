// Utility functions

export function formatDate(dateString: string): string {
  const [year, month] = dateString.split('-');
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${monthNames[parseInt(month) - 1]} ${year}`;
}

export function formatDateRange(startDate: string, endDate?: string, current?: boolean): string {
  const start = formatDate(startDate);
  if (current) {
    return `${start} - Present`;
  }
  if (endDate) {
    return `${start} - ${formatDate(endDate)}`;
  }
  return start;
}

export function getYearsOfExperience(startDate: string, endDate?: string): number {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
  return Math.floor(years);
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function openUrl(url: string): void {
  // In a real app, this would use Linking from react-native
  console.log('Opening URL:', url);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
