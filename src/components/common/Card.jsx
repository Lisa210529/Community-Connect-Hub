export default function Card({ children, className = '', title, action }) {
  return (
    <div className={`bg-card border border-border rounded-xl p-6 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="font-semibold text-text-primary">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
