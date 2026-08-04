// =============================================
// CRUD OPERATIONS (3NF — IDs only, no denormalized lookups)
// =============================================

async function createUser(userId, userData) {
    try {
        await db.collection('users').doc(userId).set({
            userId: userId,
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: userData.email || '',
            nid: userData.nid || '',
            role: userData.role || 'resident',
            wardId: userData.wardId || '',
            isApproved: userData.isApproved !== undefined ? userData.isApproved : false,
            isActive: userData.isActive !== undefined ? userData.isActive : true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ User created:', userId);
        return true;
    } catch (error) {
        console.error('❌ Error creating user:', error);
        return false;
    }
}

async function createProject(projectData) {
    try {
        const docRef = await db.collection('projects').add({
            projectName: projectData.projectName || '',
            description: projectData.description || '',
            category: projectData.category || 'Infrastructure',
            status: projectData.status || 'pending_wdc',
            budget: projectData.budget || 0,
            fundingSource: projectData.fundingSource || 'PSIP',
            location: projectData.location || '',
            wardId: projectData.wardId || '',
            councillorId: projectData.councillorId || '',
            wdcApproved: false,
            mayorApproved: false,
            provincialApproved: false,
            originatingRequestId: projectData.originatingRequestId || '',
            dateLogged: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ Project created:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Error creating project:', error);
        return null;
    }
}

async function createRequest(requestData) {
    try {
        const docRef = await db.collection('requests').add({
            residentId: requestData.residentId || '',
            wardId: requestData.wardId || '',
            requestType: requestData.requestType || 'project',
            title: requestData.title || '',
            communityNeed: requestData.communityNeed || '',
            category: requestData.category || 'Infrastructure',
            description: requestData.description || requestData.communityNeed || '',
            status: 'pending_wdc',
            submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ Request created:', docRef.id, '→ status: pending_wdc');
        return docRef.id;
    } catch (error) {
        console.error('❌ Error creating request:', error);
        return null;
    }
}

async function createAnnouncement(announcementData) {
    try {
        const docRef = await db.collection('announcements').add({
            title: announcementData.title || '',
            content: announcementData.content || '',
            priority: announcementData.priority || 'medium',
            targetAudience: announcementData.targetAudience || 'ward_only',
            wardId: announcementData.wardId || '',
            createdBy: announcementData.createdBy || '',
            isActive: true
        });
        console.log('✅ Announcement created:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Error creating announcement:', error);
        return null;
    }
}

async function createRating(ratingData) {
    try {
        const scores = [
            ratingData.category1Score || 0,
            ratingData.category2Score || 0,
            ratingData.category3Score || 0,
            ratingData.category4Score || 0,
            ratingData.category5Score || 0
        ];
        const docRef = await db.collection('ratings').add({
            projectId: ratingData.projectId || '',
            residentId: ratingData.residentId || '',
            category1Score: scores[0],
            category2Score: scores[1],
            category3Score: scores[2],
            category4Score: scores[3],
            category5Score: scores[4],
            overallScore: scores.reduce((a, b) => a + b, 0) / 5,
            isAnonymous: ratingData.isAnonymous || false
        });
        console.log('✅ Rating created:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Error creating rating:', error);
        return null;
    }
}

async function getUser(userId) {
    try {
        const doc = await db.collection('users').doc(userId).get();
        if (doc.exists) {
            console.log('✅ User found:', doc.data());
            return doc.data();
        }
        console.log('❌ User not found');
        return null;
    } catch (error) {
        console.error('❌ Error getting user:', error);
        return null;
    }
}

async function getAllUsers() {
    try {
        const snapshot = await db.collection('users').get();
        const users = [];
        snapshot.forEach(doc => users.push({ id: doc.id, ...doc.data() }));
        console.log('✅ Users loaded:', users.length);
        return users;
    } catch (error) {
        console.error('❌ Error getting users:', error);
        return [];
    }
}

async function getAllProjects() {
    try {
        const snapshot = await db.collection('projects').get();
        const projects = [];
        snapshot.forEach(doc => projects.push({ id: doc.id, ...doc.data() }));
        console.log('✅ Projects loaded:', projects.length);
        return projects;
    } catch (error) {
        console.error('❌ Error getting projects:', error);
        return [];
    }
}

async function getProjectsByWard(wardId) {
    try {
        const snapshot = await db.collection('projects').where('wardId', '==', wardId).get();
        const projects = [];
        snapshot.forEach(doc => projects.push({ id: doc.id, ...doc.data() }));
        console.log('✅ Projects in ward loaded:', projects.length);
        return projects;
    } catch (error) {
        console.error('❌ Error getting projects:', error);
        return [];
    }
}

async function getRequestsByResident(residentId) {
    try {
        const snapshot = await db.collection('requests').where('residentId', '==', residentId).get();
        const requests = [];
        snapshot.forEach(doc => requests.push({ id: doc.id, ...doc.data() }));
        requests.sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0));
        console.log('✅ Requests loaded:', requests.length);
        return requests;
    } catch (error) {
        console.error('❌ Error getting requests:', error);
        return [];
    }
}

async function getRequestsByWard(wardId) {
    try {
        const snapshot = await db.collection('requests').where('wardId', '==', wardId).get();
        const requests = [];
        snapshot.forEach(doc => requests.push({ id: doc.id, ...doc.data() }));
        requests.sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0));
        console.log('✅ Ward requests loaded:', requests.length);
        return requests;
    } catch (error) {
        console.error('❌ Error getting ward requests:', error);
        return [];
    }
}

async function getAllRequests() {
    try {
        const snapshot = await db.collection('requests').get();
        const requests = [];
        snapshot.forEach(doc => requests.push({ id: doc.id, ...doc.data() }));
        requests.sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0));
        return requests;
    } catch (error) {
        console.error('❌ Error getting all requests:', error);
        return [];
    }
}

