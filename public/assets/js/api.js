// Klien API tipis. Semua mutasi mengembalikan state lembar terbaru.
const base = document.querySelector('meta[name="base-url"]').content.replace(/\/$/, '');
let actor = localStorage.getItem('cs_actor') || '';
let currentUser = null;
try {
  currentUser = JSON.parse(localStorage.getItem('cs_user') || 'null');
} catch {
  currentUser = null;
}

export const getActor = () => actor;
export const setActor = (n) => { actor = n.trim(); localStorage.setItem('cs_actor', actor); };

export const getCurrentUser = () => currentUser;
export const setCurrentUser = (u) => {
  currentUser = u;
  if (u) {
    localStorage.setItem('cs_user', JSON.stringify(u));
    setActor(u.full_name || u.username);
  } else {
    localStorage.removeItem('cs_user');
  }
};

async function call(method, path, body) {
  const res = await fetch(`${base}/api/v1/${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Actor-Name': encodeURIComponent(actor) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json = {};
  try { json = await res.json(); } catch { /* respons bukan JSON */ }
  if (!res.ok) {
    const err = new Error(json?.error?.message || `Server error (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return json.data;
}

export const api = {
  // Auth
  login: (username, password) => call('POST', 'auth/login', { username, password }),
  me: () => call('GET', 'auth/me'),
  logout: () => call('POST', 'auth/logout'),
  users: () => call('GET', 'auth/users'),

  // Instances & Equipment
  instances: (building, group) => {
    let q = [];
    if (building && building !== 'all') q.push(`building=${encodeURIComponent(building)}`);
    if (group && group !== 'all') q.push(`group=${encodeURIComponent(group)}`);
    const qs = q.length ? `?${q.join('&')}` : '';
    return call('GET', `instances${qs}`);
  },

  // Assignments
  assignments: (date, userId) => {
    let q = [];
    if (date) q.push(`date=${encodeURIComponent(date)}`);
    if (userId) q.push(`user_id=${encodeURIComponent(userId)}`);
    const qs = q.length ? `?${q.join('&')}` : '';
    return call('GET', `assignments${qs}`);
  },
  createAssignment: (data) => call('POST', 'assignments', data),
  updateAssignmentStatus: (id, status) => call('POST', `assignments/${id}/status`, { status }),

  // Actions (NG Management)
  actions: (type, status) => {
    let q = [];
    if (type) q.push(`type=${encodeURIComponent(type)}`);
    if (status) q.push(`status=${encodeURIComponent(status)}`);
    const qs = q.length ? `?${q.join('&')}` : '';
    return call('GET', `actions${qs}`);
  },
  createAction: (data) => call('POST', 'actions', data),
  actionDecision: (id, data) => call('POST', `actions/${id}/decision`, data),
  updateActionStatus: (id, status) => call('POST', `actions/${id}/status`, { status }),

  // Reports
  reports: (instance, date) => {
    let q = [];
    if (instance) q.push(`instance=${encodeURIComponent(instance)}`);
    if (date) q.push(`date=${encodeURIComponent(date)}`);
    const qs = q.length ? `?${q.join('&')}` : '';
    return call('GET', `reports${qs}`);
  },
  createReport: (data) => call('POST', 'reports', data),
  approveReport: (id) => call('POST', `reports/${id}/approve`),

  // Existing Checksheet
  templates: () => call('GET', 'templates'),
  open: (template, year, month) => call('POST', 'sheets/open', { template, year, month }),
  poll: (id, since) => call('GET', `sheets/${id}?since=${since}`),
  header: (id, data) => call('POST', `sheets/${id}/header`, data),
  remark: (id, item_id, remark) => call('POST', `sheets/${id}/remarks`, { item_id, remark }),
  pic: (id, day, name) => call('POST', `sheets/${id}/days/${day}/pic`, { name }),
  entry: (id, data) => call('POST', `sheets/${id}/entries`, data),
  fillDay: (id, day, symbol) => call('POST', `sheets/${id}/days/${day}/fill`, { symbol }),
  approve: (id, data) => call('POST', `sheets/${id}/approvals`, data),
  revoke: (id, data) => call('POST', `sheets/${id}/approvals/revoke`, data),
  finding: (id, data) => call('POST', `sheets/${id}/findings`, data),
  findingDelete: (sheetId, lineNo) => call('POST', `sheets/${sheetId}/findings/${lineNo}/delete`),
};
