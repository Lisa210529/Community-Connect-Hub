// =============================================
// AUTH — LOGIN, REGISTER, LOGOUT, FORGOT PASSWORD
// Flow:
//   Register → validate NID (no duplicates) → Firebase Auth + Firestore users
//   Login    → verify Firestore profile → email/password → dashboard access
// =============================================

/** Look up a user profile in Firestore by email. */
async function getUserProfileByEmail(email) {
    const snapshot = await db.collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
}

/** Returns true if this NID is already linked to a registered user. */
async function isNidAlreadyRegistered(nidNumber) {
    const snapshot = await db.collection('users')
        .where('nid', '==', nidNumber)
        .limit(1)
        .get();
    return !snapshot.empty;
}

/** Gate system access using the Firestore profile (after Auth password check). */
function canAccessSystem(userProfile) {
    if (!userProfile) {
        return { allowed: false, message: 'Account not found in the system. Please register first.' };
    }
    if (!userProfile.isApproved) {
        return { allowed: false, message: 'Your account is pending approval. Please contact support.' };
    }
    if (!userProfile.isActive) {
        return { allowed: false, message: 'Your account is inactive. Please contact support.' };
    }
    return { allowed: true };
}

function redirectToDashboard(role, userData) {
    showPage('page-dashboard');

    if (userData) {
        const firstName = userData.firstName || '';
        const greeting = document.getElementById('greetingName');
        if (greeting) greeting.textContent = firstName || 'User';
    }

    applyRoleBasedUI(role || 'resident');
    console.log(`✅ Redirected to dashboard (Role: ${role})`);
}

function initForgotPassword() {
    const forgotModal = new bootstrap.Modal(document.getElementById('forgotPasswordModal'));
    const showForgotPasswordLink = document.getElementById('showForgotPasswordLink');
    const resetPasswordBtn = document.getElementById('resetPasswordBtn');
    const resetEmail = document.getElementById('resetEmail');

    showForgotPasswordLink?.addEventListener('click', (e) => {
        e.preventDefault();
        forgotModal.show();
    });

    resetPasswordBtn?.addEventListener('click', async () => {
        const email = resetEmail.value.trim();

        if (!email) {
            showToast('Please enter your email address.', 'warning');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showToast('Please enter a valid email address.', 'warning');
            return;
        }

        try {
            await firebase.auth().sendPasswordResetEmail(email);
            showToast('Password reset email sent! Check your inbox.', 'success');
            forgotModal.hide();
            resetEmail.value = '';

        } catch (error) {
            console.error('❌ Reset password error:', error);
            if (error.code === 'auth/user-not-found') {
                showToast('No account found with this email address.', 'danger');
            } else {
                showToast(error.message, 'danger');
            }
        }
    });
}

