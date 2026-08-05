export default function RequestForm({ form, setForm, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="text-xs text-text-secondary">Category</label>
        <select className="cyber-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
          <option value="">Select…</option>
          {['Infrastructure', 'Health', 'Education', 'Water & Sanitation', 'DSIP Funding', 'General'].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs text-text-secondary">Description</label>
        <textarea className="cyber-input min-h-[100px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
      </div>
      <div>
        <label className="text-xs text-text-secondary">Document reference (optional)</label>
        <input className="cyber-input" value={form.documents} onChange={(e) => setForm({ ...form, documents: e.target.value })} />
      </div>
      <button type="submit" className="cyber-btn-primary w-full">Submit</button>
    </form>
  );
}
