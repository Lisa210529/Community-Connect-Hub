import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { hasAnyRole } from '../../constants/roleMapping';
import { addItem, updateItem } from '../../services/localStorageService';
import { firestoreService, loadHybridCollection } from '../../services/firestoreService';
import StatusBadge from '../../components/ui/StatusBadge';
import DataSourceIndicator from '../../components/ui/DataSourceIndicator';
import Modal from '../../components/ui/Modal';

export default function MeetingsPage() {
  const { user } = useAuth();
  const wardId = user?.wardId || '';
  const canManage = hasAnyRole(user?.role, ['wdc-member', 'councillor', 'system-admin']);

  const [meetings, setMeetings] = useState([]);
  const [resolutions, setResolutions] = useState([]);
  const [dataSource, setDataSource] = useState('firestore');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    date: '',
    time: '',
    agenda: '',
    ward: 'Ward 5 Nabasa',
  });

  const loadMeetings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await loadHybridCollection('meetings', () =>
        firestoreService.getMeetings(wardId || undefined),
      );
      const resResult = await loadHybridCollection('resolutions', () =>
        firestoreService.getResolutions(wardId || undefined),
      );
      setMeetings(result.data);
      setResolutions(resResult.data);
      setDataSource(result.dataSource);
    } catch (err) {
      setError(err.message || 'Failed to load meetings.');
    } finally {
      setLoading(false);
    }
  }, [wardId]);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  const resolutionCountByMeeting = useMemo(
    () => resolutions.reduce((acc, r) => {
      if (r.meetingId) acc[r.meetingId] = (acc[r.meetingId] ?? 0) + 1;
      return acc;
    }, {}),
    [resolutions],
  );

  async function saveMeeting(e) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      id: `mtg_${Date.now()}`,
      ...form,
      minutes: '',
      attendance: [],
      status: 'Scheduled',
      wardId: user?.wardId || '',
    };

    try {
      await firestoreService.createMeeting(payload);
      setDataSource('firestore');
    } catch (err) {
      addItem('meetings', payload);
      setDataSource((current) => (current === 'firestore' ? 'mixed' : 'localstorage'));
      console.error('Firestore createMeeting failed, saved to localStorage:', err);
    }

    await loadMeetings();
    setSaving(false);
    setModal(null);
  }

  async function updateStatus(id, status) {
    setSaving(true);
    setError('');

    try {
      await firestoreService.updateMeeting(id, { status });
      setDataSource('firestore');
    } catch (err) {
      updateItem('meetings', id, { status });
      setDataSource((current) => (current === 'firestore' ? 'mixed' : 'localstorage'));
      console.error('Firestore updateMeeting failed, updated localStorage:', err);
    }

    await loadMeetings();
    setSaving(false);
  }

  async function saveMinutes(e) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const updates = {
      minutes: selected.minutes,
      attendance: selected.attendanceText?.split(',').map((s) => s.trim()).filter(Boolean) ?? [],
      status: 'Completed',
    };

    try {
      await firestoreService.updateMeeting(selected.id, updates);
      setDataSource('firestore');
    } catch (err) {
      updateItem('meetings', selected.id, updates);
      setDataSource((current) => (current === 'firestore' ? 'mixed' : 'localstorage'));
      console.error('Firestore updateMeeting failed, updated localStorage:', err);
    }

    await loadMeetings();
    setSaving(false);
    setModal(null);
    setSelected(null);
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-cyber-accent">WDC Meetings</h1>
            <DataSourceIndicator source={dataSource} />
          </div>
          <p className="text-cyber-muted text-sm">Schedule meetings, record minutes and attendance</p>
        </div>
        {canManage && (
          <button type="button" onClick={() => setModal('schedule')} className="cyber-btn-primary">
            <i className="fas fa-calendar-plus mr-2" /> Schedule Meeting
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-status-rejected/10 border border-status-rejected/30 text-status-rejected text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-cyber-muted text-sm animate-pulse">Loading meetings…</p>
      ) : (
        <div className="space-y-3">
          {meetings.length === 0 && (
            <p className="text-cyber-muted text-sm">No meetings scheduled.</p>
          )}
          {meetings.map((m) => (
            <div key={m.id} className="cyber-card">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{m.title}</h3>
                    <StatusBadge status={m.status} />
                  </div>
                  <p className="text-cyber-muted text-sm">
                    {m.date} · {m.time} · {m.ward}
                  </p>
                  <p className="text-sm mt-2">
                    <span className="text-cyber-accent">Agenda:</span> {m.agenda}
                  </p>
                  {m.minutes && <p className="text-sm mt-1 text-cyber-muted">Minutes: {m.minutes}</p>}
                  {m.attendance?.length > 0 && (
                    <p className="text-xs text-cyber-muted mt-1">
                      Attendance: {m.attendance.join(', ')}
                    </p>
                  )}
                  <p className="text-xs text-cyber-muted mt-1">
                    Resolutions: {resolutionCountByMeeting[m.id] ?? 0}
                    {(resolutionCountByMeeting[m.id] ?? 0) > 0 && (
                      <>
                        {' · '}
                        <Link to="/resolutions" className="text-cyber-accent hover:underline">
                          View resolutions
                        </Link>
                      </>
                    )}
                  </p>
                </div>
                {canManage && (
                  <div className="flex flex-col gap-2">
                    {m.status === 'Scheduled' && (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => updateStatus(m.id, 'In Progress')}
                        className="cyber-btn-secondary text-sm"
                      >
                        Start
                      </button>
                    )}
                    {(m.status === 'In Progress' || m.status === 'Scheduled') && (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => {
                          setSelected({ ...m, attendanceText: m.attendance?.join(', ') ?? '' });
                          setModal('minutes');
                        }}
                        className="cyber-btn-primary text-sm"
                      >
                        Record Minutes
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal === 'schedule'} onClose={() => setModal(null)} title="Schedule Meeting">
        <form onSubmit={saveMeeting} className="space-y-3">
          {['title', 'date', 'time', 'ward'].map((f) => (
            <div key={f}>
              <label className="text-xs text-cyber-muted capitalize">{f}</label>
              <input
                className="cyber-input"
                type={f === 'date' ? 'date' : 'text'}
                value={form[f]}
                onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                required
              />
            </div>
          ))}
          <div>
            <label className="text-xs text-cyber-muted">Agenda</label>
            <textarea
              className="cyber-input"
              value={form.agenda}
              onChange={(e) => setForm({ ...form, agenda: e.target.value })}
              required
            />
          </div>
          <button type="submit" disabled={saving} className="cyber-btn-primary w-full">
            {saving ? 'Scheduling…' : 'Schedule'}
          </button>
        </form>
      </Modal>

      <Modal open={modal === 'minutes'} onClose={() => setModal(null)} title="Record Minutes" wide>
        <form onSubmit={saveMinutes} className="space-y-3">
          <div>
            <label className="text-xs text-cyber-muted">Minutes</label>
            <textarea
              className="cyber-input min-h-[120px]"
              value={selected?.minutes ?? ''}
              onChange={(e) => setSelected({ ...selected, minutes: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-xs text-cyber-muted">Attendance (comma-separated names)</label>
            <input
              className="cyber-input"
              value={selected?.attendanceText ?? ''}
              onChange={(e) => setSelected({ ...selected, attendanceText: e.target.value })}
            />
          </div>
          <button type="submit" disabled={saving} className="cyber-btn-primary w-full">
            {saving ? 'Saving…' : 'Save & Complete'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
