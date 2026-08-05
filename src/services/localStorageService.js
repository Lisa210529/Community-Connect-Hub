const STORAGE_KEY = 'cch_app_data';
const SESSION_KEY = 'cch_session';
const STORAGE_VERSION = '5';

export function initializeStorage(initialData) {
  const version = localStorage.getItem('cch_version');
  if (!localStorage.getItem(STORAGE_KEY) || version !== STORAGE_VERSION) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    localStorage.setItem('cch_version', STORAGE_VERSION);
  }
}

export function getStore() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setStore(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getCollection(name) {
  const store = getStore();
  return store?.[name] ?? [];
}

export function setCollection(name, items) {
  const store = getStore() ?? {};
  store[name] = items;
  setStore(store);
}

export function addItem(collection, item) {
  const items = getCollection(collection);
  items.push(item);
  setCollection(collection, items);
  return item;
}

export function updateItem(collection, id, updates) {
  const items = getCollection(collection).map((item) =>
    item.id === id ? { ...item, ...updates } : item,
  );
  setCollection(collection, items);
}

export function deleteItem(collection, id) {
  setCollection(
    collection,
    getCollection(collection).filter((item) => item.id !== id),
  );
}

export function findById(collection, id) {
  return getCollection(collection).find((item) => item.id === id) ?? null;
}

export function resetStorage(initialData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
}

// Session
export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setSession(session) {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function addAuditLog(action, user, role, details) {
  addItem('auditLogs', {
    id: `log_${Date.now()}`,
    action,
    user,
    role,
    details,
    timestamp: new Date().toISOString(),
  });
}
