/**
 * Seed PRODUCTION Firebase (community-connecthub).
 * Run once after enabling Auth + Firestore in Firebase Console:
 *
 *   node seed-production.js
 *
 * Prerequisites:
 *   1. Firebase Console → Authentication → Sign-in method → Email/Password → Enable
 *   2. Firebase Console → Firestore → Create database (production mode is fine for pilot)
 *   3. Deploy rules: firebase deploy --only firestore:rules
 */
const PROJECT_ID = 'community-connecthub';
const FIRESTORE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const AUTH = 'https://identitytoolkit.googleapis.com/v1';
const API_KEY = 'AIzaSyDl3sy-4FAYh1e7tKg3MO3wKlxR9LhzM-k';

function fieldString(v) { return { stringValue: String(v) }; }
function fieldBool(v) { return { booleanValue: Boolean(v) }; }
function fieldInteger(v) { return { integerValue: String(Math.round(Number(v))) }; }

async function setDoc(collection, docId, data) {
    const fields = {};
    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'boolean') fields[key] = fieldBool(value);
        else if (typeof value === 'number') fields[key] = fieldInteger(value);
        else fields[key] = fieldString(value);
    }
    const patchUrl = `${FIRESTORE}/${collection}/${docId}?currentDocument.exists=true`;
    const createUrl = `${FIRESTORE}/${collection}?documentId=${docId}`;
    let res = await fetch(patchUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
    });
    if (res.status === 404) {
        res = await fetch(createUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields })
        });
    }
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Firestore ${collection}/${docId}: ${res.status} ${text}`);
    }
    console.log(`✅ Firestore: ${collection}/${docId}`);
}

async function createAuthUser(email, password) {
    const res = await fetch(`${AUTH}/accounts:signUp?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true })
    });
    const body = await res.json();
    if (!res.ok) {
        if (body?.error?.message?.includes('EMAIL_EXISTS')) {
            console.log(`🟢 Auth user already exists: ${email}`);
            return;
        }
        throw new Error(`Auth ${email}: ${body?.error?.message || res.status}`);
    }
    console.log(`✅ Auth user created: ${email}`);
}

async function seed() {
    console.log('🌐 Seeding PRODUCTION Firebase:', PROJECT_ID, '\n');

    await setDoc('wards', 'ward_5', {
        wardNumber: '5',
        wardName: 'Nabasa',
        llg: 'Madang Urban',
        district: 'Madang',
        province: 'Madang',
        wdcExists: false,
        isActive: true
    });

    await setDoc('nids', '123456789', { name: 'Lisa Numbunda', ward: '5', status: 'active' });
    await setDoc('nids', '987654321', { name: 'Test Councillor', ward: '5', status: 'active' });
    await setDoc('nids', '111222333', { name: 'Test Mayor', ward: '5', status: 'active' });
    await setDoc('nids', '444555666', { name: 'Test Provincial Admin', ward: '5', status: 'active' });

    await setDoc('users', '210529', {
        userId: '210529',
        firstName: 'Lisa',
        lastName: 'Numbunda',
        email: 'lisa@test.com',
        nid: '123456789',
        role: 'resident',
        wardId: 'ward_5',
        isApproved: true,
        isActive: true
    });

    await setDoc('users', '300001', {
        userId: '300001',
        firstName: 'Test',
        lastName: 'Councillor',
        email: 'councillor@test.com',
        nid: '987654321',
        role: 'councillor',
        wardId: 'ward_5',
        isApproved: true,
        isActive: true
    });

    await setDoc('users', '400001', {
        userId: '400001',
        firstName: 'Test',
        lastName: 'Mayor',
        email: 'mayor@test.com',
        nid: '111222333',
        role: 'dda_officer',
        wardId: 'ward_5',
        isApproved: true,
        isActive: true
    });

    await setDoc('users', '500001', {
        userId: '500001',
        firstName: 'Test',
        lastName: 'Provincial',
        email: 'provincial@test.com',
        nid: '444555666',
        role: 'provincial_admin',
        wardId: 'ward_5',
        isApproved: true,
        isActive: true
    });

    await createAuthUser('lisa@test.com', 'TestPass1!');
    await createAuthUser('councillor@test.com', 'TestPass1!');
    await createAuthUser('mayor@test.com', 'TestPass1!');
    await createAuthUser('provincial@test.com', 'TestPass1!');

    await setDoc('projects', 'proj_nabasa_hall', {
        projectName: 'Nabasa Community Hall Upgrade',
        category: 'Infrastructure',
        location: 'Nabasa Ward Centre',
        budget: 85000,
        fundingSource: 'Ward Budget',
        status: 'implemented',
        wardId: 'ward_5',
        description: 'Renovation of community hall including roofing, seating, and solar lighting.'
    });

    await setDoc('projects', 'proj_water_supply', {
        projectName: 'Ward 5 Water Supply Extension',
        category: 'Water & Sanitation',
        location: 'Nabasa Settlement',
        budget: 120000,
        fundingSource: 'DSIP',
        status: 'funded',
        wardId: 'ward_5',
        description: 'Extension of water supply lines to 45 additional households.'
    });

    console.log('\n✅ Production seed complete!');
    console.log('\n📋 Login at your app URL (production Firebase):');
    console.log('   Resident — User ID: 210529 | NID: 123456789 | Password: TestPass1!');
    console.log('\n⚠️  Use test emails only for pilot. Change passwords before go-live.');
}

seed().catch((err) => {
    console.error('❌ Production seed failed:', err.message);
    console.error('\nChecklist:');
    console.error('  • Authentication → Email/Password enabled');
    console.error('  • Firestore database created');
    console.error('  • firestore.rules deployed (firebase deploy --only firestore:rules)');
    process.exit(1);
});
