/**
 * Seed Firebase Emulator with pilot test data (local only).
 * Run while emulators are active: node seed-emulator.js
 */
const PROJECT_ID = 'community-connecthub';
const FIRESTORE = `http://127.0.0.1:8081/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const AUTH = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1';
const API_KEY = 'fake-api-key';

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
    const url = `${FIRESTORE}/${collection}/${docId}?currentDocument.exists=true`;
    const createUrl = `${FIRESTORE}/${collection}?documentId=${docId}`;
    let res = await fetch(url, {
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
    console.log('🟢 Seeding Firebase Emulator (local test data only)...\n');

    await setDoc('wards', 'ward_5', {
        wardNumber: '5',
        wardName: 'Nabasa',
        llg: 'Madang Urban',
        district: 'Madang',
        province: 'Madang',
        wdcExists: false,
        isActive: true
    });

    await setDoc('nids', '123456789', {
        name: 'Lisa Numbunda',
        ward: '5',
        status: 'active'
    });

    await setDoc('nids', '987654321', {
        name: 'Test Councillor',
        ward: '5',
        status: 'active'
    });

    await setDoc('nids', '111222333', {
        name: 'Test Mayor',
        ward: '5',
        status: 'active'
    });

    await setDoc('nids', '444555666', {
        name: 'Test Provincial Admin',
        ward: '5',
        status: 'active'
    });

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

    // Sample ward projects for Week 6 — Resident Dashboard & Project Viewing
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

    await setDoc('projects', 'proj_road_maintenance', {
        projectName: 'Nabasa Road Maintenance',
        category: 'Transport',
        location: 'Main Nabasa Road',
        budget: 65000,
        fundingSource: 'PSIP',
        status: 'wdc_reviewing',
        wardId: 'ward_5',
        description: 'Grading and drainage works on the main access road.'
    });

    await setDoc('projects', 'proj_street_lighting', {
        projectName: 'Street Lighting Phase 2',
        category: 'Infrastructure',
        location: 'Nabasa Market Area',
        budget: 45000,
        fundingSource: 'Ward Budget',
        status: 'councillor_reviewing',
        wardId: 'ward_5',
        description: 'Installation of LED street lights along market perimeter.'
    });

    console.log('\n✅ Emulator seed complete!');
    console.log('\n📋 Week 6 — Resident modules demo:');
    console.log('   Login as 210529 → Dashboard shows 4 Ward 5 projects');
    console.log('   Rate: Nabasa Community Hall (implemented) or Water Supply (funded)');
    console.log('   Submit a complaint from Complaints sidebar');
    console.log('\n📋 Test accounts (password for all: TestPass1!)');
    console.log('   Resident          — User ID: 210529  |  lisa@test.com');
    console.log('   Councillor        — User ID: 300001  |  councillor@test.com');
    console.log('   Mayor (DDA)       — User ID: 400001  |  mayor@test.com');
    console.log('   Provincial Admin  — User ID: 500001  |  provincial@test.com');
    console.log('   NID for register: 123456789');
    console.log('\n🔄 Full swimlane test (Service Request & Funding Process):');
    console.log('   1. 210529 (Resident)   → Submit request → Pending WDC');
    console.log('   2. 300001 (Councillor) → WDC review → Forward to Councillor → Assembly');
    console.log('   3. 400001 (Mayor)      → Agree & Sign → Refer to Provincial (or Fund from Ward Budget)');
    console.log('   4. 500001 (Provincial) → Present → Approve DSIP/PSIP (requires WDC established first)');
    console.log('   Tip: Councillor must Establish WDC (WDC Management) before provincial funding is approved.');
    console.log('\n🌐 Login at http://localhost:3000');
    console.log('🔧 Emulator UI: http://127.0.0.1:4000');
}

seed().catch((err) => {
    console.error('❌ Seed failed:', err.message);
    console.error('\nMake sure firebase emulators:start is running in Command Prompt.');
    process.exit(1);
});
