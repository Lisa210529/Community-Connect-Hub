import { Link } from 'react-router-dom';

export default function AuthLogo() {
  return (
    <div className="auth-logo">
      <h1>
        <i className="fas fa-hub" /> Community Connect Hub
      </h1>
      <p>Ward Development &amp; Community Engagement</p>
      <div className="badge-container">
        <span className="badge bg-primary">IS406 Project</span>
      </div>
    </div>
  );
}

export function AuthFooterLink({ text, linkText, to }) {
  return (
    <div className="auth-footer">
      {text}{' '}
      <Link to={to}>{linkText}</Link>
    </div>
  );
}
