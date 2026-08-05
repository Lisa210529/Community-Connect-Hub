import { PROJECT_STATUSES } from '../../constants';

export default function ProjectForm({ form, setForm, onSubmit, submitLabel = 'Save Project' }) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {['name', 'category', 'location', 'fundingSource', 'ward', 'description'].map((field) => (
        <div key={field}>
          <label className="text-xs text-text-secondary capitalize">{field}</label>
          <input
            className="cyber-input"
            value={form[field] ?? ''}
            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            required={field !== 'description'}
          />
        </div>
      ))}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-text-secondary">Budget (K)</label>
          <input type="number" className="cyber-input" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} required />
        </div>
        <div>
          <label className="text-xs text-text-secondary">Status</label>
          <select className="cyber-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <button type="submit" className="cyber-btn-primary w-full mt-2">{submitLabel}</button>
    </form>
  );
}
