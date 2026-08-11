import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { isCouncillorUser } from '../../constants/roleMapping';

/** Sends councillors to the tabbed dashboard instead of legacy standalone pages. */
export default function CouncillorRouteRedirect({ tab, children }) {
  const { user, role } = useAuth();

  if (isCouncillorUser(user) || isCouncillorUser({ role, position: user?.position })) {
    const path = tab === 'overview' ? '/dashboard/councillor' : `/dashboard/councillor/${tab}`;
    return <Navigate to={path} replace />;
  }

  return children;
}
