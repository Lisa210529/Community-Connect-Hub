import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <Outlet />
      </div>
    </div>
  );
}