async function getRequestsByCouncillor(councillorId) {
    try {
        const snapshot = await db.collection('requests').where('assignedTo', '==', councillorId).get();
        const requests = [];
        snapshot.forEach(doc => requests.push({ id: doc.id, ...doc.data() }));
        console.log('✅ Requests loaded:', requests.length);
        return requests;
    } catch (error) {
        console.error('❌ Error getting requests:', error);
        return [];
    }
}

async function getAnnouncementsByWard(wardId) {
    try {
        const snapshot = await db.collection('announcements')
            .where('wardId', '==', wardId)
            .where('isActive', '==', true)
            .get();
        const announcements = [];
        snapshot.forEach(doc => announcements.push({ id: doc.id, ...doc.data() }));
        console.log('✅ Announcements loaded:', announcements.length);
        return announcements;
    } catch (error) {
        console.error('❌ Error getting announcements:', error);
        return [];
    }
}

async function getRatingsByProject(projectId) {
    try {
        const snapshot = await db.collection('ratings').where('projectId', '==', projectId).get();
        const ratings = [];
        snapshot.forEach(doc => ratings.push({ id: doc.id, ...doc.data() }));
        console.log('✅ Ratings loaded:', ratings.length);
        return ratings;
    } catch (error) {
        console.error('❌ Error getting ratings:', error);
        return [];
    }
}

async function getRatingsByResident(residentId) {
    try {
        const snapshot = await db.collection('ratings').where('residentId', '==', residentId).get();
        const ratings = [];
        snapshot.forEach(doc => ratings.push({ id: doc.id, ...doc.data() }));
        return ratings;
    } catch (error) {
        console.error('❌ Error getting resident ratings:', error);
        return [];
    }
}

async function hasResidentRatedProject(residentId, projectId) {
    try {
        const snapshot = await db.collection('ratings')
            .where('residentId', '==', residentId)
            .where('projectId', '==', projectId)
            .limit(1)
            .get();
        return !snapshot.empty;
    } catch (error) {
        console.error('❌ Error checking rating:', error);
        return false;
    }
}

async function createComplaint(complaintData) {
    try {
        const docRef = await db.collection('complaints').add({
            residentId: complaintData.residentId || '',
            wardId: complaintData.wardId || '',
            projectId: complaintData.projectId || '',
            subject: complaintData.subject || '',
            category: complaintData.category || 'General',
            description: complaintData.description || '',
            status: 'pending',
            submittedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ Complaint created:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Error creating complaint:', error);
        return null;
    }
}

async function getComplaintsByResident(residentId) {
    try {
        const snapshot = await db.collection('complaints').where('residentId', '==', residentId).get();
        const complaints = [];
        snapshot.forEach(doc => complaints.push({ id: doc.id, ...doc.data() }));
        complaints.sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0));
        return complaints;
    } catch (error) {
        console.error('❌ Error getting complaints:', error);
        return [];
    }
}

async function getComplaintsByWard(wardId) {
    try {
        const snapshot = await db.collection('complaints').where('wardId', '==', wardId).get();
        const complaints = [];
        snapshot.forEach(doc => complaints.push({ id: doc.id, ...doc.data() }));
        return complaints;
    } catch (error) {
        console.error('❌ Error getting ward complaints:', error);
        return [];
    }
}

async function getAverageRating(projectId) {
    try {
        const ratings = await getRatingsByProject(projectId);
        if (ratings.length === 0) return 0;
        const total = ratings.reduce((sum, r) => sum + (r.overallScore || 0), 0);
        return total / ratings.length;
    } catch (error) {
        console.error('❌ Error calculating average rating:', error);
        return 0;
    }
}

