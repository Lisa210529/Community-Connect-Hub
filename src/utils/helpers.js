/** Search and filter helpers */

export function filterBySearch(items, query, fields) {
  if (!query?.trim()) return items;
  const q = query.toLowerCase();
  return items.filter((item) =>
    fields.some((f) => String(item[f] ?? '').toLowerCase().includes(q)),
  );
}

export function filterByStatus(items, status, field = 'status') {
  if (!status || status === 'all') return items;
  return items.filter((item) => item[field] === status);
}

export function sortByDate(items, field, desc = true) {
  return [...items].sort((a, b) => {
    const da = new Date(a[field]).getTime();
    const db = new Date(b[field]).getTime();
    return desc ? db - da : da - db;
  });
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function formatCurrency(amount) {
  return `K${Number(amount || 0).toLocaleString()}`;
}

export function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-PG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function calcCompletionRate(projects) {
  if (!projects.length) return 0;
  const done = projects.filter((p) =>
    ['Funded', 'Completed'].includes(p.status),
  ).length;
  return Math.round((done / projects.length) * 100);
}
