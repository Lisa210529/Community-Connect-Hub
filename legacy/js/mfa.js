// =============================================
// MULTI-FACTOR AUTHENTICATION (SMS + TOTP)
// Section 3.2 — Login & Security
// =============================================

const MFA_SESSION_HOURS = 8;
const SMS_OTP_EXPIRY_MS = 5 * 60 * 1000;

function isMfaSessionVerified(userId) {
    const ts = sessionStorage.getItem('mfaVerified_' + userId);
    if (!ts) return false;
    return Date.now() - parseInt(ts, 10) < MFA_SESSION_HOURS * 60 * 60 * 1000;
}

function markMfaSessionVerified(userId) {
    sessionStorage.setItem('mfaVerified_' + userId, String(Date.now()));
}

function clearMfaSession(userId) {
    if (userId) sessionStorage.removeItem('mfaVerified_' + userId);
}

function generateRandomBase32Secret(length = 20) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
        secret += chars[array[i] % chars.length];
    }
    return secret;
}

function generateSmsOtpCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

function createTotpInstance(secret, label) {
    if (typeof OTPAuth === 'undefined') {
        throw new Error('OTPAuth library not loaded');
    }
    return new OTPAuth.TOTP({
        issuer: 'Community Connect Hub',
        label: label || 'user',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(secret)
    });
}

function verifyTotpCode(secret, token, label) {
    try {
        const totp = createTotpInstance(secret, label);
        const delta = totp.validate({ token: String(token).trim(), window: 1 });
        return delta !== null;
    } catch (e) {
        console.error('TOTP verify error:', e);
        return false;
    }
}

function getTotpUri(secret, label) {
    const totp = createTotpInstance(secret, label);
    return totp.toString();
}

