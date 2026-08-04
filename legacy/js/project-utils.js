// =============================================
// PROJECT DISPLAY HELPERS (shared)
// =============================================

const PROJECT_STATUS_LABELS = {
    pending_wdc: 'Pending WDC',
    wdc_reviewing: 'WDC Reviewing',
    councillor_reviewing: 'Councillor Reviewing',
    assembly_reviewing: 'Assembly Reviewing',
    revision_required: 'Revision Required',
    signed_by_mayor: 'Signed by Mayor',
    funded: 'Funded',
    provincial_reviewing: 'Provincial Reviewing',
    presented_to_provincial: 'Presented to Provincial',
    rejected: 'Rejected',
    rejected_no_wdc: 'Rejected — No WDC',
    funded_dsip_psip: 'Funded — DSIP/PSIP',
    implemented: 'Implemented',
    acquittal_recorded: 'Acquittal Recorded'
};

const PROJECT_STATUS_BADGE = {
    pending_wdc: 'badge-pending',
    wdc_reviewing: 'badge-pending',
    councillor_reviewing: 'badge-pending',
    assembly_reviewing: 'badge-pending',
    revision_required: 'badge-pending',
    signed_by_mayor: 'badge-in-progress',
    funded: 'badge-approved',
    provincial_reviewing: 'badge-in-progress',
    presented_to_provincial: 'badge-in-progress',
    rejected: 'badge-rejected',
    rejected_no_wdc: 'badge-rejected',
    funded_dsip_psip: 'badge-approved',
    implemented: 'badge-completed',
    acquittal_recorded: 'badge-completed'
};

const RATEABLE_PROJECT_STATUSES = ['implemented', 'acquittal_recorded', 'funded', 'funded_dsip_psip'];

function getProjectStatusLabel(status) {
    return PROJECT_STATUS_LABELS[status] || status || 'Unknown';
}

function getProjectStatusBadge(status) {
    return PROJECT_STATUS_BADGE[status] || 'badge-pending';
}

function renderStarDisplay(score) {
    if (!score || score <= 0) return '<span class="text-muted">—</span>';
    const full = Math.round(score);
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += i <= full
            ? '<i class="fas fa-star text-warning"></i>'
            : '<i class="far fa-star text-muted"></i>';
    }
    return `${html} <small class="text-muted">(${Number(score).toFixed(1)})</small>`;
}

function canRateProject(status) {
    return RATEABLE_PROJECT_STATUSES.includes(status);
}
