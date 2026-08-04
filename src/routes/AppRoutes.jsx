import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import AppLayout from '../components/layout/AppLayout';
import AuthLayout from '../components/layout/AuthLayout';
import HomePage from '../pages/Home/HomePage';
import LoginPage from '../pages/Login/LoginPage';
import RegisterPage from '../pages/Register/RegisterPage';
import ResidentPage from '../pages/Resident/ResidentPage';
import WDCPage from '../pages/WDC/WDCPage';
import GovernmentPage from '../pages/Government/GovernmentPage';
import ProjectsPage from '../pages/Projects/ProjectsPage';
import ReportsPage from '../pages/Reports/ReportsPage';
import FeedbackPage from '../pages/Feedback/FeedbackPage';
import AdminPage from '../pages/Admin/AdminPage';
import LoadingSpinner from '../components/common/LoadingSpinner';

function RootRedirect() {
  const { isAuthenticated, loading, role } = useAuth();
  if (loading) return <LoadingSpinner fullPage />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role === 'system_admin') return <Navigate to="/admin" replace />;
  if (role?.startsWith('wdc_')) return <Navigate to="/wdc" replace />;
  if (['councillor', 'llg_admin', 'dda_officer', 'provincial_admin'].includes(role)) {
    return <Navigate to="/government" replace />;
  }
  return <Navigate to="/resident" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/resident" element={<ResidentPage />} />
          <Route path="/wdc" element={<WDCPage />} />
          <Route path="/government" element={<GovernmentPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
