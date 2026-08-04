// =============================================
// RESIDENT MODULE — Dashboard, Projects, Ratings, Complaints
// Sections 4.1, 4.3, 4.4, 4.5
// =============================================

const RATING_CATEGORIES = [
    { key: 'category1Score', label: 'Quality of Work' },
    { key: 'category2Score', label: 'Timeliness' },
    { key: 'category3Score', label: 'Community Benefit' },
    { key: 'category4Score', label: 'Communication' },
    { key: 'category5Score', label: 'Overall Satisfaction' }
];

let residentProjectsCache = [];

async function loadResidentDashboard() {
    if (!currentUserData?.wardId || currentUserRole !== 'resident') {
        await loadDashboardDataLegacy();
        return;
    }

    const wardId = currentUserData.wardId;
    const projects = await getProjectsByWard(wardId);
    const requests = await getRequestsByResident(currentUserId);
    const complaints = await getComplaintsByResident(currentUserId);

    let completed = 0, inProgress = 0, totalRating = 0, ratingCount = 0;

    for (const p of projects) {
        if (['implemented', 'acquittal_recorded'].includes(p.status)) completed++;
        else if (!['rejected', 'rejected_no_wdc'].includes(p.status)) inProgress++;
        const avg = await getAverageRating(p.id);
        if (avg > 0) {
            totalRating += avg;
            ratingCount++;
        }
        p.avgRating = avg;
    }

    document.getElementById('totalProjects').textContent = projects.length;
    document.getElementById('completedProjects').textContent = completed;
    document.getElementById('inProgressProjects').textContent = inProgress;
    document.getElementById('avgRating').textContent =
        ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : '0.0';

    const extraRequests = document.getElementById('residentRequestsCount');
    const extraComplaints = document.getElementById('residentComplaintsCount');
    const wardBanner = document.getElementById('residentWardBanner');
    if (extraRequests) extraRequests.textContent = requests.length;
    if (extraComplaints) extraComplaints.textContent = complaints.filter(c => c.status === 'pending').length;

    if (wardBanner) {
        const wardDoc = await db.collection('wards').doc(wardId).get();
        const ward = wardDoc.exists ? wardDoc.data() : null;
        wardBanner.textContent = ward
            ? `Welcome to Ward ${ward.wardNumber} — ${ward.wardName}. Track projects, rate completed work, and submit complaints.`
            : 'Welcome to your ward dashboard.';
        wardBanner.style.display = '';
    }

    const tableBody = document.getElementById('projectsTableBody');
    if (tableBody) {
        tableBody.innerHTML = renderProjectTableRows(projects.slice(0, 5), true);
        bindProjectViewButtons();
    }

    residentProjectsCache = projects;
    console.log('✅ Resident dashboard loaded');
}

async function loadDashboardDataLegacy() {
    const snapshot = await db.collection('projects').get();
    let total = 0, completed = 0, inProgress = 0;
    const projects = [];
    snapshot.forEach(doc => {
        const data = doc.data();
        total++;
        if (data.status === 'implemented') completed++;
        if (data.status === 'funded' || data.status === 'provincial_reviewing') inProgress++;
        projects.push({ id: doc.id, ...data });
    });
    document.getElementById('totalProjects').textContent = total;
    document.getElementById('completedProjects').textContent = completed;
    document.getElementById('inProgressProjects').textContent = inProgress;
    document.getElementById('avgRating').textContent = '0.0';
    const tableBody = document.getElementById('projectsTableBody');
    const allTableBody = document.getElementById('allProjectsTableBody');
    const rows = renderProjectTableRows(projects, false);
    if (tableBody) tableBody.innerHTML = rows;
    if (allTableBody) allTableBody.innerHTML = rows;
}

function renderProjectTableRows(projects, showViewBtn) {
    if (!projects.length) {
        return `<tr><td colspan="6" class="text-center py-3 text-muted">
            <i class="fas fa-inbox fa-2x d-block mb-2"></i>No projects in your ward yet.</td></tr>`;
    }

    return projects.map(p => {
        const viewBtn = showViewBtn
            ? `<button type="button" class="btn btn-sm btn-outline-primary project-view-btn" data-project-id="${p.id}">
                   <i class="fas fa-eye"></i></button>`
            : `<button type="button" class="btn btn-sm btn-outline-primary project-view-btn" data-project-id="${p.id}">
                   <i class="fas fa-eye"></i></button>`;
        return `<tr>
            <td><strong>${p.projectName || 'Untitled'}</strong></td>
            <td>${p.category || 'General'}</td>
            <td>K${(p.budget || 0).toLocaleString()}</td>
            <td><span class="badge-status ${getProjectStatusBadge(p.status)}">${getProjectStatusLabel(p.status)}</span></td>
            <td>${renderStarDisplay(p.avgRating || 0)}</td>
            <td>${viewBtn}</td>
        </tr>`;
    }).join('');
}

