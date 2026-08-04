// =============================================
// UI — NAVIGATION, TOASTS, ROLE-BASED DASHBOARD
// =============================================

let currentUserRole = 'resident';
let currentUserData = null;
let currentUserId = null;

const ROLE_LABELS = {
    resident: 'Resident',
    councillor: 'Councillor',
    wdc_chairperson: 'WDC Chairperson',
    wdc_secretary: 'WDC Secretary',
    wdc_member: 'WDC Member',
    llg_admin: 'LLG Administrator',
    dda_officer: 'DDA Officer',
    provincial_admin: 'Provincial Administrator',
    pec_member: 'PEC Member',
    psip_coordinator: 'PSIP Coordinator',
    dsip_coordinator: 'DSIP Coordinator',
    funding_agency: 'Funding Agency',
    system_admin: 'System Administrator'
};

const ROLE_GUIDE = {
    resident: '4. Resident Guide',
    councillor: '5. Councillor Guide',
    wdc_chairperson: '10. Ward Development Committee',
    wdc_secretary: '10. Ward Development Committee',
    wdc_member: '10. Ward Development Committee',
    llg_admin: '6. Mayor Guide',
    dda_officer: '6. Mayor Guide',
    provincial_admin: '7. Provincial Admin Guide',
    system_admin: '8. System Admin Guide',
    pec_member: 'Funding Coordination',
    psip_coordinator: 'Funding Coordination',
    dsip_coordinator: 'Funding Coordination',
    funding_agency: 'Funding Coordination'
};

const DEFAULT_DASHBOARD_SECTION = {
    resident: 'dashboard',
    councillor: 'dashboard-councillor',
    wdc_chairperson: 'dashboard-wdc',
    wdc_secretary: 'dashboard-wdc',
    wdc_member: 'dashboard-wdc',
    llg_admin: 'dashboard-mayor',
    dda_officer: 'dashboard-mayor',
    provincial_admin: 'dashboard-provincial',
    system_admin: 'dashboard-system',
    pec_member: 'dashboard-funding',
    psip_coordinator: 'dashboard-funding',
    dsip_coordinator: 'dashboard-funding',
    funding_agency: 'dashboard-funding'
};

const NAV_LABELS = {
    dashboard: {
        resident: '4.1 Dashboard Overview',
        councillor: '5.1 Dashboard Overview',
        wdc_chairperson: '10. WDC Dashboard',
        wdc_secretary: '10. WDC Dashboard',
        wdc_member: '10. WDC Dashboard',
        llg_admin: '6.1 Dashboard Overview',
        dda_officer: '6.1 Dashboard Overview',
        provincial_admin: '7.1 Dashboard Overview',
        system_admin: '8.1 Dashboard Overview',
        default: 'Dashboard'
    },
    requests: {
        resident: '4.2 Request Project',
        councillor: '5.3 Manage Requests',
        wdc_chairperson: '10.1 Review Request',
        wdc_secretary: '10.1 Review Request',
        wdc_member: '10.1 Review Request',
        dda_officer: '6.2 Assembly Review',
        llg_admin: '6.2 Assembly Review',
        provincial_admin: '7.2 Provincial Review',
        default: 'Requests'
    },
    'log-project': { councillor: '5.2 Logging Projects', default: 'Log Projects' },
    projects: {
        resident: '4.3 Viewing Projects',
        councillor: '5.2 View Projects',
        default: 'Projects'
    },
    ratings: { resident: '4.4 Rating Projects', default: 'Ratings' },
    scorecard: { councillor: '5.7 Viewing Scorecard', default: 'Scorecard' },
    complaints: { resident: '4.5 Submitting Complaints', default: 'Complaints' },
    announcements: { resident: '4.6 Viewing Announcements', default: 'Announcements' },
    'post-announcements': { councillor: '5.6 Posting Announcements', default: 'Post Announcements' },
    'wdc-management': { councillor: '5.4 WDC Management', wdc_chairperson: '5.4 WDC Management', default: 'WDC Management' },
    documents: { councillor: '5.5 Document Generation', default: 'Documents' },
    'community-needs': { default: '10.2 Record Community Needs' },
    'wdc-meetings': { default: '10.3 WDC Meeting with Councillor' },
    'approve-projects': {
        dda_officer: '6.2 Approving Projects',
        provincial_admin: '7.2 Approving Projects',
        default: 'Approve Projects'
    },
    reports: { dda_officer: '6.3 Generating Reports', default: 'Reports' },
    'monitor-wards': {
        dda_officer: '6.4 Monitoring Wards',
        llg_admin: '6.4 Monitoring Wards',
        provincial_admin: '7.3 Performance Monitoring',
        default: 'Monitor Wards'
    },
    performance: { provincial_admin: '7.3 Performance Monitoring', default: 'Performance' },
    analytics: { provincial_admin: '7.4 Analytics & Reporting', default: 'Analytics' },
    users: { system_admin: '8.1 User Management', default: 'User Management' },
    'account-approvals': { system_admin: '8.2 Account Approvals', provincial_admin: '8.2 Account Approvals', default: 'Account Approvals' },
    'system-config': { system_admin: '8.3 System Configuration', default: 'System Configuration' },
    'mfa-security': { default: '3.2 Security & MFA' }
};

