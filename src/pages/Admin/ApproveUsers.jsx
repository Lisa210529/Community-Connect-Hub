import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../constants';
import {
  fetchPendingResidents,
  approveUser,
  rejectUser,
} from '../../services/authService';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';

export default function ApproveUsersPage() {
  const { user } = useAuth();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadPending = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const users = await fetchPendingResidents();
      setPending(users);
    } catch (err) {
      setError(err.message ?? 'Failed to load pending users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  async function handleApprove(uid) {
    try {
      await approveUser(uid, user?.uid);
      await loadPending();
    } catch (err) {
      setError(err.message ?? 'Failed to approve user.');
    }
  }

  async function confirmReject() {
    if (!rejectId) return;
    try {
      await rejectUser(rejectId, rejectReason);
      setRejectId(null);
      setRejectReason('');
      await loadPending();
    } catch (err) {
      setError(err.message ?? 'Failed to reject user.');
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/dashboard/system-admin" className="text-cyber-accent text-sm hover:underline">
          ← Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-cyber-accent mt-2">Pending Resident Approvals</h1>
        <p className="text-cyber-muted text-sm">{pending.length} residents awaiting approval</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-status-rejected/10 border border-status-rejected/30 text-status-rejected text-sm">
          {error}
        </div>
      )}

      <div className="cyber-card overflow-x-auto">
        {loading ? (
          <p className="text-cyber-muted text-center py-8">Loading…</p>
        ) : pending.length === 0 ? (
          <p className="text-cyber-muted text-center py-8">No pending approvals.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-cyber-muted border-b border-slate-border text-left">
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">NID</th>
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">Ward</th>
                <th className="pb-3 pr-4">Registered</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((u) => (
                <tr key={u.uid} className="border-b border-slate-border/50">
                  <td className="py-3 pr-4 font-medium">{u.name}</td>
                  <td className="py-3 pr-4 font-mono">{u.nid}</td>
                  <td className="py-3 pr-4">{u.email}</td>
                  <td className="py-3 pr-4 text-cyber-muted">{u.ward}</td>
                  <td className="py-3 pr-4 text-cyber-muted">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-3 space-x-2">
                    <button
                      type="button"
                      onClick={() => handleApprove(u.uid)}
                      className="cyber-btn-success text-xs"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => setRejectId(u.uid)}
                      className="cyber-btn-danger text-xs"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={!!rejectId} onClose={() => setRejectId(null)} title="Reject Registration">
        <p className="text-cyber-muted text-sm mb-3">Provide a reason for rejection (optional):</p>
        <textarea
          className="cyber-input min-h-[80px]"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Reason…"
        />
        <div className="flex gap-3 mt-4">
          <button type="button" onClick={confirmReject} className="cyber-btn-danger flex-1">
            Confirm Reject
          </button>
          <button type="button" onClick={() => setRejectId(null)} className="cyber-btn-secondary flex-1">
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}
