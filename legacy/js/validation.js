// =============================================
// PASSWORD COMPLEXITY VALIDATION
// =============================================

const PASSWORD_RULE_LABELS = {
    minLength: 'At least 8 characters',
    uppercase: 'One uppercase letter (A–Z)',
    lowercase: 'One lowercase letter (a–z)',
    number: 'One number (0–9)',
    special: 'One special character (!@#$…)'
};

function validatePassword(password) {
    const rules = {
        minLength: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password)
    };

    const failedRules = Object.keys(rules).filter(key => !rules[key]);
    const failedLabels = failedRules.map(key => PASSWORD_RULE_LABELS[key]);

    return {
        valid: failedRules.length === 0,
        rules,
        failedRules,
        message: failedRules.length === 0
            ? '✅ Password meets all requirements'
            : `❌ Password must include: ${failedLabels.join('; ')}`
    };
}

function renderPasswordChecklist(rules) {
    return Object.keys(PASSWORD_RULE_LABELS).map(key => {
        const met = rules[key];
        const cls = met ? 'valid' : 'invalid';
        const icon = met ? '✅' : '○';
        return `<div class="nid-feedback ${cls}">${icon} ${PASSWORD_RULE_LABELS[key]}</div>`;
    }).join('');
}

function initPasswordValidation() {
    const input = document.getElementById('regPassword');
    const resultDiv = document.getElementById('passwordValidationResult');
    const helpText = document.getElementById('passwordHelp');

    if (!input || !resultDiv) return;

    input.addEventListener('input', function () {
        const password = this.value;

        if (password.length === 0) {
            resultDiv.innerHTML = '';
            resultDiv.className = 'nid-feedback';
            this.className = 'form-control';
            if (helpText) {
                helpText.textContent = 'Use at least 8 characters with uppercase, lowercase, a number, and a special character.';
                helpText.className = 'form-text';
            }
            return;
        }

        const validation = validatePassword(password);
        resultDiv.innerHTML = renderPasswordChecklist(validation.rules);
        resultDiv.className = 'nid-feedback';

        if (validation.valid) {
            this.className = 'form-control is-valid';
            if (helpText) {
                helpText.textContent = validation.message;
                helpText.className = 'form-text nid-feedback valid';
            }
        } else {
            this.className = 'form-control is-invalid';
            if (helpText) {
                helpText.textContent = validation.message.replace('❌ Password must include: ', 'Missing: ');
                helpText.className = 'form-text nid-feedback invalid';
            }
        }
    });
}

// =============================================
// NID VALIDATION — FIRESTORE LOOKUP (3NF)
// =============================================

async function validateNID(nidNumber) {
    if (!/^\d{9}$/.test(nidNumber)) {
        return {
            valid: false,
            message: "❌ NID must be exactly 9 digits (e.g., 123456789)"
        };
    }

    try {
        const doc = await db.collection('nids').doc(nidNumber).get();

        if (!doc.exists) {
            return {
                valid: false,
                message: "❌ NID not found. Please check your number or contact your LLG office."
            };
        }

        const nidData = doc.data();

        if (nidData.status !== "active") {
            return {
                valid: false,
                message: "❌ This NID is not active. Please contact your LLG office."
            };
        }

        return {
            valid: true,
            message: `✅ NID Verified: ${nidData.name} (Ward ${nidData.ward})`,
            userData: nidData
        };

    } catch (error) {
        console.error("❌ Error validating NID:", error);
        return {
            valid: false,
            message: "❌ Error validating NID. Please try again."
        };
    }
}

async function checkNIDRegistered(nidNumber) {
    try {
        const snapshot = await db.collection('users')
            .where('nid', '==', nidNumber)
            .get();
        return !snapshot.empty;
    } catch (error) {
        console.error("❌ Error checking NID:", error);
        return false;
    }
}

async function resolveWardIdFromNid(nidData) {
    try {
        const wardNumber = String(nidData.ward);
        const snapshot = await db.collection('wards')
            .where('wardNumber', '==', wardNumber)
            .limit(1)
            .get();

        if (!snapshot.empty) {
            return snapshot.docs[0].id;
        }

        const pilotWard = await db.collection('wards').doc('ward_5').get();
        if (pilotWard.exists) {
            console.log("🟢 Using pilot ward_5 fallback for ward number:", wardNumber);
            return 'ward_5';
        }

        return null;
    } catch (error) {
        console.error("❌ Error resolving wardId:", error);
        return null;
    }
}

function initNidValidation() {
    const bindNidInput = (inputId, resultId) => {
        document.getElementById(inputId)?.addEventListener('input', async function () {
            const nid = this.value.trim();
            const resultDiv = document.getElementById(resultId);
            if (!resultDiv) return;

            if (nid.length === 0) {
                resultDiv.textContent = '';
                resultDiv.className = 'nid-feedback';
                this.className = 'form-control';
                return;
            }

            if (!/^\d*$/.test(nid)) {
                resultDiv.textContent = '⚠️ Only numbers allowed';
                resultDiv.className = 'nid-feedback invalid';
                this.className = 'form-control is-invalid';
                return;
            }

            if (nid.length !== 9) {
                resultDiv.textContent = `ℹ️ Enter 9 digits (${nid.length}/9)`;
                resultDiv.className = 'nid-feedback info';
                this.className = 'form-control';
                return;
            }

            const validation = await validateNID(nid);
            if (validation.valid) {
                resultDiv.textContent = validation.message;
                resultDiv.className = 'nid-feedback valid';
                this.className = 'form-control is-valid';
            } else {
                resultDiv.textContent = validation.message;
                resultDiv.className = 'nid-feedback invalid';
                this.className = 'form-control is-invalid';
            }
        });
    };

    bindNidInput('regNID', 'nidValidationResult');
}