const PAGE_TITLES = {
    dashboard: 'Dashboard',
    requests: 'Management Requests',
    'log-project': 'Log Projects',
    projects: 'Projects',
    ratings: 'Ratings',
    scorecard: 'Scorecard',
    complaints: 'Complaints',
    announcements: 'Announcements',
    'wdc-management': 'WDC Management',
    documents: 'Document Generation',
    'community-needs': 'Community Needs',
    'wdc-meetings': 'WDC Meetings',
    'approve-projects': 'Approve Projects',
    reports: 'Reports',
    'monitor-wards': 'Monitor Wards',
    performance: 'Performance Monitoring',
    analytics: 'Analytics & Reporting',
    users: 'User Management',
    'account-approvals': 'Account Approvals',
    'system-config': 'System Configuration',
    'mfa-security': 'Security & MFA'
};

function getNavLabel(key, role) {
    const labels = NAV_LABELS[key];
    if (!labels) return PAGE_TITLES[key] || key;
    return labels[role] || labels.default || PAGE_TITLES[key] || key;
}

function updateNavLabelsForRole(role) {
    const guideLabel = document.getElementById('sidebarGuideLabel');
    if (guideLabel) guideLabel.textContent = ROLE_GUIDE[role] || 'User Guide';

    document.querySelectorAll('.nav-text[data-nav-key]').forEach(span => {
        span.textContent = getNavLabel(span.dataset.navKey, role);
    });
}

