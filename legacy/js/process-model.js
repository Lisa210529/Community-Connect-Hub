// =============================================
// RESIDENT SERVICE REQUEST & FUNDING PROCESS
// (Swimlane model — statuses & role transitions)
// =============================================

const REQUEST_STATUS_LABELS = {
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

const REQUEST_STATUS_BADGE = {
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

const REQUEST_TYPE_LABELS = {
    project: 'Project Request',
    letter: 'Letter Request',
    reference: 'Reference Request'
};

/** Main happy-path steps shown on resident process tracker */
const RESIDENT_PROCESS_STEPS = [
    { status: 'pending_wdc', label: 'Submit Request', actor: 'Resident' },
    { status: 'pending_wdc', label: 'Pending WDC', actor: 'System' },
    { status: 'wdc_reviewing', label: 'WDC Reviewing', actor: 'WDC' },
    { status: 'councillor_reviewing', label: 'Councillor Reviewing', actor: 'Councillor' },
    { status: 'assembly_reviewing', label: 'Assembly Reviewing', actor: 'Mayor' },
    { status: 'signed_by_mayor', label: 'Signed by Mayor', actor: 'Mayor' },
    { status: 'funded', label: 'Funded / Provincial Review', actor: 'Mayor / Provincial' },
    { status: 'implemented', label: 'Implemented', actor: 'Council' },
    { status: 'acquittal_recorded', label: 'Acquittal Recorded', actor: 'Mayor' }
];

const STATUS_PROGRESS_INDEX = {
    pending_wdc: 1,
    wdc_reviewing: 2,
    councillor_reviewing: 3,
    assembly_reviewing: 4,
    revision_required: 3,
    signed_by_mayor: 5,
    funded: 6,
    provincial_reviewing: 6,
    presented_to_provincial: 6,
    funded_dsip_psip: 6,
    implemented: 7,
    acquittal_recorded: 8,
    rejected: -1,
    rejected_no_wdc: -1
};

function getRequestStatusLabel(status) {
    return REQUEST_STATUS_LABELS[status] || status || 'Unknown';
}

function getRequestStatusBadge(status) {
    return REQUEST_STATUS_BADGE[status] || 'badge-pending';
}

function getRequestProgressIndex(status) {
    return STATUS_PROGRESS_INDEX[status] ?? 0;
}

function isTerminalRequestStatus(status) {
    return ['rejected', 'rejected_no_wdc', 'acquittal_recorded'].includes(status);
}

/** Actions available per role for the current request status */
function getRequestActionsForRole(role, status) {
    const actions = [];

    const wdcRoles = ['wdc_chairperson', 'wdc_secretary', 'wdc_member', 'councillor'];

    if (wdcRoles.includes(role)) {
        if (status === 'pending_wdc') {
            actions.push({ label: 'Receive & Start WDC Review', nextStatus: 'wdc_reviewing', icon: 'fa-inbox' });
        }
        if (status === 'wdc_reviewing') {
            actions.push({
                label: 'Record Community Needs & Forward to Councillor',
                nextStatus: 'councillor_reviewing',
                icon: 'fa-clipboard-list'
            });
        }
    }

    if (role === 'councillor') {
        if (status === 'councillor_reviewing' || status === 'revision_required') {
            actions.push({
                label: status === 'revision_required' ? 'Resubmit Revised Proposal' : 'Finalize Proposal & Bring to Assembly',
                nextStatus: 'assembly_reviewing',
                icon: 'fa-gavel'
            });
        }
        if (status === 'funded' || status === 'funded_dsip_psip') {
            actions.push({ label: 'Mark Project Implemented', nextStatus: 'implemented', icon: 'fa-hammer' });
        }
        if (status === 'implemented') {
            actions.push({ label: 'Record Acquittal & Handover', nextStatus: 'acquittal_recorded', icon: 'fa-file-signature' });
        }
    }

    if (role === 'dda_officer' || role === 'llg_admin') {
        if (status === 'assembly_reviewing') {
            actions.push({ label: 'Return for Revision', nextStatus: 'revision_required', icon: 'fa-undo', variant: 'warning' });
            actions.push({ label: 'Agreed — Sign Project', nextStatus: 'signed_by_mayor', icon: 'fa-signature', variant: 'success' });
        }
        if (status === 'signed_by_mayor') {
            actions.push({ label: 'Fund from Ward Budget', nextStatus: 'funded', icon: 'fa-money-bill-wave', variant: 'success' });
            actions.push({ label: 'Refer to Provincial Assembly', nextStatus: 'provincial_reviewing', icon: 'fa-building', variant: 'primary' });
        }
    }

    if (role === 'provincial_admin') {
        if (status === 'provincial_reviewing') {
            actions.push({
                label: 'Present Proposal to Provincial Government',
                nextStatus: 'presented_to_provincial',
                icon: 'fa-paper-plane'
            });
        }
        if (status === 'presented_to_provincial') {
            actions.push({ label: 'Reject Project', nextStatus: 'rejected', icon: 'fa-times', variant: 'danger' });
            actions.push({
                label: 'Approve Funding (DSIP/PSIP)',
                nextStatus: 'funded_dsip_psip',
                icon: 'fa-check-double',
                variant: 'success',
                requiresWdc: true
            });
        }
    }

    return actions;
}

function renderRequestProcessTracker(status) {
    if (status === 'rejected') {
        return `<div class="process-alert process-alert-danger"><i class="fas fa-times-circle me-2"></i>Project rejected at provincial review.</div>`;
    }
    if (status === 'rejected_no_wdc') {
        return `<div class="process-alert process-alert-danger"><i class="fas fa-exclamation-triangle me-2"></i><strong>No WDC = No Government Funding.</strong> Project rejected — ward has no active WDC.</div>`;
    }
    if (status === 'revision_required') {
        return `<div class="process-alert process-alert-warning"><i class="fas fa-undo me-2"></i>Returned for revision by the Mayor. Your councillor will revise and resubmit.</div>`;
    }

    const progress = getRequestProgressIndex(status);
    const steps = RESIDENT_PROCESS_STEPS.map((step, index) => {
        let state = 'upcoming';
        if (index < progress) state = 'complete';
        else if (index === progress || (progress === 6 && index === 6 && ['provincial_reviewing', 'presented_to_provincial', 'funded_dsip_psip', 'funded'].includes(status))) {
            state = 'active';
        }
        if (status === 'acquittal_recorded' && index <= 8) state = 'complete';

        const label = (status === 'funded_dsip_psip' && index === 6)
            ? 'Funded — DSIP/PSIP'
            : (['provincial_reviewing', 'presented_to_provincial'].includes(status) && index === 6)
                ? getRequestStatusLabel(status)
                : step.label;

        return `
            <div class="process-step ${state}">
                <div class="process-step-marker">${state === 'complete' ? '<i class="fas fa-check"></i>' : index + 1}</div>
                <div class="process-step-body">
                    <div class="process-step-title">${label}</div>
                    <div class="process-step-actor">${step.actor}</div>
                </div>
            </div>`;
    }).join('');

    return `<div class="process-tracker">${steps}</div>`;
}
