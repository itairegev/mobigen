export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function formatWeight(kg: number): string {
  return `${kg}kg`;
}

export function getAgeString(years: number): string {
  if (years < 1) {
    return 'Less than 1 year';
  }
  return `${years} ${years === 1 ? 'year' : 'years'} old`;
}

export function getPetSpeciesEmoji(species: string): string {
  const emojis: Record<string, string> = {
    dog: '🐕',
    cat: '🐈',
    bird: '🐦',
    rabbit: '🐰',
    hamster: '🐹',
    reptile: '🦎',
    other: '🐾',
  };
  return emojis[species] || '🐾';
}
