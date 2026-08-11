import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { hasAnyRole } from '../../constants/roleMapping';

export default function AdminPage() {
  const { role } = useAuth();

  if (!hasAnyRole(role, ['system-admin'])) {
    return <Navigate to="/" replace />;
  }

  return (
    <section className="page-section active">
      <div className="card-custom">
        <div className="card-header">System Administration</div>
        <div className="card-body">
          <p className="text-muted mb-0">
            User approvals, system configuration, MFA security, and analytics.
          </p>
        </div>
      </div>
    </section>
  );
}
