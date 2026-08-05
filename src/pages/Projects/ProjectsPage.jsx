import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { updateItem, deleteItem, addItem } from '../../services/localStorageService';
import { PROJECT_STATUSES } from '../../constants';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';

const EMPTY = {
  name: '',
  category: '',
  status: 'Pending WDC',
  budget: '',
  fundingSource: '',
  location: '',
  ward: 'Ward 5 Nabasa',
  description: '',
};

export default function ProjectsPage() {
  const { user } = useAuth();
  const { getData, refresh } = useData();
  const data = getData();
  const projects = data?.projects ?? [];
  const canEdit = ['councillor', 'mayor', 'pec', 'dda', 'psip', 'dsip', 'system-admin'].includes(user?.role);

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteId, setDeleteId] = useState(null);

  function openAdd() {
    setForm(EMPTY);
    setModal('form');
  }

  function openEdit(project) {
    setForm({ ...project, budget: String(project.budget) });
    setModal('form');
  }

  function saveProject(e) {
    e.preventDefault();
    const payload = {
      ...form,
      budget: Number(form.budget),
      dateLogged: form.dateLogged || new Date().toISOString(),
      loggedBy: user?.name,
    };
    if (form.id) {
      updateItem('projects', form.id, payload);
    } else {
      addItem('projects', { ...payload, id: `proj_${Date.now()}` });
    }
    refresh();
    setModal(null);
  }

  function confirmDelete() {
    deleteItem('projects', deleteId);
    refresh();
    setDeleteId(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cyber-accent">Projects</h1>
          <p className="text-cyber-muted text-sm">{projects.length} ward development projects</p>
        </div>
        {canEdit && (
          <button type="button" onClick={openAdd} className="cyber-btn-primary">
            <i className="fas fa-plus mr-2" /> Add Project
          </button>
        )}
      </div>

      <div className="cyber-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-cyber-muted border-b border-slate-border text-left">
              <th className="pb-3 pr-4">Name</th>
              <th className="pb-3 pr-4">Category</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3 pr-4">Budget</th>
              <th className="pb-3 pr-4">Funding</th>
              <th className="pb-3 pr-4">Location</th>
              <th className="pb-3 pr-4">Date</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} className="border-b border-slate-border/50 hover:bg-slate-bg/50">
                <td className="py-3 pr-4 font-medium">{p.name}</td>
                <td className="py-3 pr-4 text-cyber-muted">{p.category}</td>
                <td className="py-3 pr-4"><StatusBadge status={p.status} /></td>
                <td className="py-3 pr-4">K{p.budget?.toLocaleString()}</td>
                <td className="py-3 pr-4 text-cyber-muted">{p.fundingSource}</td>
                <td className="py-3 pr-4 text-cyber-muted">{p.location}</td>
                <td className="py-3 pr-4 text-cyber-muted">{new Date(p.dateLogged).toLocaleDateString()}</td>
                <td className="py-3 space-x-2">
                  {canEdit && (
                    <>
                      <button type="button" onClick={() => openEdit(p)} className="text-cyber-accent text-xs hover:underline">Edit</button>
                      <button type="button" onClick={() => setDeleteId(p.id)} className="text-status-rejected text-xs hover:underline">Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal === 'form'} onClose={() => setModal(null)} title={form.id ? 'Edit Project' : 'Add Project'} wide>
        <form onSubmit={saveProject} className="space-y-3">
          {['name', 'category', 'location', 'fundingSource', 'ward', 'description'].map((field) => (
            <div key={field}>
              <label className="text-xs text-cyber-muted capitalize">{field}</label>
              <input className="cyber-input" value={form[field] ?? ''} onChange={(e) => setForm({ ...form, [field]: e.target.value })} required={field !== 'description'} />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-cyber-muted">Budget (K)</label>
              <input type="number" className="cyber-input" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs text-cyber-muted">Status</label>
              <select className="cyber-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="cyber-btn-primary w-full mt-2">Save Project</button>
        </form>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Confirm Delete">
        <p className="text-cyber-muted mb-4">Delete this project permanently?</p>
        <div className="flex gap-3">
          <button type="button" onClick={confirmDelete} className="cyber-btn-danger flex-1">Delete</button>
          <button type="button" onClick={() => setDeleteId(null)} className="cyber-btn-secondary flex-1">Cancel</button>
        </div>
      </Modal>
    </div>
  );
}
