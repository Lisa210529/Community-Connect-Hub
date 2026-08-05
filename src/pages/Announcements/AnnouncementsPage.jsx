import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { addItem } from '../../services/localStorageService';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const { getData, refresh } = useData();
  const announcements = getData()?.announcements ?? [];
  const canPost = ['councillor', 'wdc_chairman', 'llg_admin', 'provincial_admin', 'system_admin'].includes(user?.role);

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    priority: 'medium',
    targetAudience: 'ward_only',
    ward: 'Ward 5 Nabasa',
  });

  function postAnnouncement(e) {
    e.preventDefault();
    addItem('announcements', {
      id: `ann_${Date.now()}`,
      ...form,
      createdBy: user.name,
      createdAt: new Date().toISOString(),
      isActive: true,
    });
    refresh();
    setModal(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cyber-accent">Announcements</h1>
          <p className="text-cyber-muted text-sm">Community notices and ward updates</p>
        </div>
        {canPost && (
          <button type="button" onClick={() => setModal(true)} className="cyber-btn-primary">
            <i className="fas fa-bullhorn mr-2" /> Post Announcement
          </button>
        )}
      </div>

      <div className="space-y-3">
        {announcements.filter((a) => a.isActive).map((a) => (
          <div key={a.id} className="cyber-card">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold">{a.title}</h3>
              <StatusBadge status={a.priority} />
            </div>
            <p className="text-cyber-muted text-sm">{a.content}</p>
            <p className="text-xs text-cyber-muted mt-3">
              {a.createdBy} · {a.ward} · {a.targetAudience} · {new Date(a.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Post Announcement" wide>
        <form onSubmit={postAnnouncement} className="space-y-3">
          <div>
            <label className="text-xs text-cyber-muted">Title</label>
            <input className="cyber-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="text-xs text-cyber-muted">Content</label>
            <textarea className="cyber-input min-h-[100px]" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-cyber-muted">Priority</label>
              <select className="cyber-input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {['low', 'medium', 'high'].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-cyber-muted">Audience</label>
              <select className="cyber-input" value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}>
                <option value="ward_only">Ward Only</option>
                <option value="llg">LLG Wide</option>
                <option value="provincial">Provincial</option>
              </select>
            </div>
          </div>
          <button type="submit" className="cyber-btn-primary w-full">Publish</button>
        </form>
      </Modal>
    </div>
  );
}
