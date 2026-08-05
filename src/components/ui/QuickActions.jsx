import { Link } from 'react-router-dom';

export default function QuickActions({ actions }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {actions.map(({ label, to, icon, onClick }) =>
        onClick ? (
          <button
            key={label}
            type="button"
            onClick={onClick}
            className="cyber-card text-left hover:border-cyber-accent transition-colors group"
          >
            <i className={`fas ${icon} text-cyber-accent mb-2 group-hover:scale-110 transition-transform`} />
            <p className="text-sm font-medium">{label}</p>
          </button>
        ) : (
          <Link
            key={label}
            to={to}
            className="cyber-card text-left hover:border-cyber-accent transition-colors group block"
          >
            <i className={`fas ${icon} text-cyber-accent mb-2 group-hover:scale-110 transition-transform`} />
            <p className="text-sm font-medium">{label}</p>
          </Link>
        ),
      )}
    </div>
  );
}
