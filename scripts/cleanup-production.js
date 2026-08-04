/**
 * Remove dummy / test data from PRODUCTION Firebase (community-connecthub).
 * Does NOT change app UI or logic — data cleanup only.
 *
 * Run: node cleanup-production.js
 *
 * Auth users (Firebase Console → Authentication → Users) must be deleted
 * separately if this script cannot remove them (no Admin SDK).
 */
const PROJECT_ID = 'community-connecthub';
const FIRESTORE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

/** Collections to wipe entirely (pilot/test data). wards/ is kept. */
const COLLECTIONS_TO_CLEAR = [
    'users',
    'nids',
    'projects',
    'requests',
    'ratings',
    'complaints',
    'announcements',
    'wdc_members'
];

/** Known seed Auth emails — delete these in Firebase Console → Authentication if still present */
const DUMMY_AUTH_EMAILS = [
    'lisa@test.com',
    'councillor@test.com',
    'mayor@test.com',
    'provincial@test.com',
    'lisanumbunda@gmail.com',
    'jsavin@gmail.com',
    'lnumbunda@gmail.com'
];

async function listCollectionDocs(collectionId) {
    const docs = [];
    let pageToken = '';
    do {
        const url = pageToken
            ? `${FIRESTORE}/${collectionId}?pageToken=${encodeURIComponent(pageToken)}`
            : `${FIRESTORE}/${collectionId}`;
        const res = await fetch(url);
        if (res.status === 404) return docs;
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`List ${collectionId}: ${res.status} ${text}`);
        }
        const body = await res.json();
        if (body.documents) docs.push(...body.documents);
        pageToken = body.nextPageToken || '';
    } while (pageToken);
    return docs;
}

async function deleteDoc(docPath) {
    const res = await fetch(`${FIRESTORE}/${docPath}`, { method: 'DELETE' });
    if (res.status === 404) {
        console.log(`⏭️  Already gone: ${docPath}`);
        return false;
    }
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Delete ${docPath}: ${res.status} ${text}`);
    }
    console.log(`🗑️  Deleted: ${docPath}`);
    return true;
}

function docPathFromName(name) {
    const prefix = `projects/${PROJECT_ID}/databases/(default)/documents/`;
    return name.startsWith(prefix) ? name.slice(prefix.length) : name;
}

async function clearCollection(collectionId) {
    console.log(`\n📂 Clearing collection: ${collectionId}`);
    const docs = await listCollectionDocs(collectionId);
    if (!docs.length) {
        console.log(`   (empty)`);
        return 0;
    }
    let count = 0;
    for (const doc of docs) {
        const path = docPathFromName(doc.name);
        if (await deleteDoc(path)) count++;
    }
    return count;
}

async function cleanup() {
    console.log('🧹 Cleaning dummy data from PRODUCTION Firestore:', PROJECT_ID);
    console.log('   Keeping: wards/ (ward master data)\n');

    let total = 0;
    for (const col of COLLECTIONS_TO_CLEAR) {
        total += await clearCollection(col);
    }

    console.log(`\n✅ Firestore cleanup done — ${total} document(s) removed.`);
    console.log('\n📋 Delete these Auth users manually in Firebase Console → Authentication → Users:');
    DUMMY_AUTH_EMAILS.forEach(email => console.log(`   • ${email}`));
    console.log('\n   For each user: open row → ⋮ menu → Delete account');
}

cleanup().catch((err) => {
    console.error('\n❌ Cleanup failed:', err.message);
    console.error('\nIf you see 403 PERMISSION_DENIED, deploy open rules first:');
    console.error('  firebase deploy --only firestore:rules');
    console.error('\nThen run: node cleanup-production.js');
    console.error('\nAuth users must still be deleted in Firebase Console (see list above).');
    process.exit(1);
});
