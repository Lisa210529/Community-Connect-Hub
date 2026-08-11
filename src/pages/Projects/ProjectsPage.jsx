import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { hasAnyRole } from '../../constants/roleMapping';
import { matchesWard } from '../../utils/wdcHelpers';
import { updateItem, deleteItem, addItem } from '../../services/localStorageService';
import { firestoreService, loadHybridCollection } from '../../services/firestoreService';
import { PROJECT_STATUSES } from '../../constants';
import StatusBadge from '../../components/ui/StatusBadge';
import DataSourceIndicator from '../../components/ui/DataSourceIndicator';
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
  const wardId = user?.wardId || '';
  const canEdit = hasAnyRole(user?.role, [
    'councillor',
    'mayor',
    'pec',
    'provincial-admin',
    'dda',
    'psip',
    'dsip',
    'system-admin',
  ]);

  const [projects, setProjects] = useState([]);
  const [dataSource, setDataSource] = useState('firestore');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await loadHybridCollection('projects', () =>
        firestoreService.getProjects(),
      );
      const isResident = hasAnyRole(user?.role, ['resident']);
      const filtered = isResident || wardId
        ? result.data.filter((p) => matchesWard(p, user))
        : result.data;
      setProjects(filtered);
      setDataSource(result.dataSource);
    } catch (err) {
      setError(err.message || 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  }, [wardId, user]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  function openAdd() {
    setForm(EMPTY);
    setModal('form');
  }

  function openEdit(project) {
    setForm({ ...project, budget: String(project.budget) });
    setModal('form');
  }

  async function saveProject(e) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      ...form,
      budget: Number(form.budget),
      dateLogged: form.dateLogged || new Date().toISOString(),
      loggedBy: user?.name,
      wardId: form.wardId || user?.wardId || '',
    };

    try {
      if (form.id) {
        await firestoreService.updateProject(form.id, payload);
      } else {
        await firestoreService.createProject({ ...payload, id: `proj_${Date.now()}` });
      }
      setDataSource('firestore');
    } catch (err) {
      if (form.id) {
        updateItem('projects', form.id, payload);
      } else {
        addItem('projects', { ...payload, id: `proj_${Date.now()}` });
      }
      setDataSource((current) => (current === 'firestore' ? 'mixed' : 'localstorage'));
      console.error('Firestore project save failed, saved to localStorage:', err);
    }

    await loadProjects();
    setSaving(false);
    setModal(null);
  }

  async function confirmDelete() {
    setSaving(true);
    setError('');

    try {
      await firestoreService.deleteProject(deleteId);
      setDataSource('firestore');
    } catch (err) {
      deleteItem('projects', deleteId);
      setDataSource((current) => (current === 'firestore' ? 'mixed' : 'localstorage'));
      console.error('Firestore deleteProject failed, deleted from localStorage:', err);
    }

    await loadProjects();
    setSaving(false);
    setDeleteId(null);
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-cyber-accent">Projects</h1>
            <DataSourceIndicator source={dataSource} />
          </div>
          <p className="text-cyber-muted text-sm">{projects.length} ward development projects</p>
        </div>
        {canEdit && (
          <button type="button" onClick={openAdd} className="cyber-btn-primary">
            <i className="fas fa-plus mr-2" /> Add Project
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-status-rejected/10 border border-status-rejected/30 text-status-rejected text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-cyber-muted text-sm animate-pulse">Loading projects…</p>
      ) : (
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
                  <td className="py-3 pr-4">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="py-3 pr-4">K{p.budget?.toLocaleString()}</td>
                  <td className="py-3 pr-4 text-cyber-muted">{p.fundingSource}</td>
                  <td className="py-3 pr-4 text-cyber-muted">{p.location}</td>
                  <td className="py-3 pr-4 text-cyber-muted">
                    {new Date(p.dateLogged).toLocaleDateString()}
                  </td>
                  <td className="py-3 space-x-2">
                    {canEdit && (
                      <>
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          className="text-cyber-accent text-xs hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(p.id)}
                          className="text-status-rejected text-xs hover:underline"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal === 'form'} onClose={() => setModal(null)} title={form.id ? 'Edit Project' : 'Add Project'} wide>
        <form onSubmit={saveProject} className="space-y-3">
          {['name', 'category', 'location', 'fundingSource', 'ward', 'description'].map((field) => (
            <div key={field}>
              <label className="text-xs text-cyber-muted capitalize">{field}</label>
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
              <label className="text-xs text-cyber-muted">Budget (K)</label>
              <input
                type="number"
                className="cyber-input"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-xs text-cyber-muted">Status</label>
              <select
                className="cyber-input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" disabled={saving} className="cyber-btn-primary w-full mt-2">
            {saving ? 'Saving…' : 'Save Project'}
          </button>
        </form>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Confirm Delete">
        <p className="text-cyber-muted mb-4">Delete this project permanently?</p>
        <div className="flex gap-3">
          <button type="button" disabled={saving} onClick={confirmDelete} className="cyber-btn-danger flex-1">
            Delete
          </button>
          <button type="button" onClick={() => setDeleteId(null)} className="cyber-btn-secondary flex-1">
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}
