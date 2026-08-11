import { Link } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import heroBackground from '../../assets/images/madang-provincial-government-bg.png';

export default function HomePage() {
  return (
    <div className="relative min-h-screen flex flex-col">
      <div
        className="fixed inset-0 -z-20 bg-cover bg-no-repeat bg-[center_35%]"
        style={{ backgroundImage: `url(${heroBackground})` }}
        aria-hidden="true"
      />
      <div className="fixed inset-0 -z-10 bg-slate-950/70" aria-hidden="true" />

      <section className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
        <div className="max-w-3xl">
          <Logo size="lg" />
          <p className="text-white text-xl mt-6 font-semibold tracking-wide">
            Digital Governance &amp; WDC Management System
          </p>
          <p className="text-white/85 mt-6 text-lg leading-relaxed">
            Community Connect Hub empowers ward residents, councillors, and government officials
            in Madang Province to track projects, manage service requests, schedule WDC meetings,
            and deliver transparent digital governance — starting with Ward 5 Nabasa.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-10">
            <Link to="/signup" className="cyber-btn-primary px-8">
              Get Started
            </Link>
            <Link to="/login" className="cyber-btn-secondary px-8">
              Login
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-4xl w-full">
          {[
            { icon: 'fa-project-diagram', title: 'Project Tracking', desc: 'DSIP, PSIP & ward-funded projects' },
            { icon: 'fa-users', title: 'WDC Governance', desc: 'Meetings, resolutions & member management' },
            { icon: 'fa-chart-line', title: 'Performance', desc: 'Councillor scorecards & ward analytics' },
          ].map(({ icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl border border-white/10 bg-slate-950/55 backdrop-blur-md p-6 text-left shadow-lg"
            >
              <i className={`fas ${icon} text-cyber-accent text-2xl mb-3`} />
              <h3 className="font-semibold text-white">{title}</h3>
              <p className="text-white/75 text-sm mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 py-4 text-center text-white/60 text-sm bg-slate-950/40 backdrop-blur-sm">
        IS406 Final Year Project — Divine Word University © 2026
      </footer>
    </div>
  );
}