async function loadResidentProjects() {
    const tableBody = document.getElementById('allProjectsTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-3 text-muted"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>`;

    let projects = [];
    if (currentUserRole === 'resident' && currentUserData?.wardId) {
        projects = await getProjectsByWard(currentUserData.wardId);
    } else {
        projects = await getAllProjects();
    }

    for (const p of projects) {
        p.avgRating = await getAverageRating(p.id);
    }

    residentProjectsCache = projects;
    tableBody.innerHTML = renderProjectTableRows(projects, true);
    bindProjectViewButtons();
}

async function showProjectDetailModal(projectId) {
    const doc = await db.collection('projects').doc(projectId).get();
    if (!doc.exists) {
        showToast('Project not found.', 'danger');
        return;
    }

    const p = { id: doc.id, ...doc.data() };
    const avg = await getAverageRating(projectId);
    const alreadyRated = currentUserId
        ? await hasResidentRatedProject(currentUserId, projectId)
        : false;

    document.getElementById('projectDetailTitle').textContent = p.projectName || 'Project';
    document.getElementById('projectDetailBody').innerHTML = `
        <p><strong>Category:</strong> ${p.category || '—'}</p>
        <p><strong>Location:</strong> ${p.location || '—'}</p>
        <p><strong>Budget:</strong> K${(p.budget || 0).toLocaleString()}</p>
        <p><strong>Funding:</strong> ${p.fundingSource || '—'}</p>
        <p><strong>Status:</strong> <span class="badge-status ${getProjectStatusBadge(p.status)}">${getProjectStatusLabel(p.status)}</span></p>
        <p><strong>Average Rating:</strong> ${renderStarDisplay(avg)}</p>
        <p><strong>Description:</strong> ${p.description || 'No description provided.'}</p>`;

    const rateBtn = document.getElementById('projectDetailRateBtn');
    if (rateBtn) {
        if (currentUserRole === 'resident' && canRateProject(p.status) && !alreadyRated) {
            rateBtn.style.display = '';
            rateBtn.dataset.projectId = projectId;
            rateBtn.dataset.projectName = p.projectName || 'Project';
        } else {
            rateBtn.style.display = 'none';
        }
    }

    document.getElementById('projectDetailModal').dataset.projectId = projectId;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('projectDetailModal')).show();
}

function bindProjectViewButtons() {
    document.querySelectorAll('.project-view-btn').forEach(btn => {
        btn.addEventListener('click', () => showProjectDetailModal(btn.dataset.projectId));
    });
}

function renderStarInput(name, label) {
    return `<div class="mb-3">
        <label class="form-label">${label}</label>
        <div class="star-rating-input" data-field="${name}">
            ${[1, 2, 3, 4, 5].map(n => `<button type="button" class="star-btn" data-value="${n}"><i class="far fa-star"></i></button>`).join('')}
            <input type="hidden" id="${name}" value="0" />
        </div>
    </div>`;
}

function initStarRatingInputs(container) {
    container.querySelectorAll('.star-rating-input').forEach(group => {
        const hidden = group.querySelector('input[type="hidden"]');
        group.querySelectorAll('.star-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const val = parseInt(btn.dataset.value, 10);
                hidden.value = val;
                group.querySelectorAll('.star-btn').forEach((b, i) => {
                    b.querySelector('i').className = i < val ? 'fas fa-star text-warning' : 'far fa-star text-muted';
                });
            });
        });
    });
}

async function loadRatingsModule() {
    const container = document.getElementById('ratingsFormContainer');
    const historyBody = document.getElementById('myRatingsTableBody');
    if (!container) return;

    let projects = residentProjectsCache.length
        ? residentProjectsCache
        : await getProjectsByWard(currentUserData?.wardId || '');

    const rateable = [];
    for (const p of projects) {
        if (canRateProject(p.status) && !(await hasResidentRatedProject(currentUserId, p.id))) {
            rateable.push(p);
        }
    }

    if (!rateable.length) {
        container.innerHTML = `<p class="text-muted">No completed projects available to rate right now. Check back when a project is implemented or funded.</p>`;
    } else {
        const options = rateable.map(p => `<option value="${p.id}">${p.projectName}</option>`).join('');
        container.innerHTML = `
            <form id="ratingForm">
                <div class="mb-3">
                    <label class="form-label" for="ratingProjectSelect">Select Project</label>
                    <select class="form-select" id="ratingProjectSelect" required>${options}</select>
                </div>
                ${RATING_CATEGORIES.map(c => renderStarInput(c.key, c.label)).join('')}
                <div class="form-check mb-3">
                    <input class="form-check-input" type="checkbox" id="ratingAnonymous" />
                    <label class="form-check-label" for="ratingAnonymous">Submit anonymously</label>
                </div>
                <button type="submit" class="btn btn-primary" id="submitRatingBtn">
                    <i class="fas fa-star me-2"></i> Submit Rating
                </button>
            </form>`;
        initStarRatingInputs(container);
        document.getElementById('ratingForm').addEventListener('submit', handleSubmitRating);
    }

    if (historyBody && currentUserId) {
        const myRatings = await getRatingsByResident(currentUserId);
        if (!myRatings.length) {
            historyBody.innerHTML = `<tr><td colspan="3" class="text-center py-3 text-muted">You have not rated any projects yet.</td></tr>`;
        } else {
            const rows = await Promise.all(myRatings.map(async r => {
                const pDoc = await db.collection('projects').doc(r.projectId).get();
                const name = pDoc.exists ? pDoc.data().projectName : r.projectId;
                return `<tr>
                    <td>${name}</td>
                    <td>${renderStarDisplay(r.overallScore)}</td>
                    <td>${r.isAnonymous ? 'Anonymous' : 'Named'}</td>
                </tr>`;
            }));
            historyBody.innerHTML = rows.join('');
        }
    }
}

