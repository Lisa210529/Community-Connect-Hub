import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { resolveWardId } from '../../utils/wdcHelpers';
import StatCard from '../../components/ui/StatCard';
import DataSourceIndicator from '../../components/ui/DataSourceIndicator';
import { reportService } from '../../services/reportService';

const REPORT_TYPES = [
  { id: 'project', label: 'Project Report', icon: 'fa-folder-open' },
  { id: 'performance', label: 'Performance Monitoring', icon: 'fa-tachometer-alt' },
  { id: 'funding', label: 'Funding Report', icon: 'fa-hand-holding-usd' },
  { id: 'satisfaction', label: 'Resident Satisfaction', icon: 'fa-star' },
];

export default function ReportsPage() {
  const { user } = useAuth();
  const wardId = resolveWardId(user);
  const wardLabel = user?.ward ?? 'Madang Province';

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [data, setData] = useState({ projects: [], requests: [], ratings: [], fundingRequests: [] });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await reportService.loadReportData(wardId || undefined);
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to load report data.');
    } finally {
      setLoading(false);
    }
  }, [wardId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const metrics = useMemo(() => {
    const { projects, requests, ratings } = data;
    const funded = projects.filter((p) => ['Funded', 'Completed'].includes(p.status)).length;
    const pending = projects.filter((p) => String(p.status ?? '').includes('Pending')).length;
    const totalBudget = projects.reduce((sum, p) => sum + Number(p.budget ?? 0), 0);
    const completed = projects.filter((p) => String(p.status).toLowerCase() === 'completed').length;
    const completionRate = projects.length ? Math.round((completed / projects.length) * 100) : 0;
    const resolved = requests.filter((r) => String(r.status).toLowerCase() === 'resolved').length;
    const responseRate = requests.length ? Math.round((resolved / requests.length) * 100) : 0;
    const avgRating = ratings.length
      ? (ratings.reduce((sum, r) => sum + Number(r.overallScore ?? r.score ?? 0), 0) / ratings.length).toFixed(1)
      : '—';

    return { funded, pending, totalBudget, completionRate, responseRate, avgRating };
  }, [data]);

  async function handleExport(type) {
    setExporting(type);
    setError('');
    setSuccessMessage('');
    try {
      const { projects, requests, ratings, fundingRequests } = data;
      let content = '';
      let title = '';
      let template = '';

      switch (type) {
        case 'project':
          content = reportService.buildProjectReportContent(projects, wardLabel);
          title = 'Project Report';
          template = 'Project Report';
          break;
        case 'performance':
          content = reportService.buildPerformanceReportContent(projects, requests, ratings);
          title = 'Performance Monitoring Report';
          template = 'Performance Report';
          break;
        case 'funding':
          content = reportService.buildFundingReportContent(fundingRequests, projects);
          title = 'Funding Report';
          template = 'Funding Report';
          break;
        case 'satisfaction':
          content = reportService.buildSatisfactionReportContent(ratings);
          title = 'Resident Satisfaction Report';
          template = 'Satisfaction Report';
          break;
        default:
          break;
      }

      await reportService.exportReportPdf({
        title,
        content,
        wardLabel,
        authorName: user?.name ?? user?.fullName,
        template,
      });
      setSuccessMessage(`${title} exported as PDF.`);
    } catch (err) {
      setError(err.message || 'Failed to export PDF.');
    } finally {
      setExporting('');
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-1">
        <h1 className="text-2xl font-bold text-cyber-accent">Reports &amp; Performance Monitoring</h1>
        <DataSourceIndicator source="firestore" />
      </div>
      <p className="text-cyber-muted text-sm mb-6">
        Real-time metrics from Firestore — export official PDF reports
      </p>

      {successMessage && (
        <div className="mb-4 p-3 rounded-lg bg-status-completed/10 border border-status-completed/30 text-status-completed text-sm">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-status-rejected/10 border border-status-rejected/30 text-status-rejected text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-cyber-muted text-sm animate-pulse">Loading performance data…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Projects" value={data.projects.length} icon="fa-folder-open" />
            <StatCard label="Funded / Completed" value={metrics.funded} icon="fa-check-circle" accent="text-status-completed" />
            <StatCard label="Completion Rate" value={`${metrics.completionRate}%`} icon="fa-chart-line" accent="text-cyber-accent" />
            <StatCard label="Avg Satisfaction" value={`${metrics.avgRating}/5`} icon="fa-star" accent="text-status-pending" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Pending Approval" value={metrics.pending} icon="fa-clock" accent="text-status-pending" />
            <StatCard label="Request Response Rate" value={`${metrics.responseRate}%`} icon="fa-reply" />
            <StatCard label="Total Budget (K)" value={metrics.totalBudget.toLocaleString()} icon="fa-money-bill" />
            <StatCard label="Ratings Collected" value={data.ratings.length} icon="fa-star-half-alt" />
          </div>

          <section className="cyber-card mb-6">
            <h2 className="font-semibold mb-4">Request Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Pending', 'In Progress', 'Resolved', 'Rejected'].map((status) => (
                <div key={status} className="text-center p-4 bg-slate-bg rounded-lg">
                  <p className="text-2xl font-bold text-cyber-accent">
                    {data.requests.filter((r) => r.status === status).length}
                  </p>
                  <p className="text-xs text-cyber-muted">{status}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="cyber-card">
            <h2 className="font-semibold mb-4">Export PDF Reports</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {REPORT_TYPES.map((report) => (
                <button
                  key={report.id}
                  type="button"
                  disabled={!!exporting}
                  onClick={() => handleExport(report.id)}
                  className="flex items-center gap-3 p-4 rounded-lg border border-slate-border hover:border-cyber-accent/50 text-left transition-colors"
                >
                  <i className={`fas ${report.icon} text-cyber-accent`} />
                  <span className="flex-1 text-sm font-medium">{report.label}</span>
                  <span className="text-xs text-cyber-muted">
                    {exporting === report.id ? 'Exporting…' : 'PDF'}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