function initRegister() {
    const registerBtn = document.getElementById('registerBtn');

    registerBtn.addEventListener('click', async function () {
        console.log("🟢 Register button clicked!");

        const userId = document.getElementById('regUserId').value.trim();
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const nid = document.getElementById('regNID').value.trim();
        const role = document.getElementById('regRole').value;

        if (!userId || !name || !email || !password || !nid) {
            showToast('Please fill in all required fields (User ID, Name, Email, Password, NID).', 'warning');
            return;
        }

        if (!/^\d{6,10}$/.test(userId)) {
            showToast('User ID must be 6-10 digits (e.g., 210529).', 'warning');
            return;
        }

        const passwordCheck = validatePassword(password);
        if (!passwordCheck.valid) {
            showToast(passwordCheck.message, 'warning');
            const passwordHelp = document.getElementById('passwordHelp');
            if (passwordHelp) {
                passwordHelp.textContent = passwordCheck.message.replace('❌ Password must include: ', 'Missing: ');
                passwordHelp.className = 'form-text nid-feedback invalid';
            }
            return;
        }

        if (!/^\d{9}$/.test(nid)) {
            showToast('NID must be exactly 9 digits (e.g., 123456789).', 'warning');
            return;
        }

        try {
            const existingUser = await db.collection('users').doc(userId).get();
            if (existingUser.exists) {
                showToast('This User ID is already registered. Please use a different ID or login.', 'danger');
                return;
            }

            const emailTaken = await getUserProfileByEmail(email);
            if (emailTaken) {
                showToast('This email is already registered. Please login or use a different email.', 'danger');
                return;
            }
        } catch (error) {
            console.error('❌ Error checking User ID:', error);
            showToast('Error checking registration details. Please try again.', 'danger');
            return;
        }

        const nidValidation = await validateNID(nid);
        if (!nidValidation.valid) {
            showToast(nidValidation.message, 'danger');
            return;
        }

        try {
            const nidTaken = await isNidAlreadyRegistered(nid);
            if (nidTaken) {
                showToast('This NID is already registered. Each resident may only register once.', 'danger');
                return;
            }
        } catch (error) {
            console.error('❌ Error checking NID:', error);
            showToast('Error checking NID. Please try again.', 'danger');
            return;
        }

        this.disabled = true;
        this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Registering...';

        let authUser = null;

        try {
            const nidData = nidValidation.userData;
            const nameFromNID = nidData.name;
            const wardId = await resolveWardIdFromNid(nidData);

            if (!wardId) {
                showToast('Could not resolve ward for this NID. Please contact your LLG office.', 'danger');
                return;
            }

            console.log('🟢 Creating Firebase Auth account...');
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            authUser = userCredential.user;
            await authUser.updateProfile({ displayName: name });

            console.log('🟢 Saving user profile to Firestore...');
            await db.collection('users').doc(userId).set({
                userId: userId,
                firstName: name.split(' ')[0] || name,
                lastName: name.split(' ').slice(1).join(' ') || '',
                email: email,
                nid: nid,
                role: role,
                wardId: wardId,
                isApproved: role === 'resident',
                isActive: true,
                mfaEnabled: false,
                mfaSmsEnabled: false,
                mfaTotpEnabled: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            await firebase.auth().signOut();

            console.log('✅ Registration successful — profile stored in Firestore');
            showToast(`Registration successful! Welcome ${nameFromNID}. Please login with your email and password.`, 'success');

            document.getElementById('regUserId').value = '';
            document.getElementById('regName').value = '';
            document.getElementById('regEmail').value = '';
            document.getElementById('regPassword').value = '';
            document.getElementById('regNID').value = '';
            document.getElementById('nidValidationResult').textContent = '';
            document.getElementById('nidValidationResult').className = 'nid-feedback';
            document.getElementById('passwordValidationResult').innerHTML = '';
            document.getElementById('passwordValidationResult').className = 'nid-feedback';
            const passwordHelp = document.getElementById('passwordHelp');
            if (passwordHelp) {
                passwordHelp.textContent = 'Use at least 8 characters with uppercase, lowercase, a number, and a special character.';
                passwordHelp.className = 'form-text';
            }

            setTimeout(() => showPage('page-login'), 2000);

        } catch (error) {
            console.error('❌ Registration error:', error);
            if (authUser) {
                try {
                    await authUser.delete();
                    console.log('🔄 Rolled back Auth account after Firestore save failure');
                } catch (deleteErr) {
                    console.error('❌ Could not roll back Auth account:', deleteErr);
                }
            }
            if (error.code === 'auth/email-already-in-use') {
                showToast('This email is already registered. Please login instead.', 'danger');
            } else {
                showToast(error.message, 'danger');
            }
        } finally {
            this.disabled = false;
            this.innerHTML = '<i class="fas fa-user-plus me-2"></i> Register';
        }
    });
}

function initLogin() {
    const loginBtn = document.getElementById('loginBtn');

    loginBtn.addEventListener('click', async () => {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            showToast('Please enter your email and password.', 'warning');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showToast('Please enter a valid email address.', 'warning');
            return;
        }

        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Signing in...';

        try {
            const userProfile = await getUserProfileByEmail(email);
            if (!userProfile) {
                showToast('No account found in the system. Please register first.', 'danger');
                return;
            }

            const access = canAccessSystem(userProfile);
            if (!access.allowed) {
                showToast(access.message, userProfile.isApproved === false ? 'warning' : 'danger');
                return;
            }

            await firebase.auth().signInWithEmailAndPassword(email, password);

            const userData = await loadUserData(firebase.auth().currentUser);
            if (!userData) {
                await firebase.auth().signOut();
                showToast('Account profile could not be loaded. Please contact support.', 'danger');
                return;
            }

            if (userData.mfaEnabled && !isMfaSessionVerified(currentUserId)) {
                showToast('Password verified. Complete MFA verification.', 'info');
                showMfaVerificationModal({ ...userData, userId: currentUserId });
                showPage('page-login');
                return;
            }

            showToast('Login successful!', 'success');
            showPage('page-dashboard');
            await loadDashboardData();

        } catch (error) {
            console.error('❌ Login error:', error);
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                showToast('Invalid email or password. Please try again.', 'danger');
            } else if (error.code === 'auth/wrong-password') {
                showToast('Incorrect password. Please try again.', 'danger');
            } else if (error.code === 'auth/invalid-email') {
                showToast('Please enter a valid email address.', 'warning');
            } else {
                showToast(error.message, 'danger');
            }
        } finally {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i> Login';
        }
    });
}

function initLogout() {
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        try {
            const uid = currentUserId;
            await firebase.auth().signOut();
            if (uid) clearMfaSession(uid);
            currentUserData = null;
            currentUserId = null;
            showToast('Logged out successfully.', 'info');
            showPage('page-login');
        } catch (error) {
            showToast(error.message, 'danger');
            console.error('❌ Logout error:', error);
        }
    });
}

function initAuthStateObserver() {
    firebase.auth().onAuthStateChanged(async (user) => {
        console.log("🟢 Auth state changed:", user ? "Logged in" : "Logged out");

        if (!user) {
            showPage('page-login');
            return;
        }

        const modalEl = document.getElementById('mfaVerifyModal');
        const mfaModalOpen = modalEl?.classList.contains('show');

        if (mfaModalOpen) {
            return;
        }

        const userData = await loadUserData(user);
        if (!userData) {
            await firebase.auth().signOut();
            showPage('page-login');
            return;
        }

        const access = canAccessSystem(userData);
        if (!access.allowed) {
            await firebase.auth().signOut();
            showPage('page-login');
            return;
        }

        if (userData.mfaEnabled && !isMfaSessionVerified(currentUserId)) {
            showMfaVerificationModal({ ...userData, userId: currentUserId });
            showPage('page-login');
            return;
        }

        showPage('page-dashboard');
        await loadDashboardData();
    });
}

function initEnterKeySupport() {
    const loginPage = document.getElementById('page-login');
    const registerPage = document.getElementById('page-register');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            if (loginPage.style.display !== 'none') loginBtn.click();
            else if (registerPage.style.display !== 'none') registerBtn.click();
        }
    });
}

function initAuth() {
    initForgotPassword();
    initRegister();
    initLogin();
    initLogout();
    initAuthStateObserver();
    initEnterKeySupport();
    console.log("🎯 Auth module ready");
}

document.addEventListener('DOMContentLoaded', () => {
    initNidValidation();
    initPasswordValidation();
    initUI();
    initAuth();
    console.log("📝 Waiting for user interaction...");
});