function updateRoleSectionCopy(role) {
    const requestsTitle = document.getElementById('requestsSectionTitle');
    const requestsDesc = document.getElementById('requestsSectionDesc');
    const requestsQueueTitle = document.getElementById('requestsQueueTitle');
    if (requestsTitle) {
        if (role === 'resident') {
            requestsTitle.textContent = '4.2 Request Project — Management Request';
            requestsDesc.textContent = 'Identify a community need and submit a project, letter, or reference request.';
            if (requestsQueueTitle) requestsQueueTitle.textContent = 'My Requests';
        } else if (role === 'councillor') {
            requestsTitle.textContent = '5.3 Managing Requests';
            requestsDesc.textContent = 'Review resident requests and advance them through the funding process.';
            if (requestsQueueTitle) requestsQueueTitle.textContent = 'Ward Request Queue';
        } else if (['wdc_chairperson', 'wdc_secretary', 'wdc_member'].includes(role)) {
            requestsTitle.textContent = '10.1 Review Request';
            requestsDesc.textContent = 'Receive requests, record community needs, and forward to the councillor.';
            if (requestsQueueTitle) requestsQueueTitle.textContent = 'WDC Review Queue';
        } else if (role === 'dda_officer' || role === 'llg_admin') {
            if (requestsQueueTitle) requestsQueueTitle.textContent = 'Assembly Review Queue';
        } else if (role === 'provincial_admin') {
            if (requestsQueueTitle) requestsQueueTitle.textContent = 'Provincial Review Queue';
        }
    }

    const projectsTitle = document.getElementById('projectsSectionTitle');
    if (projectsTitle) {
        projectsTitle.textContent = role === 'councillor'
            ? '5.2 Logged Projects'
            : role === 'resident'
                ? '4.3 Viewing Projects'
                : 'Projects';
    }

    const announcementsTitle = document.getElementById('announcementsSectionTitle');
    if (announcementsTitle) {
        announcementsTitle.textContent = role === 'councillor'
            ? '5.6 Posting Announcements'
            : role === 'resident'
                ? '4.6 Viewing Announcements'
                : 'Announcements';
    }

    const approveTitle = document.getElementById('approveProjectsTitle');
    const approveHeading = document.getElementById('approveProjectsHeading');
    const approveDesc = document.getElementById('approveProjectsDesc');
    if (approveTitle && role === 'provincial_admin') {
        approveTitle.textContent = '7.2 Approving Projects';
        approveHeading.textContent = 'Provincial Project Approval';
        approveDesc.textContent = 'Review ward projects submitted for provincial approval and funding.';
    } else if (approveTitle && role === 'dda_officer') {
        approveTitle.textContent = '6.2 Approving Projects';
        approveHeading.textContent = 'Mayor Project Approval Queue';
        approveDesc.textContent = 'Approve community projects at LLG level before provincial review.';
    }

    const monitorTitle = document.getElementById('monitorWardsTitle');
    const monitorHeading = document.getElementById('monitorWardsHeading');
    const monitorDesc = document.getElementById('monitorWardsDesc');
    if (monitorTitle && role === 'provincial_admin') {
        monitorTitle.textContent = '7.3 Performance Monitoring';
        monitorHeading.textContent = 'Provincial Ward Performance';
        monitorDesc.textContent = 'Monitor ward performance, WDC status, and project delivery province-wide.';
    } else if (monitorTitle) {
        monitorTitle.textContent = '6.4 Monitoring Wards';
        monitorHeading.textContent = 'Ward Monitoring';
        monitorDesc.textContent = 'Track WDC establishment, project progress, and ward performance across the LLG.';
    }
}

function getDashboardSectionId(role) {
    const sectionKey = DEFAULT_DASHBOARD_SECTION[role] || 'dashboard';
    return 'section-' + sectionKey;
}

function roleCanAccess(allowedRoles, role) {
    if (!allowedRoles || allowedRoles === 'all') return true;
    return allowedRoles.split(',').map(r => r.trim()).includes(role);
}

function showToast(message, type = 'success') {
    const container = document.querySelector('.toast-container');
    const colors = {
        success: 'bg-success',
        danger: 'bg-danger',
        warning: 'bg-warning',
        info: 'bg-info'
    };
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white ${colors[type] || 'bg-primary'} border-0 show`;
    toast.role = 'alert';
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}

function showPage(pageId) {
    const loginPage = document.getElementById('page-login');
    const registerPage = document.getElementById('page-register');
    const dashboardPage = document.getElementById('page-dashboard');

    loginPage.style.display = 'none';
    registerPage.style.display = 'none';
    dashboardPage.style.display = 'none';

    if (pageId === 'page-login') {
        loginPage.style.display = 'flex';
    } else if (pageId === 'page-register') {
        registerPage.style.display = 'flex';
    } else if (pageId === 'page-dashboard') {
        dashboardPage.style.display = 'block';
        const wrapper = document.querySelector('.app-wrapper');
        if (wrapper) wrapper.classList.add('active');
    }
}

function activateSection(sectionId) {
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    const section = document.getElementById(sectionId);
    if (section) section.classList.add('active');
}

function applyRoleBasedUI(role) {
    const normalizedRole = (role || 'resident').toLowerCase();
    currentUserRole = normalizedRole;

    document.querySelectorAll('.sidebar-nav .nav-item[data-page]').forEach(btn => {
        const allowed = btn.dataset.roles || 'all';
        const visible = roleCanAccess(allowed, normalizedRole);
        btn.style.display = visible ? '' : 'none';
    });

    updateNavLabelsForRole(normalizedRole);
    updateRoleSectionCopy(normalizedRole);

    const dashboardSectionId = getDashboardSectionId(normalizedRole);
    activateSection(dashboardSectionId);

    const quickStats = document.getElementById('residentQuickStats');
    const wardBanner = document.getElementById('residentWardBanner');
    if (quickStats) quickStats.style.display = normalizedRole === 'resident' ? '' : 'none';
    if (wardBanner && normalizedRole !== 'resident') wardBanner.style.display = 'none';

    document.querySelectorAll('.sidebar-nav .nav-item[data-page]').forEach(b => b.classList.remove('active'));
    const dashboardNav = document.querySelector('.sidebar-nav .nav-item[data-page="dashboard"]');
    if (dashboardNav && dashboardNav.style.display !== 'none') {
        dashboardNav.classList.add('active');
    } else {
        const firstVisible = document.querySelector('.sidebar-nav .nav-item[data-page]:not([style*="none"])');
        if (firstVisible) firstVisible.classList.add('active');
    }

    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');
    const roleLabel = ROLE_LABELS[normalizedRole] || normalizedRole;
    const guideTitle = ROLE_GUIDE[normalizedRole] || 'User Guide';

    if (pageTitle) pageTitle.textContent = getNavLabel('dashboard', normalizedRole);
    if (pageSubtitle) {
        pageSubtitle.innerHTML = `<span class="text-muted">${guideTitle}</span> — Welcome back, <span id="greetingName">${document.getElementById('greetingName')?.textContent || 'User'}</span>!`;
    }

    console.log(`✅ Dashboard configured for role: ${normalizedRole} → #${dashboardSectionId}`);
}

