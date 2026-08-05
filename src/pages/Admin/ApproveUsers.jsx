import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { ROLES } from '../../constants';
import { updateItem, addAuditLog } from '../../services/localStorageService';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';

export default function ApproveUsersPage() {
  const { user } = useAuth();
  const { getData, refresh } = useData();
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const pending = (getData()?.users ?? [])
    .filter((u) => !u.isApproved && u.role === 'resident')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  function handleApprove(id) {
    updateItem('users', id, {
      isApproved: true,
      isActive: true,
      approvedBy: user?.id,
      updatedAt: new Date().toISOString(),
    });
    const target = pending.find((u) => u.id === id);
    addAuditLog(
      'USER_APPROVED',
      user?.name,
      user?.role,
      `Approved resident ${target?.name} (NID: ${target?.nid})`,
    );
    refresh();
  }

  function confirmReject() {
    if (!rejectId) return;
    const target = pending.find((u) => u.id === rejectId);
    updateItem('users', rejectId, {
      isApproved: false,
      isActive: false,
      rejectionReason: rejectReason,
      updatedAt: new Date().toISOString(),
    });
    addAuditLog(
      'USER_REJECTED',
      user?.name,
      user?.role,
      `Rejected ${target?.name}: ${rejectReason || 'No reason given'}`,
    );
    setRejectId(null);
    setRejectReason('');
    refresh();
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

      <div className="cyber-card overflow-x-auto">
        {pending.length === 0 ? (
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
                <tr key={u.id} className="border-b border-slate-border/50">
                  <td className="py-3 pr-4 font-medium">{u.name}</td>
                  <td className="py-3 pr-4 font-mono">{u.nid}</td>
                  <td className="py-3 pr-4">{u.email}</td>
                  <td className="py-3 pr-4 text-cyber-muted">{u.ward}</td>
                  <td className="py-3 pr-4 text-cyber-muted">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 space-x-2">
                    <button
                      type="button"
                      onClick={() => handleApprove(u.id)}
                      className="cyber-btn-success text-xs"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => setRejectId(u.id)}
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
