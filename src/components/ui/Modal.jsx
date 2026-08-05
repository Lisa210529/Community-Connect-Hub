export default function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div
        className={`cyber-card w-full shadow-glow max-h-[90vh] overflow-y-auto ${wide ? 'max-w-2xl' : 'max-w-lg'}`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-cyber-accent">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-cyber-muted hover:text-cyber-text text-xl leading-none"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
