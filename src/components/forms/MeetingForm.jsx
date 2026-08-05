export default function MeetingForm({ form, setForm, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {['title', 'date', 'time', 'ward'].map((f) => (
        <div key={f}>
          <label className="text-xs text-text-secondary capitalize">{f}</label>
          <input className="cyber-input" type={f === 'date' ? 'date' : 'text'} value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} required />
        </div>
      ))}
      <div>
        <label className="text-xs text-text-secondary">Agenda</label>
        <textarea className="cyber-input" value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} required />
      </div>
      <button type="submit" className="cyber-btn-primary w-full">Schedule</button>
    </form>
  );
}
