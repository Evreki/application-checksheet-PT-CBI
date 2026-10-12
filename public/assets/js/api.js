// Klien API tipis. Semua mutasi mengembalikan state lembar terbaru.
const base = document.querySelector('meta[name="base-url"]').content.replace(/\/$/, '');
let actor = localStorage.getItem('cs_actor') || '';

export const getActor = () => actor;
export const setActor = (n) => { actor = n.trim(); localStorage.setItem('cs_actor', actor); };

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
};
