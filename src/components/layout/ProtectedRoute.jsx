import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { hasAnyRole, isCouncillorUser, normalizeRole } from '../../constants/roleMapping';

export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, loading, role, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-primary animate-pulse">Loading…</div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const roleAllowed = !allowedRoles?.length || hasAnyRole(role, allowedRoles);
  const councillorRouteAllowed =
    allowedRoles?.some((r) => normalizeRole(r) === 'councillor') && isCouncillorUser(user);

  if (!roleAllowed && !councillorRouteAllowed) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
