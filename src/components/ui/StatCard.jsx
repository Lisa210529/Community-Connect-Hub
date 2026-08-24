export default function StatCard({ label, value, icon, accent = 'text-cyber-accent' }) {
  return (
    <div className="cyber-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-text-secondary text-base uppercase tracking-wide">{label}</p>
          <p className={`text-4xl font-bold mt-2 ${accent}`}>{value}</p>
        </div>
        {icon && <i className={`fas ${icon} text-3xl ${accent} opacity-50`} />}
      </div>
    </div>
  );
}
