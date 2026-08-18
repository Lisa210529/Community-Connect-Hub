export function formatCurrency(amount) {
  return `K ${Number(amount ?? 0).toLocaleString()}`;
}

export function formatDate(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-PG', { day: 'numeric', month: 'short', year: 'numeric' });
}
