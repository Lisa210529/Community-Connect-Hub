// =============================================
// SERVICE REQUEST MODULE — UI & WORKFLOW ACTIONS
// =============================================

async function fetchRequestsForCurrentRole() {
    if (!currentUserId || !currentUserData) return [];

    const role = currentUserRole;
    const wardId = currentUserData.wardId || '';

    if (role === 'resident') {
        return await getRequestsByResident(currentUserId);
    }

    const wardScopedRoles = ['councillor', 'wdc_chairperson', 'wdc_secretary', 'wdc_member'];
    if (wardScopedRoles.includes(role) && wardId) {
        return await getRequestsByWard(wardId);
    }

    return await getAllRequests();
}

function filterRequestsForRole(requests, role) {
    if (role === 'resident') return requests;

    if (['wdc_chairperson', 'wdc_secretary', 'wdc_member', 'councillor'].includes(role)) {
        return requests;
    }

    if (role === 'dda_officer' || role === 'llg_admin') {
        return requests.filter(r => [
            'assembly_reviewing', 'signed_by_mayor', 'revision_required'
        ].includes(r.status));
    }

    if (role === 'provincial_admin') {
        return requests.filter(r => ['provincial_reviewing', 'presented_to_provincial'].includes(r.status));
    }

    return requests;
}

