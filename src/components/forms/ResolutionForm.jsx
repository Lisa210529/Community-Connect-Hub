export default function ResolutionForm({ form, setForm, meetings, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="text-xs text-text-secondary">Title</label>
        <input className="cyber-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
      </div>
      <div>
        <label className="text-xs text-text-secondary">Meeting</label>
        <select className="cyber-input" value={form.meetingId} onChange={(e) => setForm({ ...form, meetingId: e.target.value })} required>
          <option value="">Select meeting…</option>
          {meetings.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-text-secondary">Description</label>
        <textarea className="cyber-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
      </div>
      <button type="submit" className="cyber-btn-primary w-full">Create</button>
    </form>
  );
}