async function handleSubmitRating(e) {
    e.preventDefault();
    const projectId = document.getElementById('ratingProjectSelect')?.value;
    if (!projectId || !currentUserId) return;

    const scores = {};
    for (const c of RATING_CATEGORIES) {
        const val = parseInt(document.getElementById(c.key)?.value || '0', 10);
        if (val < 1 || val > 5) {
            showToast(`Please rate all categories (1–5 stars). Missing: ${c.label}`, 'warning');
            return;
        }
        scores[c.key] = val;
    }

    const btn = document.getElementById('submitRatingBtn');
    btn.disabled = true;

    const id = await createRating({
        projectId,
        residentId: currentUserId,
        ...scores,
        isAnonymous: document.getElementById('ratingAnonymous')?.checked || false
    });

    btn.disabled = false;

    if (id) {
        showToast('Thank you! Your rating has been submitted.', 'success');
        await loadRatingsModule();
        if (currentUserRole === 'resident') await loadResidentDashboard();
    } else {
        showToast('Failed to submit rating.', 'danger');
    }
}

async function loadComplaintsModule() {
    const form = document.getElementById('complaintForm');
    const tableBody = document.getElementById('myComplaintsTableBody');
    const projectSelect = document.getElementById('complaintProjectSelect');

    if (projectSelect) {
        let projects = residentProjectsCache.length
            ? residentProjectsCache
            : await getProjectsByWard(currentUserData?.wardId || '');
        projectSelect.innerHTML = '<option value="">— General complaint (no project) —</option>' +
            projects.map(p => `<option value="${p.id}">${p.projectName}</option>`).join('');
    }

    if (tableBody && currentUserId) {
        const complaints = await getComplaintsByResident(currentUserId);
        if (!complaints.length) {
            tableBody.innerHTML = `<tr><td colspan="4" class="text-center py-3 text-muted">No complaints submitted yet.</td></tr>`;
        } else {
            tableBody.innerHTML = complaints.map(c => `<tr>
                <td><strong>${c.subject}</strong><br><small class="text-muted">${c.category}</small></td>
                <td><span class="badge-status badge-pending">${c.status || 'pending'}</span></td>
                <td class="text-truncate" style="max-width:200px;">${c.description || '—'}</td>
                <td>${formatComplaintDate(c.submittedAt)}</td>
            </tr>`).join('');
        }
    }
}

function formatComplaintDate(timestamp) {
    if (!timestamp) return '—';
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return d.toLocaleDateString('en-PG', { day: 'numeric', month: 'short', year: 'numeric' });
}

async function handleSubmitComplaint(e) {
    e.preventDefault();

    const subject = document.getElementById('complaintSubject').value.trim();
    const category = document.getElementById('complaintCategory').value;
    const description = document.getElementById('complaintDescription').value.trim();
    const projectId = document.getElementById('complaintProjectSelect')?.value || '';

    if (!subject || !description) {
        showToast('Please enter a subject and description.', 'warning');
        return;
    }

    const btn = document.getElementById('submitComplaintBtn');
    btn.disabled = true;

    const id = await createComplaint({
        residentId: currentUserId,
        wardId: currentUserData?.wardId || '',
        projectId,
        subject,
        category,
        description
    });

    btn.disabled = false;

    if (id) {
        showToast('Complaint submitted. Your councillor will review it.', 'success');
        document.getElementById('complaintForm').reset();
        await loadComplaintsModule();
        if (currentUserRole === 'resident') await loadResidentDashboard();
    } else {
        showToast('Failed to submit complaint.', 'danger');
    }
}

function openRatingForProject(projectId, projectName) {
    bootstrap.Modal.getInstance(document.getElementById('projectDetailModal'))?.hide();
    document.querySelector('.nav-item[data-page="ratings"]')?.click();
    setTimeout(async () => {
        await loadRatingsModule();
        const sel = document.getElementById('ratingProjectSelect');
        if (sel) sel.value = projectId;
    }, 300);
}

function initResidentModule() {
    document.getElementById('complaintForm')?.addEventListener('submit', handleSubmitComplaint);
    document.getElementById('projectDetailRateBtn')?.addEventListener('click', function () {
        openRatingForProject(this.dataset.projectId, this.dataset.projectName);
    });
    console.log('🎯 Resident module ready');
}

async function loadDashboardData() {
    if (currentUserRole === 'resident') {
        await loadResidentDashboard();
    } else {
        await loadDashboardDataLegacy();
    }
}
