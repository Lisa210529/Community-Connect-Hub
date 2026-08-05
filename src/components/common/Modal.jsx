export default function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div
        className={`bg-card border border-border rounded-xl p-6 w-full shadow-glow max-h-[90vh] overflow-y-auto ${wide ? 'max-w-2xl' : 'max-w-lg'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-primary">{title}</h3>
          <button type="button" onClick={onClose} className="text-text-secondary hover:text-text-primary text-xl">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
