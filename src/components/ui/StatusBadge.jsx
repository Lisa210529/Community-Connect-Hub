import { GROUP_STATUS_LABELS } from '../../utils/wdcHelpers';

export default function StatusBadge({ status }) {
  const map = {
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
    [GROUP_STATUS_LABELS.forwarded]: 'bg-status-completed/20 text-status-completed border-status-completed/40',
    [GROUP_STATUS_LABELS.referred]: 'bg-status-completed/20 text-status-completed border-status-completed/40',
    [GROUP_STATUS_LABELS.communityNeed]: 'bg-status-pending/20 text-status-pending border-status-pending/40',
    [GROUP_STATUS_LABELS.individual]: 'bg-status-inactive/20 text-status-inactive border-status-inactive/40',
    Referred: 'bg-status-completed/20 text-status-completed border-status-completed/40',
    'Community Need': 'bg-status-pending/20 text-status-pending border-status-pending/40',
    Individual: 'bg-status-inactive/20 text-status-inactive border-status-inactive/40',
    Scheduled: 'bg-status-active/20 text-status-active border-status-active/40',
    Cancelled: 'bg-status-inactive/20 text-status-inactive border-status-inactive/40',
    Approved: 'bg-status-completed/20 text-status-completed border-status-completed/40',
    low: 'bg-status-inactive/20 text-status-inactive border-status-inactive/40',
    medium: 'bg-status-pending/20 text-status-pending border-status-pending/40',
    high: 'bg-status-rejected/20 text-status-rejected border-status-rejected/40',
  };

  const cls = map[status] ?? 'bg-slate-border/50 text-cyber-muted border-slate-border';

  return (
    <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full border ${cls}`}>
      {status}
    </span>
  );
}
