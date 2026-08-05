import { useData } from '../../context/DataContext';
import StatCard from '../../components/ui/StatCard';

export default function ReportsPage() {
  const { getData } = useData();
  const data = getData();
  const projects = data?.projects ?? [];
  const requests = data?.requests ?? [];

  const funded = projects.filter((p) => p.status === 'Funded' || p.status === 'Completed').length;
  const pending = projects.filter((p) => p.status?.includes('Pending')).length;
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-cyber-accent mb-6">Reports &amp; Analytics</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Projects" value={projects.length} icon="fa-folder-open" />
        <StatCard label="Funded / Completed" value={funded} icon="fa-check-circle" accent="text-status-completed" />
        <StatCard label="Pending Approval" value={pending} icon="fa-clock" accent="text-status-pending" />
        <StatCard label="Total Budget (K)" value={totalBudget.toLocaleString()} icon="fa-money-bill" />
      </div>

      <div className="cyber-card">
        <h2 className="font-semibold mb-4">Request Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Pending', 'In Progress', 'Resolved', 'Rejected'].map((status) => (
            <div key={status} className="text-center p-4 bg-slate-bg rounded-lg">
              <p className="text-2xl font-bold text-cyber-accent">
                {requests.filter((r) => r.status === status).length}
              </p>
              <p className="text-xs text-cyber-muted">{status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
