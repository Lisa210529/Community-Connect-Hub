export default function StatCard({ label, value, icon, accent = 'text-cyber-accent' }) {
  return (
    <div className="cyber-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-cyber-muted text-sm uppercase tracking-wide">{label}</p>
          <p className={`text-3xl font-bold mt-1 ${accent}`}>{value}</p>
        </div>
        {icon && <i className={`fas ${icon} text-2xl ${accent} opacity-50`} />}
      </div>
    </div>
  );
}