function initSidebarNavigation() {
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebarToggle = document.getElementById('sidebarToggle');

    sidebarToggle?.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        sidebarOverlay.classList.toggle('active');
    });

    sidebarOverlay?.addEventListener('click', () => {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
    });

    document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.nav-item[data-page]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const page = this.dataset.page;
            let sectionId = 'section-' + page;

            if (page === 'dashboard') {
                sectionId = getDashboardSectionId(currentUserRole);
            }

            activateSection(sectionId);

            const pageTitle = document.getElementById('pageTitle');
            if (pageTitle) pageTitle.textContent = getNavLabel(page, currentUserRole) || PAGE_TITLES[page] || 'Dashboard';

            if (page === 'wdc-management') {
                loadWdcManagement();
            }

            if (page === 'requests') {
                loadRequestsModule();
            }

            if (page === 'mfa-security') {
                loadMfaSecurityModule();
            }

            if (page === 'projects') {
                loadResidentProjects();
            }

            if (page === 'ratings') {
                loadRatingsModule();
            }

            if (page === 'complaints') {
                loadComplaintsModule();
            }

            if (page === 'dashboard' && currentUserRole === 'resident') {
                loadResidentDashboard();
            }

            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('active');
        });
    });
}

function initPageNavigation() {
    document.getElementById('showRegisterLink')?.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('page-register');
    });

    document.getElementById('showLoginLink')?.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('page-login');
    });
}

function initPasswordToggles() {
    document.getElementById('togglePassword')?.addEventListener('click', function () {
        const input = document.getElementById('loginPassword');
        const icon = this.querySelector('i');
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
        }
    });

    document.getElementById('toggleRegPassword')?.addEventListener('click', function () {
        const input = document.getElementById('regPassword');
        const icon = this.querySelector('i');
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
        }
    });
}