async function updateUser(userId, updateData) {
    try {
        await db.collection('users').doc(userId).update({
            ...updateData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ User updated:', userId);
        return true;
    } catch (error) {
        console.error('❌ Error updating user:', error);
        return false;
    }
}

async function updateProject(projectId, updateData) {
    try {
        await db.collection('projects').doc(projectId).update(updateData);
        console.log('✅ Project updated:', projectId);
        return true;
    } catch (error) {
        console.error('❌ Error updating project:', error);
        return false;
    }
}

async function updateProjectStatus(projectId, status) {
    return await updateProject(projectId, { status: status });
}

async function updateRequest(requestId, updateData) {
    try {
        await db.collection('requests').doc(requestId).update(updateData);
        console.log('✅ Request updated:', requestId);
        return true;
    } catch (error) {
        console.error('❌ Error updating request:', error);
        return false;
    }
}

async function updateRequestStatus(requestId, status, extraData = {}) {
    return await updateRequest(requestId, {
        status: status,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        ...extraData
    });
}

async function approveUser(userId) {
    return await updateUser(userId, { isApproved: true });
}

async function updateUserRole(userId, newRole) {
    return await updateUser(userId, { role: newRole });
}

async function deleteUser(userId) {
    try {
        await db.collection('users').doc(userId).delete();
        console.log('✅ User deleted:', userId);
        return true;
    } catch (error) {
        console.error('❌ Error deleting user:', error);
        return false;
    }
}

async function deleteProject(projectId) {
    try {
        await db.collection('projects').doc(projectId).delete();
        console.log('✅ Project deleted:', projectId);
        return true;
    } catch (error) {
        console.error('❌ Error deleting project:', error);
        return false;
    }
}

async function deleteRequest(requestId) {
    try {
        await db.collection('requests').doc(requestId).delete();
        console.log('✅ Request deleted:', requestId);
        return true;
    } catch (error) {
        console.error('❌ Error deleting request:', error);
        return false;
    }
}

async function deleteRating(ratingId) {
    try {
        await db.collection('ratings').doc(ratingId).delete();
        console.log('✅ Rating deleted:', ratingId);
        return true;
    } catch (error) {
        console.error('❌ Error deleting rating:', error);
        return false;
    }
}

// =============================================
// WDC MANAGEMENT
// =============================================

async function createWdcMember(wardId, userId, position) {
    try {
        const docRef = await db.collection('wdc_members').add({
            wardId: wardId,
            userId: userId,
            position: position,
            isActive: true
        });
        console.log('✅ WDC member created:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Error creating WDC member:', error);
        return null;
    }
}

async function getWdcMembersByWard(wardId) {
    try {
        const snapshot = await db.collection('wdc_members')
            .where('wardId', '==', wardId)
            .where('isActive', '==', true)
            .get();
        const members = [];
        snapshot.forEach(doc => {
            members.push({ wdcMemberId: doc.id, ...doc.data() });
        });
        console.log('✅ WDC members loaded:', members.length);
        return members;
    } catch (error) {
        console.error('❌ Error getting WDC members:', error);
        return [];
    }
}

async function checkWardHasWdc(wardId) {
    try {
        const doc = await db.collection('wards').doc(wardId).get();
        if (!doc.exists) return false;
        return doc.data().wdcExists === true;
    } catch (error) {
        console.error('❌ Error checking ward WDC status:', error);
        return false;
    }
}

async function setWardWdcStatus(wardId, exists) {
    try {
        await db.collection('wards').doc(wardId).update({ wdcExists: exists });
        console.log(`✅ Ward ${wardId} wdcExists set to:`, exists);
        return true;
    } catch (error) {
        console.error('❌ Error updating ward WDC status:', error);
        return false;
    }
}

async function getWardById(wardId) {
    try {
        const doc = await db.collection('wards').doc(wardId).get();
        if (!doc.exists) return null;
        return { wardId: doc.id, ...doc.data() };
    } catch (error) {
        console.error('❌ Error getting ward:', error);
        return null;
    }
}

async function getEligibleWdcChairpersons(wardId) {
    try {
        const snapshot = await db.collection('users')
            .where('wardId', '==', wardId)
            .where('isApproved', '==', true)
            .where('isActive', '==', true)
            .get();
        const users = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            const role = data.role || '';
            if (role === 'councillor' || role === 'wdc_chairperson') {
                users.push({ userId: doc.id, ...data });
            }
        });
        console.log('✅ Eligible chairpersons loaded:', users.length);
        return users;
    } catch (error) {
        console.error('❌ Error loading eligible chairpersons:', error);
        return [];
    }
}

async function lookupUserInWard(userId, wardId) {
    try {
        const doc = await db.collection('users').doc(userId).get();
        if (!doc.exists) {
            return { valid: false, message: '❌ User ID not found' };
        }
        const data = doc.data();
        if (data.wardId !== wardId) {
            return { valid: false, message: '❌ User is not registered in this ward' };
        }
        if (!data.isApproved) {
            return { valid: false, message: '❌ User account is not approved' };
        }
        if (!data.isActive) {
            return { valid: false, message: '❌ User account is inactive' };
        }
        const name = `${data.firstName || ''} ${data.lastName || ''}`.trim() || userId;
        return { valid: true, message: `✅ ${name}`, userData: data, userId: doc.id };
    } catch (error) {
        console.error('❌ Error looking up user:', error);
        return { valid: false, message: '❌ Error looking up user' };
    }
}

async function getUserDisplayName(userId) {
    try {
        const doc = await db.collection('users').doc(userId).get();
        if (!doc.exists) return 'Unknown User';
        const data = doc.data();
        return `${data.firstName || ''} ${data.lastName || ''}`.trim() || userId;
    } catch (error) {
        console.error('❌ Error getting user display name:', error);
        return 'Unknown User';
    }
}
