import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { addItem, updateItem } from '../../services/localStorageService';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';

export default function RequestsPage() {
  const { user } = useAuth();
  const { getData, refresh } = useData();
  const requests = getData()?.requests ?? [];
  const isResident = user?.role === 'resident';
  const isCouncillor = user?.role === 'councillor';

  const visible = isResident
    ? requests.filter((r) => r.residentId === user.id)
    : requests;

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ category: '', description: '', documents: '' });

  function submitRequest(e) {
    e.preventDefault();
    addItem('requests', {
      id: `req_${Date.now()}`,
      ...form,
      documents: form.documents ? [form.documents] : [],
      status: 'Pending',
      residentId: user.id,
      residentName: user.name,
      ward: user.ward,
      createdAt: new Date().toISOString(),
    });
    refresh();
    setModal(false);
    setForm({ category: '', description: '', documents: '' });
  }

  function handleAction(id, status) {
    updateItem('requests', id, { status });
    refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cyber-accent">Service Requests</h1>
          <p className="text-cyber-muted text-sm">Track ward service requests and funding applications</p>
        </div>
        {isResident && (
          <button type="button" onClick={() => setModal(true)} className="cyber-btn-primary">
            <i className="fas fa-plus mr-2" /> Submit Request
          </button>
        )}
      </div>

      <div className="space-y-3">
        {visible.map((r) => (
          <div key={r.id} className="cyber-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{r.category}</h3>
                  <StatusBadge status={r.status} />
                </div>
                <p className="text-cyber-muted text-sm">{r.description}</p>
                <p className="text-xs text-cyber-muted mt-2">
                  {r.residentName} · {r.ward} · {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </div>
              {isCouncillor && r.status === 'Pending' && (
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleAction(r.id, 'In Progress')} className="cyber-btn-success text-sm">Accept</button>
                  <button type="button" onClick={() => handleAction(r.id, 'Rejected')} className="cyber-btn-danger text-sm">Reject</button>
                </div>
              )}
              {isCouncillor && r.status === 'In Progress' && (
                <button type="button" onClick={() => handleAction(r.id, 'Resolved')} className="cyber-btn-primary text-sm">Mark Resolved</button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Submit Service Request">
        <form onSubmit={submitRequest} className="space-y-3">
          <div>
            <label className="text-xs text-cyber-muted">Category</label>
            <select className="cyber-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
              <option value="">Select…</option>
              {['Infrastructure', 'Health', 'Education', 'Water & Sanitation', 'DSIP Funding', 'General'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-cyber-muted">Description</label>
            <textarea className="cyber-input min-h-[100px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          </div>
          <div>
            <label className="text-xs text-cyber-muted">Document reference (optional)</label>
            <input className="cyber-input" value={form.documents} onChange={(e) => setForm({ ...form, documents: e.target.value })} placeholder="File name or reference" />
          </div>
          <button type="submit" className="cyber-btn-primary w-full">Submit</button>
        </form>
      </Modal>
    </div>
  );
}
