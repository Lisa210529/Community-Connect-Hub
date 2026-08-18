import { firestoreService } from './firestoreService';
import { downloadDocumentAsPdf, buildDocumentPdfFileName } from '../utils/fileHelpers';

function formatCurrency(amount) {
  return `K ${Number(amount ?? 0).toLocaleString()}`;
}

function pct(numerator, denominator) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 100);
}

export async function loadReportData(wardId) {
  const [projects, requests, ratings, fundingRequests] = await Promise.all([
    firestoreService.getProjects(wardId || undefined),
    firestoreService.getRequests(wardId || undefined),
    wardId ? firestoreService.getRatings(wardId) : firestoreService.getRatings(),
    firestoreService.getFundingRequests(),
  ]);

  return { projects, requests, ratings, fundingRequests };
}

export function buildProjectReportContent(projects, wardLabel = 'All Wards') {
  const funded = projects.filter((p) => String(p.status).toLowerCase() === 'funded').length;
  const completed = projects.filter((p) => String(p.status).toLowerCase() === 'completed').length;
  const pending = projects.filter((p) => String(p.status ?? '').includes('Pending')).length;
  const totalBudget = projects.reduce((sum, p) => sum + Number(p.budget ?? 0), 0);

  const lines = [
    `PROJECT REPORT — ${wardLabel}`,
    `Generated: ${new Date().toLocaleString('en-PG')}`,
    '',
    `Total projects: ${projects.length}`,
    `Funded: ${funded}`,
    `Completed: ${completed}`,
    `Pending approval: ${pending}`,
    `Total budget: ${formatCurrency(totalBudget)}`,
    '',
    'Project list:',
    ...projects.slice(0, 40).map(
      (p, i) => `${i + 1}. ${p.name} | ${p.ward} | ${p.status} | ${formatCurrency(p.budget)}`,
    ),
  ];

  return lines.join('\n');
}

export function buildPerformanceReportContent(projects, requests, ratings) {
  const completed = projects.filter((p) => String(p.status).toLowerCase() === 'completed').length;
  const completionRate = pct(completed, projects.length);
  const resolved = requests.filter((r) => String(r.status).toLowerCase() === 'resolved').length;
  const responseRate = pct(resolved, requests.length);
  const avgRating = ratings.length
    ? (ratings.reduce((sum, r) => sum + Number(r.overallScore ?? r.score ?? r.rating ?? 0), 0) / ratings.length).toFixed(1)
    : 'N/A';

  return [
    'PERFORMANCE MONITORING REPORT',
    `Generated: ${new Date().toLocaleString('en-PG')}`,
    '',
    `Project completion rate: ${completionRate}%`,
    `Request resolution rate: ${responseRate}%`,
    `Average resident satisfaction: ${avgRating}/5`,
    `Total projects tracked: ${projects.length}`,
    `Total requests tracked: ${requests.length}`,
    `Total ratings collected: ${ratings.length}`,
  ].join('\n');
}

export function buildFundingReportContent(fundingRequests, projects) {
  const approved = fundingRequests.filter((r) => r.status === 'approved');
  const totalApproved = approved.reduce((sum, r) => sum + Number(r.amountApproved ?? 0), 0);

  return [
    'FUNDING REPORT',
    `Generated: ${new Date().toLocaleString('en-PG')}`,
    '',
    `Approved funding requests: ${approved.length}`,
    `Total approved amount: ${formatCurrency(totalApproved)}`,
    `Funded projects in system: ${projects.filter((p) => String(p.status).toLowerCase() === 'funded').length}`,
    '',
    ...approved.slice(0, 30).map(
      (r) => `- ${r.projectTitle || r.category} | ${r.ward} | ${formatCurrency(r.amountApproved)} | ${r.stakeholderType?.toUpperCase()}`,
    ),
  ].join('\n');
}

export function buildSatisfactionReportContent(ratings) {
  const avg = ratings.length
    ? (ratings.reduce((sum, r) => sum + Number(r.overallScore ?? r.score ?? 0), 0) / ratings.length).toFixed(1)
    : '0';

  return [
    'RESIDENT SATISFACTION REPORT',
    `Generated: ${new Date().toLocaleString('en-PG')}`,
    '',
    `Total ratings: ${ratings.length}`,
    `Average overall score: ${avg}/5`,
    '',
    ...ratings.slice(0, 30).map(
      (r) => `- ${r.projectName} | ${r.ward} | ${r.overallScore ?? r.score}/5 | ${r.residentName ?? 'Resident'}`,
    ),
  ].join('\n');
}

export async function exportReportPdf({ title, content, wardLabel, authorName, template }) {
  await downloadDocumentAsPdf({
    title,
    content,
    fileName: buildDocumentPdfFileName(template || title, authorName),
    ward: wardLabel,
    authorName,
    template: template || title,
  });
}

export const reportService = {
  loadReportData,
  buildProjectReportContent,
  buildPerformanceReportContent,
  buildFundingReportContent,
  buildSatisfactionReportContent,
  exportReportPdf,
};
