const STATUS_STYLES = {
  'Pending WDC': 'bg-status-pending/20 text-status-pending border-status-pending/40',
  'Pending LLG': 'bg-status-pending/20 text-status-pending border-status-pending/40',
  'Pending District': 'bg-status-pending/20 text-status-pending border-status-pending/40',
  'Pending Provincial': 'bg-status-pending/20 text-status-pending border-status-pending/40',
  Funded: 'bg-status-completed/20 text-status-completed border-status-completed/40',
  'In Progress': 'bg-status-active/20 text-status-active border-status-active/40',
  Completed: 'bg-status-completed/20 text-status-completed border-status-completed/40',
  Pending: 'bg-status-pending/20 text-status-pending border-status-pending/40',
  Resolved: 'bg-status-completed/20 text-status-completed border-status-completed/40',
  Rejected: 'bg-status-rejected/20 text-status-rejected border-status-rejected/40',
  Scheduled: 'bg-status-active/20 text-status-active border-status-active/40',
  Cancelled: 'bg-status-inactive/20 text-status-inactive border-status-inactive/40',
  Approved: 'bg-status-completed/20 text-status-completed border-status-completed/40',
  low: 'bg-status-inactive/20 text-status-inactive border-status-inactive/40',
  medium: 'bg-status-pending/20 text-status-pending border-status-pending/40',
  high: 'bg-status-rejected/20 text-status-rejected border-status-rejected/40',
};

export default function Badge({ status, children }) {
  const label = children ?? status;
  const cls = STATUS_STYLES[status] ?? 'bg-border/50 text-text-secondary border-border';
  return (
    <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full border ${cls}`}>
      {label}
    </span>
  );
}