async function loadUserData(user) {
    try {
        const snapshot = await db.collection('users')
            .where('email', '==', user.email)
            .limit(1)
            .get();

        if (snapshot.empty) return null;

        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();
        const role = userData.role || 'resident';

        currentUserId = userDoc.id;
        currentUserData = userData;

        const firstName = userData.firstName || '';
        const lastName = userData.lastName || '';
        const name = `${firstName} ${lastName}`.trim() || user.displayName || user.email;

        let wardDisplay = '--';
        if (userData.wardId) {
            const wardDoc = await db.collection('wards').doc(userData.wardId).get();
            if (wardDoc.exists) {
                const ward = wardDoc.data();
                wardDisplay = `${ward.wardNumber} — ${ward.wardName}`;
            }
        }

        const nid = userData.nid || '--';

        document.getElementById('userName').textContent = name;
        document.getElementById('userRole').textContent = ROLE_LABELS[role] || role;
        document.getElementById('userWard').textContent = `Ward: ${wardDisplay}`;
        document.getElementById('userNID').textContent = `NID: ${nid}`;
        document.getElementById('greetingName').textContent = firstName || name.split(' ')[0] || 'User';
        document.getElementById('userAvatar').textContent =
            name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

        if (!userData.mfaEnabled || isMfaSessionVerified(userDoc.id)) {
            applyRoleBasedUI(role);
        }
        return userData;

    } catch (error) {
        console.error('❌ Error loading user data:', error);
        return null;
    }
}

// =============================================
// WDC MANAGEMENT MODULE
// =============================================

function addWdcMemberRow() {
    const container = document.getElementById('wdcMemberRows');
    if (!container) return;

    const rowId = 'wdcMemberRow_' + Date.now();
    const row = document.createElement('div');
    row.className = 'row g-2 mb-2 align-items-start wdc-member-row';
    row.id = rowId;
    row.innerHTML = `
        <div class="col-md-5">
            <input type="text" class="form-control wdc-member-userid" placeholder="User ID (e.g., 210529)" />
            <div class="nid-feedback wdc-member-lookup"></div>
        </div>
        <div class="col-md-5">
            <select class="form-select wdc-member-position">
                <option value="Deputy">Deputy</option>
                <option value="Secretary">Secretary</option>
                <option value="Treasurer">Treasurer</option>
                <option value="Member">Member</option>
            </select>
        </div>
        <div class="col-md-2">
            <button type="button" class="btn btn-outline-danger btn-sm w-100 remove-wdc-member-row">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    container.appendChild(row);

    const userIdInput = row.querySelector('.wdc-member-userid');
    const lookupDiv = row.querySelector('.wdc-member-lookup');

    userIdInput.addEventListener('blur', async function () {
        const uid = this.value.trim();
        if (!uid) {
            lookupDiv.textContent = '';
            lookupDiv.className = 'nid-feedback wdc-member-lookup';
            return;
        }
        if (!currentUserData?.wardId) return;
        const result = await lookupUserInWard(uid, currentUserData.wardId);
        lookupDiv.textContent = result.message;
        lookupDiv.className = `nid-feedback wdc-member-lookup ${result.valid ? 'valid' : 'invalid'}`;
    });

    row.querySelector('.remove-wdc-member-row').addEventListener('click', () => row.remove());
}

async function loadWdcChairpersonOptions() {
    const select = document.getElementById('wdcChairpersonSelect');
    if (!select || !currentUserData?.wardId) return;

    select.innerHTML = '<option value="">— Select WDC Chairperson —</option>';
    const users = await getEligibleWdcChairpersons(currentUserData.wardId);

    users.forEach(u => {
        const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.userId;
        const opt = document.createElement('option');
        opt.value = u.userId;
        opt.textContent = `${name} (${ROLE_LABELS[u.role] || u.role})`;
        select.appendChild(opt);
    });
}

async function renderWdcMembersList(wardId) {
    const tbody = document.getElementById('wdcMembersTableBody');
    if (!tbody) return;

    const members = await getWdcMembersByWard(wardId);

    if (members.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center py-3 text-muted">No active WDC members found.</td></tr>`;
        return;
    }

    const rows = await Promise.all(members.map(async (m) => {
        const name = await getUserDisplayName(m.userId);
        return `<tr>
            <td><strong>${name}</strong></td>
            <td>${m.position || '—'}</td>
            <td><span class="badge-status badge-approved">${m.isActive ? 'Active' : 'Inactive'}</span></td>
        </tr>`;
    }));

    tbody.innerHTML = rows.join('');
}

