import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { hasAnyRole } from '../../constants/roleMapping';
import { useData } from '../../context/DataContext';
import { addItem, updateItem } from '../../services/localStorageService';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';

export default function ResolutionsPage() {
  const { user } = useAuth();
  const { getData, refresh } = useData();
  const resolutions = getData()?.resolutions ?? [];
  const meetings = getData()?.meetings ?? [];
  const canManage = hasAnyRole(user?.role, ['wdc-member', 'councillor']);

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: '', meetingId: '', description: '' });

  function createResolution(e) {
    e.preventDefault();
    addItem('resolutions', {
      id: `res_${Date.now()}`,
      ...form,
      status: 'Pending',
      votesFor: 0,
      votesAgainst: 0,
      createdAt: new Date().toISOString(),
    });
    refresh();
    setModal(false);
  }

  function vote(id, approve) {
    const res = resolutions.find((r) => r.id === id);
    updateItem('resolutions', id, {
      votesFor: res.votesFor + (approve ? 1 : 0),
      votesAgainst: res.votesAgainst + (approve ? 0 : 1),
      status: approve ? 'Approved' : res.votesAgainst >= 2 ? 'Rejected' : 'Pending',
    });
    refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cyber-accent">WDC Resolutions</h1>
          <p className="text-cyber-muted text-sm">Create and vote on ward development resolutions</p>
        </div>
        {canManage && (
          <button type="button" onClick={() => setModal(true)} className="cyber-btn-primary">
            <i className="fas fa-gavel mr-2" /> Create Resolution
          </button>
        )}
      </div>

      <div className="space-y-3">
        {resolutions.map((r) => (
          <div key={r.id} className="cyber-card">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{r.title}</h3>
                  <StatusBadge status={r.status} />
                </div>
                <p className="text-cyber-muted text-sm">{r.description}</p>
                <p className="text-xs text-cyber-muted mt-2">
                  Votes: {r.votesFor} for · {r.votesAgainst} against
                </p>
              </div>
              {canManage && r.status === 'Pending' && (
                <div className="flex gap-2">
                  <button type="button" onClick={() => vote(r.id, true)} className="cyber-btn-success text-sm">Vote For</button>
                  <button type="button" onClick={() => vote(r.id, false)} className="cyber-btn-danger text-sm">Vote Against</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Create Resolution">
        <form onSubmit={createResolution} className="space-y-3">
          <div>
            <label className="text-xs text-cyber-muted">Title</label>
            <input className="cyber-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="text-xs text-cyber-muted">Meeting</label>
            <select className="cyber-input" value={form.meetingId} onChange={(e) => setForm({ ...form, meetingId: e.target.value })} required>
              <option value="">Select meeting…</option>
              {meetings.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-cyber-muted">Description</label>
            <textarea className="cyber-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          </div>
          <button type="submit" className="cyber-btn-primary w-full">Create</button>
        </form>
      </Modal>
    </div>
  );
}
