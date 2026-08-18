import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import DashboardLayout from '../components/layout/DashboardLayout';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ResidentDashboard from '../pages/Dashboard/ResidentDashboard';
import CouncillorDashboard from '../pages/Dashboard/CouncillorDashboard';
import WDCDashboard from '../pages/Dashboard/WDCDashboard';
import LLGAdminDashboard from '../pages/Dashboard/LLGAdminDashboard';
import ProvincialAdminDashboard from '../pages/Dashboard/ProvincialAdminDashboard';
import StakeholderDashboard from '../pages/Dashboard/StakeholderDashboard';
import SystemAdminDashboard from '../pages/Dashboard/SystemAdminDashboard';
import ProjectsList from '../pages/Projects/ProjectsList';
import RequestsList from '../pages/Requests/RequestsList';
import MeetingsList from '../pages/Meetings/MeetingsList';
import ResolutionsList from '../pages/Resolutions/ResolutionsList';
import AnnouncementsList from '../pages/Announcements/AnnouncementsList';
import ComplaintsList from '../pages/Complaints/ComplaintsList';
import Profile from '../pages/Profile/Profile';
import DocumentGeneratorPage from '../pages/Documents/DocumentGeneratorPage';
import OfficialSignupPage from '../pages/Signup/OfficialSignupPage';
import CouncillorRouteRedirect from '../components/layout/CouncillorRouteRedirect';
import PreRegisterUsersPage from '../pages/admin/PreRegisterUsers';
import ApproveUsersPage from '../pages/admin/ApproveUsers';
import ManageUsersPage from '../pages/admin/ManageUsers';
import AuditLogsPage from '../pages/admin/AuditLogs';
import ReportsPage from '../pages/Reports/ReportsPage';
import MFAVerificationPage from '../pages/Login/MFAVerificationPage';
import AcquittalsList from '../pages/Acquittals/AcquittalsList';

export default function AppRoutes() {
  const { isAuthenticated, dashboardPath } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to={dashboardPath} replace /> : <Login />} />
      <Route path="/login/mfa" element={<MFAVerificationPage />} />
      <Route path="/signup" element={<Register />} />
      <Route path="/signup/official" element={<OfficialSignupPage />} />
      <Route path="/official-register" element={<OfficialSignupPage />} />
      <Route path="/register" element={<Navigate to="/signup" replace />} />

      <Route element={<ProtectedRoute allowedRoles={['system-admin']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin/users" element={<ManageUsersPage />} />
          <Route path="/admin/pre-register" element={<PreRegisterUsersPage />} />
          <Route path="/admin/approvals" element={<ApproveUsersPage />} />
          <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard/resident" element={<ResidentDashboard />} />
          <Route element={<ProtectedRoute allowedRoles={['wdc-member']} />}>
            <Route path="/dashboard/wdc" element={<WDCDashboard />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['councillor', 'councilor']} />}>
            <Route path="/dashboard/councillor" element={<CouncillorDashboard />} />
            <Route path="/dashboard/councillor/:tab" element={<CouncillorDashboard />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['mayor', 'llg_admin']} />}>
            <Route path="/dashboard/mayor" element={<LLGAdminDashboard />} />
            <Route path="/dashboard/mayor/wards" element={<LLGAdminDashboard />} />
            <Route path="/dashboard/mayor/wards/:wardId" element={<LLGAdminDashboard />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['provincial-admin', 'pec']} />}>
            <Route path="/dashboard/pec" element={<ProvincialAdminDashboard />} />
          </Route>
          <Route path="/dashboard/dda" element={<StakeholderDashboard />} />
          <Route path="/dashboard/dda/:tab" element={<StakeholderDashboard />} />
          <Route path="/dashboard/psip" element={<StakeholderDashboard />} />
          <Route path="/dashboard/psip/:tab" element={<StakeholderDashboard />} />
          <Route path="/dashboard/dsip" element={<StakeholderDashboard />} />
          <Route path="/dashboard/dsip/:tab" element={<StakeholderDashboard />} />
          <Route path="/dashboard/ngo" element={<StakeholderDashboard />} />
          <Route path="/dashboard/ngo/:tab" element={<StakeholderDashboard />} />
          <Route path="/dashboard/open-member" element={<StakeholderDashboard />} />
          <Route path="/dashboard/open-member/:tab" element={<StakeholderDashboard />} />
          <Route path="/dashboard/system-admin" element={<SystemAdminDashboard />} />

          {/* Legacy redirects */}
          <Route path="/dashboard/wdc-chairman" element={<Navigate to="/dashboard/wdc" replace />} />
          <Route path="/dashboard/llg-admin" element={<Navigate to="/dashboard/mayor" replace />} />
          <Route path="/dashboard/provincial" element={<Navigate to="/dashboard/pec" replace />} />

          <Route
            path="/projects"
            element={
              <CouncillorRouteRedirect tab="projects">
                <ProjectsList />
              </CouncillorRouteRedirect>
            }
          />
          <Route
            path="/requests"
            element={
              <CouncillorRouteRedirect tab="requests">
                <RequestsList />
              </CouncillorRouteRedirect>
            }
          />
          <Route path="/meetings" element={<MeetingsList />} />
          <Route path="/resolutions" element={<ResolutionsList />} />
          <Route path="/complaints" element={<ComplaintsList />} />
          <Route path="/acquittals" element={<AcquittalsList />} />
          <Route
            path="/announcements"
            element={
              <CouncillorRouteRedirect tab="announcements">
                <AnnouncementsList />
              </CouncillorRouteRedirect>
            }
          />
          <Route
            path="/profile"
            element={
              <CouncillorRouteRedirect tab="profile">
                <Profile />
              </CouncillorRouteRedirect>
            }
          />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/documents" element={<DocumentGeneratorPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