async function loadWdcManagement() {
    const createPanel = document.getElementById('wdcCreatePanel');
    const listPanel = document.getElementById('wdcMembersPanel');
    const wardLabel = document.getElementById('wdcWardLabel');

    if (!createPanel || !listPanel || !currentUserData?.wardId) {
        console.log('❌ WDC management: missing panel or wardId');
        return;
    }

    try {
        const ward = await getWardById(currentUserData.wardId);
        const wardDisplay = ward
            ? `Ward ${ward.wardNumber} — ${ward.wardName}`
            : currentUserData.wardId;

        if (wardLabel) wardLabel.textContent = wardDisplay;

        const hasWdc = await checkWardHasWdc(currentUserData.wardId);

        if (hasWdc) {
            createPanel.style.display = 'none';
            listPanel.style.display = 'block';
            await renderWdcMembersList(currentUserData.wardId);
            console.log('✅ WDC exists — showing members list');
        } else {
            createPanel.style.display = 'block';
            listPanel.style.display = 'none';
            await loadWdcChairpersonOptions();
            console.log('🟢 No WDC — showing create form');
        }
    } catch (error) {
        console.error('❌ Error loading WDC management:', error);
        showToast('Error loading WDC management. Please try again.', 'danger');
    }
}

async function handleCreateWdcSubmit() {
    const btn = document.getElementById('createWdcBtn');
    const chairpersonId = document.getElementById('wdcChairpersonSelect')?.value;

    if (!currentUserData?.wardId) {
        showToast('Could not determine your ward. Please contact support.', 'danger');
        return;
    }

    if (!chairpersonId) {
        showToast('Please select a WDC Chairperson.', 'warning');
        return;
    }

    const memberRows = document.querySelectorAll('.wdc-member-row');
    const additionalMembers = [];

    for (const row of memberRows) {
        const userId = row.querySelector('.wdc-member-userid')?.value.trim();
        const position = row.querySelector('.wdc-member-position')?.value;
        if (!userId) continue;

        const lookup = await lookupUserInWard(userId, currentUserData.wardId);
        if (!lookup.valid) {
            showToast(`Invalid member User ID ${userId}: ${lookup.message.replace('❌ ', '')}`, 'warning');
            return;
        }
        if (userId === chairpersonId) {
            showToast('Chairperson is already added as Chairman. Remove duplicate member row.', 'warning');
            return;
        }
        additionalMembers.push({ userId, position });
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Establishing WDC...';

    try {
        const chairLookup = await lookupUserInWard(chairpersonId, currentUserData.wardId);
        if (!chairLookup.valid) {
            showToast(chairLookup.message, 'danger');
            return;
        }

        await createWdcMember(currentUserData.wardId, chairpersonId, 'Chairman');

        for (const member of additionalMembers) {
            await createWdcMember(currentUserData.wardId, member.userId, member.position);
        }

        const statusUpdated = await setWardWdcStatus(currentUserData.wardId, true);
        if (!statusUpdated) {
            showToast('WDC members created but failed to update ward status. Contact support.', 'warning');
            return;
        }

        const ward = await getWardById(currentUserData.wardId);
        const wardNumber = ward ? ward.wardNumber : '—';

        showToast(`✅ WDC established for Ward ${wardNumber}. This ward can now access government funding.`, 'success');
        console.log('✅ WDC established for ward:', currentUserData.wardId);

        document.getElementById('wdcMemberRows').innerHTML = '';
        addWdcMemberRow();
        await loadWdcManagement();

    } catch (error) {
        console.error('❌ Error establishing WDC:', error);
        showToast(error.message || 'Failed to establish WDC.', 'danger');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-users me-2"></i> Establish WDC';
    }
}

function initWdcManagement() {
    document.getElementById('addWdcMemberRowBtn')?.addEventListener('click', addWdcMemberRow);
    document.getElementById('createWdcBtn')?.addEventListener('click', handleCreateWdcSubmit);

    const container = document.getElementById('wdcMemberRows');
    if (container && container.children.length === 0) {
        addWdcMemberRow();
    }

    console.log('🎯 WDC management module ready');
}

function initUI() {
    initPageNavigation();
    initPasswordToggles();
    initSidebarNavigation();
    initWdcManagement();
    initRequestsModule();
    initMfaModule();
    initResidentModule();
    console.log("🎯 UI module ready");
}
