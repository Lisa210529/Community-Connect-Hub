import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { addItem, updateItem } from '../../services/localStorageService';
import { MEETING_STATUSES } from '../../constants';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';

export default function MeetingsPage() {
  const { user } = useAuth();
  const { getData, refresh } = useData();
  const meetings = getData()?.meetings ?? [];
  const canManage = ['wdc_chairman', 'councillor', 'system_admin'].includes(user?.role);

  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ title: '', date: '', time: '', agenda: '', ward: 'Ward 5 Nabasa' });

  function saveMeeting(e) {
    e.preventDefault();
    addItem('meetings', {
      id: `mtg_${Date.now()}`,
      ...form,
      minutes: '',
      attendance: [],
      status: 'Scheduled',
    });
    refresh();
    setModal(null);
  }

  function updateStatus(id, status) {
    updateItem('meetings', id, { status });
    refresh();
  }

  function saveMinutes(e) {
    e.preventDefault();
    updateItem('meetings', selected.id, {
      minutes: selected.minutes,
      attendance: selected.attendanceText?.split(',').map((s) => s.trim()).filter(Boolean) ?? [],
      status: 'Completed',
    });
    refresh();
    setModal(null);
    setSelected(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-cyber-accent">WDC Meetings</h1>
          <p className="text-cyber-muted text-sm">Schedule meetings, record minutes and attendance</p>
        </div>
        {canManage && (
          <button type="button" onClick={() => setModal('schedule')} className="cyber-btn-primary">
            <i className="fas fa-calendar-plus mr-2" /> Schedule Meeting
          </button>
        )}
      </div>

      <div className="space-y-3">
        {meetings.map((m) => (
          <div key={m.id} className="cyber-card">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{m.title}</h3>
                  <StatusBadge status={m.status} />
                </div>
                <p className="text-cyber-muted text-sm">{m.date} · {m.time} · {m.ward}</p>
                <p className="text-sm mt-2"><span className="text-cyber-accent">Agenda:</span> {m.agenda}</p>
                {m.minutes && <p className="text-sm mt-1 text-cyber-muted">Minutes: {m.minutes}</p>}
                {m.attendance?.length > 0 && (
                  <p className="text-xs text-cyber-muted mt-1">Attendance: {m.attendance.join(', ')}</p>
                )}
              </div>
              {canManage && (
                <div className="flex flex-col gap-2">
                  {m.status === 'Scheduled' && (
                    <button type="button" onClick={() => updateStatus(m.id, 'In Progress')} className="cyber-btn-secondary text-sm">Start</button>
                  )}
                  {(m.status === 'In Progress' || m.status === 'Scheduled') && (
                    <button type="button" onClick={() => { setSelected({ ...m, attendanceText: m.attendance?.join(', ') ?? '' }); setModal('minutes'); }} className="cyber-btn-primary text-sm">Record Minutes</button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal open={modal === 'schedule'} onClose={() => setModal(null)} title="Schedule Meeting">
        <form onSubmit={saveMeeting} className="space-y-3">
          {['title', 'date', 'time', 'ward'].map((f) => (
            <div key={f}>
              <label className="text-xs text-cyber-muted capitalize">{f}</label>
              <input className="cyber-input" type={f === 'date' ? 'date' : 'text'} value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} required />
            </div>
          ))}
          <div>
            <label className="text-xs text-cyber-muted">Agenda</label>
            <textarea className="cyber-input" value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} required />
          </div>
          <button type="submit" className="cyber-btn-primary w-full">Schedule</button>
        </form>
      </Modal>

      <Modal open={modal === 'minutes'} onClose={() => setModal(null)} title="Record Minutes" wide>
        <form onSubmit={saveMinutes} className="space-y-3">
          <div>
            <label className="text-xs text-cyber-muted">Minutes</label>
            <textarea className="cyber-input min-h-[120px]" value={selected?.minutes ?? ''} onChange={(e) => setSelected({ ...selected, minutes: e.target.value })} required />
          </div>
          <div>
            <label className="text-xs text-cyber-muted">Attendance (comma-separated names)</label>
            <input className="cyber-input" value={selected?.attendanceText ?? ''} onChange={(e) => setSelected({ ...selected, attendanceText: e.target.value })} />
          </div>
          <button type="submit" className="cyber-btn-primary w-full">Save &amp; Complete</button>
        </form>
      </Modal>
    </div>
  );
}
