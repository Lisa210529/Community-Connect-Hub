const SOURCE_META = {
  firestore: { label: 'Firestore', dot: 'bg-blue-400', emoji: '🔵' },
  localstorage: { label: 'LocalStorage', dot: 'bg-yellow-400', emoji: '🟡' },
  mixed: { label: 'Mixed', dot: 'bg-green-400', emoji: '🟢' },
};

export default function DataSourceIndicator({ source }) {
  const meta = SOURCE_META[source] ?? SOURCE_META.firestore;

  return (
    <span
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-border bg-slate-bg text-sm text-cyber-muted"
      title={`Data source: ${meta.label}`}
    >
      <span aria-hidden="true">{meta.emoji}</span>
      <span className={`w-2 h-2 rounded-full ${meta.dot}`} aria-hidden="true" />
      <span>{meta.label}</span>
    </span>
  );
}
