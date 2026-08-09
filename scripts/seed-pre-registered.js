/**
 * Seed preRegisteredUsers collection in production Firestore.
 * Run after deploying firestore rules:
 *
 *   npm run seed:pre-registered
 */
const PROJECT_ID = 'community-connecthub';
const FIRESTORE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function fieldString(v) {
  return { stringValue: String(v) };
}
function fieldBool(v) {
  return { booleanValue: Boolean(v) };
}

async function setDoc(collection, docId, data) {
  const fields = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'boolean') fields[key] = fieldBool(value);
    else fields[key] = fieldString(value);
  }
  const patchUrl = `${FIRESTORE}/${collection}/${docId}?currentDocument.exists=true`;
  const createUrl = `${FIRESTORE}/${collection}?documentId=${docId}`;
  let res = await fetch(patchUrl, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  if (res.status === 404) {
    res = await fetch(createUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firestore ${collection}/${docId}: ${res.status} ${text}`);
  }
  console.log(`✅ preRegisteredUsers/${docId}`);
}

const OFFICIALS = [
  {
    id: 'pre-joshua-dangi',
    fullName: 'Joshua Dangi',
    email: 'joshuadangi@gmail.com',
    nid: '2583691473',
    role: 'councillor',
    position: 'Ward 5 Councillor',
    wardId: 'ward_5',
    wardNumber: '5',
    ward: 'Ward 5',
    province: 'Madang',
    district: 'Madang',
    llg: 'Madang Urban',
  },
  {
    id: 'pre-peter-kama',
    fullName: 'Peter Kama',
    email: 'peter.kama@example.com',
    nid: '2583691474',
    role: 'mayor',
    position: 'Mayor of Madang',
    wardId: 'llg_1',
    wardNumber: 'LLG',
    ward: 'Madang Urban LLG',
    province: 'Madang',
    district: 'Madang',
    llg: 'Madang Urban',
  },
  {
    id: 'pre-mary-wani',
    fullName: 'Mary Wani',
    email: 'mary.wani@example.com',
    nid: '2583691475',
    role: 'dda',
    position: 'DDA Officer',
    wardId: 'madang',
    wardNumber: '',
    ward: 'Madang District',
    province: 'Madang',
    district: 'Madang',
    llg: 'Madang Urban',
  },
  {
    id: 'pre-councillor-001',
    fullName: 'John Kila',
    email: 'john.kila@example.com',
    nid: '1234567891',
    role: 'councillor',
    position: 'Ward 5 Councillor',
    wardId: 'ward_5',
    wardNumber: '5',
    ward: 'Ward 5',
    province: 'Madang',
    district: 'Madang',
    llg: 'Madang Urban',
  },
];

async function seed() {
  console.log('🌐 Seeding preRegisteredUsers for', PROJECT_ID, '\n');
  for (const official of OFFICIALS) {
    const { id, ...data } = official;
    await setDoc('preRegisteredUsers', id, {
      preRegId: id,
      ...data,
      isRegistered: false,
      createdBy: 'system-seed',
      createdAt: new Date().toISOString(),
    });
  }
  console.log('\n✅ Pre-registered officials seeded!');
  console.log('\nOfficial registration URLs:');
  console.log('  /official-register');
  console.log('  /signup/official');
  console.log('\nExample: joshuadangi@gmail.com / NID 2583691473');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