async function storeSmsOtp(userId, code) {
    await db.collection('users').doc(userId).update({
        mfaSmsOtp: code,
        mfaSmsOtpExpiry: Date.now() + SMS_OTP_EXPIRY_MS,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
}

async function sendSmsOtpForUser(userId, phone) {
    const code = generateSmsOtpCode();
    await storeSmsOtp(userId, code);

    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocal) {
        console.log(`📱 [Emulator] SMS OTP for ${phone}: ${code}`);
        showToast(`Emulator SMS code sent to ${phone}: ${code}`, 'info');
    } else {
        showToast(`Verification code sent to ${phone}.`, 'success');
    }
    return true;
}

async function verifySmsOtpForUser(userId, code) {
    const doc = await db.collection('users').doc(userId).get();
    if (!doc.exists) return false;

    const data = doc.data();
    if (!data.mfaSmsOtp || !data.mfaSmsOtpExpiry) return false;
    if (Date.now() > data.mfaSmsOtpExpiry) return false;
    if (String(data.mfaSmsOtp) !== String(code).trim()) return false;

    await db.collection('users').doc(userId).update({
        mfaSmsOtp: firebase.firestore.FieldValue.delete(),
        mfaSmsOtpExpiry: firebase.firestore.FieldValue.delete()
    });
    return true;
}

async function enrollMfaSms(userId, phone) {
    const normalized = phone.replace(/\s/g, '');
    if (!/^\+?[0-9]{10,15}$/.test(normalized)) {
        showToast('Enter a valid phone number (e.g. +67571234567).', 'warning');
        return false;
    }

    await db.collection('users').doc(userId).update({
        mfaSmsEnabled: true,
        mfaPhone: normalized,
        mfaEnabled: true,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    if (currentUserData) {
        currentUserData.mfaSmsEnabled = true;
        currentUserData.mfaPhone = normalized;
        currentUserData.mfaEnabled = true;
    }

    showToast('SMS MFA enrolled successfully.', 'success');
    return true;
}

async function enrollMfaTotp(userId, secret) {
    await db.collection('users').doc(userId).update({
        mfaTotpEnabled: true,
        mfaTotpSecret: secret,
        mfaEnabled: true,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    if (currentUserData) {
        currentUserData.mfaTotpEnabled = true;
        currentUserData.mfaTotpSecret = secret;
        currentUserData.mfaEnabled = true;
    }

    showToast('Authenticator app (TOTP) enrolled successfully.', 'success');
    return true;
}

async function disableMfa(userId) {
    await db.collection('users').doc(userId).update({
        mfaEnabled: false,
        mfaSmsEnabled: false,
        mfaTotpEnabled: false,
        mfaPhone: firebase.firestore.FieldValue.delete(),
        mfaTotpSecret: firebase.firestore.FieldValue.delete(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    if (currentUserData) {
        currentUserData.mfaEnabled = false;
        currentUserData.mfaSmsEnabled = false;
        currentUserData.mfaTotpEnabled = false;
    }

    clearMfaSession(userId);
    showToast('MFA has been disabled for your account.', 'info');
}

function renderMfaEnrollmentPanel() {
    const panel = document.getElementById('mfaEnrollmentPanel');
    if (!panel || !currentUserData) return;

    const u = currentUserData;
    const smsOn = u.mfaSmsEnabled === true;
    const totpOn = u.mfaTotpEnabled === true;

    document.getElementById('mfaStatusBadge').innerHTML = u.mfaEnabled
        ? '<span class="badge-status badge-approved">MFA Active</span>'
        : '<span class="badge-status badge-pending">MFA Not Enrolled</span>';

    document.getElementById('mfaSmsStatus').textContent = smsOn
        ? `Enrolled — ${u.mfaPhone || 'Phone on file'}`
        : 'Not enrolled';

    document.getElementById('mfaTotpStatus').textContent = totpOn
        ? 'Enrolled — Authenticator app'
        : 'Not enrolled';

    document.getElementById('mfaSmsEnrollForm').style.display = smsOn ? 'none' : '';
    document.getElementById('mfaTotpEnrollForm').style.display = totpOn ? 'none' : '';
    document.getElementById('mfaDisablePanel').style.display = u.mfaEnabled ? '' : 'none';
}

async function startTotpEnrollment() {
    if (!currentUserId || !currentUserData) return;

    const secret = generateRandomBase32Secret();
    const label = currentUserData.email || currentUserId;
    const uri = getTotpUri(secret, label);

    document.getElementById('mfaTotpSecretDisplay').textContent = secret;
    document.getElementById('mfaTotpUriDisplay').textContent = uri;

    const qrCanvas = document.getElementById('mfaTotpQrCanvas');
    if (qrCanvas && typeof QRCode !== 'undefined') {
        QRCode.toCanvas(qrCanvas, uri, { width: 180, margin: 1 }, (err) => {
            if (err) console.error('QR error:', err);
        });
    }

    document.getElementById('mfaTotpPendingSecret').value = secret;
    document.getElementById('mfaTotpSetupPanel').style.display = '';
}

async function confirmTotpEnrollment() {
    const secret = document.getElementById('mfaTotpPendingSecret').value;
    const code = document.getElementById('mfaTotpConfirmCode').value.trim();

    if (!secret || !code) {
        showToast('Scan the QR code and enter the 6-digit code from your app.', 'warning');
        return;
    }

    if (!verifyTotpCode(secret, code, currentUserData?.email || currentUserId)) {
        showToast('Invalid authenticator code. Try again.', 'danger');
        return;
    }

    await enrollMfaTotp(currentUserId, secret);
    document.getElementById('mfaTotpSetupPanel').style.display = 'none';
    document.getElementById('mfaTotpConfirmCode').value = '';
    renderMfaEnrollmentPanel();
}

async function confirmSmsEnrollment() {
    const phone = document.getElementById('mfaEnrollPhone').value.trim();
    const code = document.getElementById('mfaSmsEnrollCode').value.trim();

    if (!phone) {
        showToast('Enter your mobile number.', 'warning');
        return;
    }

    if (!code) {
        showToast('Click "Send SMS Code" first, then enter the code.', 'warning');
        return;
    }

    const valid = await verifySmsOtpForUser(currentUserId, code);
    if (!valid) {
        showToast('Invalid or expired SMS code.', 'danger');
        return;
    }

    await enrollMfaSms(currentUserId, phone);
    document.getElementById('mfaEnrollPhone').value = '';
    document.getElementById('mfaSmsEnrollCode').value = '';
    renderMfaEnrollmentPanel();
}

function showMfaVerificationModal(userData) {
    const modalEl = document.getElementById('mfaVerifyModal');
    const methodsEl = document.getElementById('mfaVerifyMethods');

    let html = '';
    if (userData.mfaTotpEnabled) {
        html += `<div class="mb-3">
            <label class="form-label"><i class="fas fa-mobile-alt me-1"></i> Authenticator App (TOTP)</label>
            <input type="text" class="form-control" id="mfaVerifyTotpCode" placeholder="6-digit code" maxlength="6" inputmode="numeric" />
        </div>`;
    }
    if (userData.mfaSmsEnabled) {
        html += `<div class="mb-3">
            <label class="form-label"><i class="fas fa-sms me-1"></i> SMS Verification</label>
            <div class="input-group">
                <input type="text" class="form-control" id="mfaVerifySmsCode" placeholder="6-digit SMS code" maxlength="6" inputmode="numeric" />
                <button type="button" class="btn btn-outline-primary" id="mfaResendSmsBtn">Send Code</button>
            </div>
        </div>`;
    }

    methodsEl.innerHTML = html;
    const uid = userData.userId || currentUserId;
    modalEl.dataset.mfaUserId = uid;

    methodsEl.onclick = async (e) => {
        if (e.target.id === 'mfaResendSmsBtn') {
            await sendSmsOtpForUser(uid, userData.mfaPhone);
        }
    };

    bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

async function completeMfaVerification() {
    const modalEl = document.getElementById('mfaVerifyModal');
    const userId = modalEl.dataset.mfaUserId || currentUserId;
    const doc = await db.collection('users').doc(userId).get();
    if (!doc.exists) return false;

    const userData = doc.data();
    let verified = false;

    if (userData.mfaTotpEnabled) {
        const totpCode = document.getElementById('mfaVerifyTotpCode')?.value.trim();
        if (totpCode && verifyTotpCode(userData.mfaTotpSecret, totpCode, userData.email)) {
            verified = true;
        }
    }

    if (!verified && userData.mfaSmsEnabled) {
        const smsCode = document.getElementById('mfaVerifySmsCode')?.value.trim();
        if (smsCode && await verifySmsOtpForUser(userId, smsCode)) {
            verified = true;
        }
    }

    if (!verified) {
        showToast('Invalid verification code. Try SMS or authenticator app.', 'danger');
        return false;
    }

    markMfaSessionVerified(userId);
    bootstrap.Modal.getInstance(modalEl)?.hide();
    showToast('MFA verification successful.', 'success');

    await loadUserData(firebase.auth().currentUser);
    await loadDashboardData();
    showPage('page-dashboard');
    applyRoleBasedUI(userData.role || 'resident');
    return true;
}

async function cancelMfaVerification() {
    bootstrap.Modal.getInstance(document.getElementById('mfaVerifyModal'))?.hide();
    await firebase.auth().signOut();
    showToast('Login cancelled — MFA verification required.', 'warning');
}

function loadMfaSecurityModule() {
    renderMfaEnrollmentPanel();
}

function initMfaModule() {
    document.getElementById('mfaVerifySubmitBtn')?.addEventListener('click', completeMfaVerification);
    document.getElementById('mfaVerifyCancelBtn')?.addEventListener('click', cancelMfaVerification);

    document.getElementById('mfaSendSmsEnrollBtn')?.addEventListener('click', async () => {
        const phone = document.getElementById('mfaEnrollPhone').value.trim();
        if (!phone) {
            showToast('Enter your phone number first.', 'warning');
            return;
        }
        await sendSmsOtpForUser(currentUserId, phone);
    });

    document.getElementById('mfaConfirmSmsEnrollBtn')?.addEventListener('click', confirmSmsEnrollment);
    document.getElementById('mfaStartTotpBtn')?.addEventListener('click', startTotpEnrollment);
    document.getElementById('mfaConfirmTotpEnrollBtn')?.addEventListener('click', confirmTotpEnrollment);

    document.getElementById('mfaDisableBtn')?.addEventListener('click', async () => {
        if (!currentUserId) return;
        if (confirm('Disable MFA for your account? This reduces security.')) {
            await disableMfa(currentUserId);
            renderMfaEnrollmentPanel();
        }
    });

    console.log('🎯 MFA module ready');
}
