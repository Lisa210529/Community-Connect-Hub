import { Link } from 'react-router-dom';
import Logo from '../../components/common/Logo';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-bg flex flex-col">
      <header className="border-b border-slate-border px-6 py-4 flex items-center justify-end">
        <div className="flex gap-3">
          <Link to="/login" className="cyber-btn-secondary">
            Login
          </Link>
          <Link to="/signup" className="cyber-btn-primary">
            Sign Up
          </Link>
        </div>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
        <div className="max-w-3xl">
          <Logo size="lg" />
          <p className="text-cyber-accent text-lg mt-4 font-medium">
            Digital Governance &amp; WDC Management System
          </p>
          <p className="text-cyber-muted mt-6 text-lg leading-relaxed">
            Community Connect Hub empowers ward residents, councillors, and government officials
            in Madang Province to track projects, manage service requests, schedule WDC meetings,
            and deliver transparent digital governance — starting with Ward 5 Nabasa.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-10">
            <Link to="/signup" className="cyber-btn-primary px-8">
              Get Started
            </Link>
            <Link to="/login" className="cyber-btn-secondary px-8">
              Sign In
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-4xl w-full">
          {[
            { icon: 'fa-project-diagram', title: 'Project Tracking', desc: 'DSIP, PSIP & ward-funded projects' },
            { icon: 'fa-users', title: 'WDC Governance', desc: 'Meetings, resolutions & member management' },
            { icon: 'fa-chart-line', title: 'Performance', desc: 'Councillor scorecards & ward analytics' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="cyber-card text-left">
              <i className={`fas ${icon} text-cyber-accent text-2xl mb-3`} />
              <h3 className="font-semibold">{title}</h3>
              <p className="text-cyber-muted text-sm mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-border py-4 text-center text-cyber-muted text-sm">
        IS406 Final Year Project — Divine Word University © 2026
      </footer>
    </div>
  );
}
