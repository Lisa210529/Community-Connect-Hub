export default function StatsCard({ label, value, icon: Icon, accent = 'text-primary' }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-secondary text-sm uppercase tracking-wide">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${accent}`}>{value}</p>
        </div>
        {Icon && <Icon className={`text-2xl ${accent} opacity-50`} />}
      </div>
    </div>
  );
}
