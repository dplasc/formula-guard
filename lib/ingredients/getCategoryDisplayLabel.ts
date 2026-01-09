export function getCategoryDisplayLabel(category: string | null | undefined): string {
  if (!category) return '—';
  if (category === 'Water Phase') return 'Aqueous / Water Phase';
  return category;
}