function formatRequestDate(timestamp) {
    if (!timestamp) return '—';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-PG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function renderRequestsTableRows(requests) {
    if (!requests.length) {
        return `<tr><td colspan="6" class="text-center py-4 text-muted">
            <i class="fas fa-inbox fa-2x d-block mb-2"></i>No requests in this queue yet.</td></tr>`;
    }

    return requests.map(req => {
        const actionBtn = `<button type="button" class="btn btn-sm btn-outline-primary request-view-btn"
                    data-request-id="${req.id}" title="View process &amp; actions">
                    <i class="fas fa-eye"></i>
               </button>`;

        return `<tr>
            <td><strong>${req.title || 'Untitled Request'}</strong><br>
                <small class="text-muted">${REQUEST_TYPE_LABELS[req.requestType] || req.requestType || 'Request'}</small></td>
            <td>${req.category || '—'}</td>
            <td><span class="badge-status ${getRequestStatusBadge(req.status)}">${getRequestStatusLabel(req.status)}</span></td>
            <td>${formatRequestDate(req.submittedAt)}</td>
            <td class="text-truncate" style="max-width:200px;">${req.communityNeed || req.description || '—'}</td>
            <td class="text-nowrap">${actionBtn}</td>
        </tr>`;
    }).join('');
}

async function loadRequestsModule() {
    const tableBody = document.getElementById('requestsTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-3 text-muted">
        <i class="fas fa-spinner fa-spin me-2"></i>Loading requests...</td></tr>`;

    try {
        let requests = await fetchRequestsForCurrentRole();
        requests = filterRequestsForRole(requests, currentUserRole);
        tableBody.innerHTML = renderRequestsTableRows(requests);

        const pendingWdc = requests.filter(r => ['pending_wdc', 'wdc_reviewing'].includes(r.status)).length;
        const councillorPending = requests.filter(r => ['councillor_reviewing', 'revision_required'].includes(r.status)).length;
        const wdcEl = document.getElementById('wdcPendingCount');
        const councillorEl = document.getElementById('councillorPendingRequests');
        if (wdcEl && ['wdc_chairperson', 'wdc_secretary', 'wdc_member', 'councillor'].includes(currentUserRole)) {
            wdcEl.textContent = pendingWdc;
        }
        if (councillorEl && currentUserRole === 'councillor') {
            councillorEl.textContent = councillorPending;
        }

        bindRequestTableEvents();
        toggleRequestPanelsForRole();
    } catch (error) {
        console.error('❌ Error loading requests:', error);
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-3 text-danger">Failed to load requests.</td></tr>`;
    }
}

function toggleRequestPanelsForRole() {
    const submitPanel = document.getElementById('residentRequestFormPanel');
    const role = currentUserRole;

    if (submitPanel) submitPanel.style.display = role === 'resident' ? '' : 'none';
}

async function handleSubmitRequest(e) {
    e.preventDefault();

    const btn = document.getElementById('submitRequestBtn');
    const requestType = document.getElementById('reqRequestType')?.value || 'project';
    const title = document.getElementById('reqTitle')?.value.trim();
    const communityNeed = document.getElementById('reqCommunityNeed')?.value.trim();
    const category = document.getElementById('reqCategory')?.value || 'Infrastructure';

    if (!title || !communityNeed) {
        showToast('Please enter a title and describe the community need.', 'warning');
        return;
    }

    if (!currentUserId || !currentUserData?.wardId) {
        showToast('Your ward is not set. Contact support.', 'danger');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Submitting...';

    try {
        const requestId = await createRequest({
            residentId: currentUserId,
            wardId: currentUserData.wardId,
            requestType,
            title,
            communityNeed,
            category,
            description: communityNeed
        });

        if (!requestId) {
            showToast('Failed to submit request. Try again.', 'danger');
            return;
        }

        showToast('Request submitted. Status: Pending WDC', 'success');
        document.getElementById('residentRequestForm')?.reset();
        await loadRequestsModule();
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane me-2"></i> Submit Request';
    }
}

async function showRequestDetailModal(requestId) {
    const doc = await db.collection('requests').doc(requestId).get();
    if (!doc.exists) {
        showToast('Request not found.', 'danger');
        return;
    }

    const req = { id: doc.id, ...doc.data() };
    const modal = document.getElementById('requestDetailModal');
    const titleEl = document.getElementById('requestDetailTitle');
    const metaEl = document.getElementById('requestDetailMeta');
    const trackerEl = document.getElementById('requestDetailTracker');
    const actionsEl = document.getElementById('requestDetailActions');

    if (titleEl) titleEl.textContent = req.title || 'Service Request';
    if (metaEl) {
        metaEl.innerHTML = `
            <p class="mb-1"><strong>Type:</strong> ${REQUEST_TYPE_LABELS[req.requestType] || req.requestType}</p>
            <p class="mb-1"><strong>Category:</strong> ${req.category || '—'}</p>
            <p class="mb-1"><strong>Status:</strong> <span class="badge-status ${getRequestStatusBadge(req.status)}">${getRequestStatusLabel(req.status)}</span></p>
            <p class="mb-1"><strong>Community Need:</strong> ${req.communityNeed || req.description || '—'}</p>
            <p class="mb-0"><strong>Submitted:</strong> ${formatRequestDate(req.submittedAt)}</p>`;
    }
    if (trackerEl) trackerEl.innerHTML = renderRequestProcessTracker(req.status);

    const actions = getRequestActionsForRole(currentUserRole, req.status);
    if (actionsEl) {
        if (!actions.length) {
            actionsEl.innerHTML = '<p class="text-muted small mb-0">No actions available for your role at this stage.</p>';
        } else {
            actionsEl.innerHTML = actions.map((action, index) => {
                const variant = action.variant || 'primary';
                return `<button type="button" class="btn btn-${variant} me-2 mb-2 request-modal-action-btn"
                    data-request-id="${req.id}" data-action-index="${index}">
                    <i class="fas ${action.icon || 'fa-arrow-right'} me-1"></i>${action.label}
                </button>`;
            }).join('');
            actionsEl.querySelectorAll('.request-modal-action-btn').forEach(btn => {
                btn.addEventListener('click', () => handleRequestAction(btn.dataset.requestId, parseInt(btn.dataset.actionIndex, 10)));
            });
        }
    }

    modal?.setAttribute('data-current-request-id', requestId);
    bootstrap.Modal.getOrCreateInstance(modal).show();
}

async function handleRequestAction(requestId, actionIndex) {
    const doc = await db.collection('requests').doc(requestId).get();
    if (!doc.exists) return;

    const req = doc.data();
    const actions = getRequestActionsForRole(currentUserRole, req.status);
    const action = actions[actionIndex];
    if (!action) return;

    let nextStatus = action.nextStatus;

    if (action.requiresWdc && req.wardId) {
        const hasWdc = await checkWardHasWdc(req.wardId);
        if (!hasWdc) {
            nextStatus = 'rejected_no_wdc';
            showToast('No WDC = No Government Funding. Request rejected.', 'danger');
        }
    }

    const updated = await updateRequestStatus(requestId, nextStatus);
    if (!updated) {
        showToast('Failed to update request status.', 'danger');
        return;
    }

    if (nextStatus !== 'rejected_no_wdc') {
        showToast(`Status updated: ${getRequestStatusLabel(nextStatus)}`, 'success');
    }

    const modalEl = document.getElementById('requestDetailModal');
    bootstrap.Modal.getInstance(modalEl)?.hide();
    await loadRequestsModule();
}

function bindRequestTableEvents() {
    document.querySelectorAll('.request-view-btn').forEach(btn => {
        btn.addEventListener('click', () => showRequestDetailModal(btn.dataset.requestId));
    });
}

function initRequestsModule() {
    document.getElementById('residentRequestForm')?.addEventListener('submit', handleSubmitRequest);
    document.getElementById('refreshRequestsBtn')?.addEventListener('click', loadRequestsModule);
    console.log('🎯 Service request process module ready');
}
