import { api, getActor, setActor, getCurrentUser, setCurrentUser } from './api.js';
import { renderSheet, MONTHS, ROLE_LABEL, SYMBOLS, esc, fmtDT, fmtNum, glyph, findAp, outOfLimit } from './render.js';
import { exportExcel } from './excel.js';

const $ = (s, r = document) => r.querySelector(s);
const sheetEl = $('#sheet');
const ui = {
  tpl: localStorage.getItem('cs_tpl') || null,
  templates: [],
  view: 'portal',
  year: 0,
  month: 0,
  zoom: 1,
  extraRows: 0,
  busy: false,
  focus: null,
  dirty: false,
  startedAt: Date.now(),
  buildingFilter: 'all',
  focusFilter: 'all',
  filter: 'all',
  search: '',
  statusFilter: 'all',
  actionTab: 'TODAY',
  currentActionCount: 0,
};
let S = null;
let pop = null; // { item, day }

function updateActorUI(name) {
  const u = getCurrentUser();
  const n = name || u?.full_name || getActor() || '';
  document.querySelectorAll('.actor-name').forEach((el) => { 
    el.textContent = n ? `${n} (Dept. Maintenance)` : 'Belum diisi'; 
  });
  if ($('#active-user-name')) {
    $('#active-user-name').textContent = u ? u.full_name : (n || 'Pengguna');
  }
  if ($('#active-user-role')) {
    const role = (u?.role || 'user').toLowerCase();
    $('#active-user-role').textContent = role === 'leader' ? 'Leader' : 'Teknisi';
    $('#active-user-role').className = `user-role-badge ${role === 'leader' ? 'role-leader' : 'role-user'}`;
  }
  // Tombol penugasan hanya aktif untuk Leader
  const assignBtn = $('#btn-open-assignment');
  if (assignBtn) {
    assignBtn.style.display = (u?.role === 'leader') ? 'inline-flex' : 'none';
  }
}

// ------------------------------------------------------------------ util
function toast(msg, type = '') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  $('#toasts').append(t);
  setTimeout(() => t.remove(), type === 'err' ? 5000 : 2200);
}

function setSync(state, text) {
  const el = $('#sync');
  if (!el) return;
  el.className = `sync ${state}`;
  $('span', el).textContent = text;
}

const itemById = (id) => S.template.items.find((i) => i.id === Number(id));
const dayLocked = (d) => S.sheet.finalized || S.sheet.locked_days.includes(d);
const overlayOpen = () => !$('#pop').hidden || $('#dlg').open;
const typing = () => document.activeElement?.matches?.('input,textarea,select') && sheetEl.contains(document.activeElement);

/** Terapkan state baru dari server. Render ditunda bila pengguna sedang mengetik / membuka popup. */
function apply(state, { force = false } = {}) {
  S = state;
  if (!force && (typing() || overlayOpen())) { ui.dirty = true; return; }
  render();
}

function render() {
  ui.dirty = false;
  sheetEl.innerHTML = renderSheet(S, ui.extraRows);
  if (ui.focus) {
    const { item, day } = ui.focus;
    $(`td.day[data-item="${item}"][data-day="${day}"]`)?.focus({ preventScroll: true });
  }
}

/** Jalankan mutasi: tampilkan status, terapkan state hasilnya, tangani galat. */
async function mutate(fn, okMsg) {
  ui.busy = true;
  setSync('busy', 'Menyimpan…');
  try {
    apply(await fn(), { force: !overlayOpen() && !typing() });
    setSync('', 'Live');
    okMsg && toast(okMsg, 'ok');
    return true;
  } catch (e) {
    toast(e.message, 'err');
    setSync('err', 'Gagal');
    try { apply(await api.poll(S.sheet.id, -1), { force: true }); setSync('', 'Live'); } catch { /* biarkan polling berikutnya */ }
    return false;
  } finally {
    ui.busy = false;
  }
}

// ------------------------------------------------------------------ sheet loading
async function openSheet() {
  setSync('busy', 'Memuat…');
  const state = await api.open(ui.tpl, ui.year, ui.month);
  ui.extraRows = 0;
  apply(state, { force: true });
  setSync('', 'Live');
  if (!ui.zoom || ui.zoom < 0.8) {
    setZoom(1.0);
  } else {
    setZoom(ui.zoom);
  }
  const stage = $('#stage');
  if (stage) {
    stage.scrollTop = 0;
    stage.scrollLeft = 0;
  }
}

function fit() {
  const wrap = $('#sheet-wrap');
  if (!wrap) return;
  wrap.style.zoom = 1;
  const stage = $('#stage');
  const stageW = stage ? stage.clientWidth - 48 : window.innerWidth - 48;
  const z = Math.min(1, stageW / wrap.offsetWidth);
  const fitZ = Math.max(0.35, Math.floor(z * 100) / 100);

  if (Math.abs(ui.zoom - fitZ) < 0.04) {
    setZoom(1.0);
    toast('Tampilan: Skala Normal (100%)');
  } else {
    setZoom(fitZ);
    toast(`Tampilan: Muat Layar (${Math.round(fitZ * 100)}%)`);
  }
}

function setZoom(z) {
  ui.zoom = Math.min(1.5, Math.max(0.3, z));
  $('#sheet-wrap').style.zoom = ui.zoom;
  const zv = $('#zoom-val');
  if (zv) zv.textContent = `${Math.round(ui.zoom * 100)}%`;
}

// ------------------------------------------------------------------ polling
function schedulePoll() {
  setTimeout(async () => {
    if (S && !ui.busy && !document.hidden && !overlayOpen() && !typing()) {
      try {
        const r = await api.poll(S.sheet.id, S.version);
        if (r.changed !== false) { apply(r); }
        else if (ui.dirty) { render(); }
        setSync('', 'Live');
      } catch { setSync('err', 'Offline'); }
    }
    schedulePoll();
  }, window.CS.pollMs || 4000);
}

// ------------------------------------------------------------------ popover isi sel
function closePop() {
  $('#pop').hidden = true;
  pop = null;
  if (ui.dirty && !typing()) render();
}

function openPop(td) {
  const item = itemById(td.dataset.item);
  const day = Number(td.dataset.day);
  if (!item || item.calc) return;
  ui.focus = { item: item.id, day };
  if (dayLocked(day)) { toast(S.sheet.finalized ? 'Lembar sudah final (dikunci).' : `Hari ke-${day} sudah di-approve dan dikunci.`, 'err'); return; }

  const e = S.entries[item.id]?.[day] || {};
  pop = { item, day, symbol: e.symbol || null };
  const el = $('#pop');
  const lim = [item.min !== null ? `min ${fmtNum(item.min)}` : '', item.max !== null ? `max ${fmtNum(item.max)}` : ''].filter(Boolean).join(' • ');
  el.innerHTML = `
    <h4>${esc(item.part)} — tgl ${day}<small>Standar: ${esc(item.standard || '-')}${lim ? ` (${lim})` : ''}</small></h4>
    <div class="syms">${SYMBOLS.map((s) => `<button data-sym="${s.code}" class="${s.code}${e.symbol === s.code ? ' on' : ''}" title="${s.label} [${s.key.toUpperCase()}]">${glyph(s.code)}<small>${s.key.toUpperCase()}</small></button>`).join('')}</div>
    ${item.accepts_value ? `<label>Nilai ukur${item.unit ? ` (${esc(item.unit)})` : ''}</label><input type="text" inputmode="decimal" id="p-val" value="${esc(fmtNum(e.value ?? null))}" autocomplete="off"><div class="warn" id="p-warn"></div>` : ''}
    <label>Catatan sel (opsional)</label><input type="text" id="p-note" list="p-hints" maxlength="500" value="${esc(e.note || '')}" autocomplete="off">
    <datalist id="p-hints">${(S.template.hints || []).map((h) => `<option value="${esc(h)}">`).join('')}</datalist>
    <div class="row"><button class="btn pri" id="p-save">Simpan</button><button class="btn" id="p-clear">Kosongkan</button><button class="btn ghost" id="p-close">Tutup</button></div>`;
  el.hidden = false;

  const r = td.getBoundingClientRect();
  const w = 290, h = el.offsetHeight;
  el.style.left = `${Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2))}px`;
  el.style.top = `${r.bottom + h + 12 > innerHeight ? Math.max(8, r.top - h - 8) : r.bottom + 6}px`;
  (item.accepts_value ? $('#p-val') : $('.syms button.on') || $('.syms button'))?.focus();
  if (item.accepts_value) { $('#p-val').addEventListener('input', checkLimit); checkLimit(); }
}

const parseNum = (s) => { const t = String(s ?? '').trim().replace(',', '.'); return t === '' ? null : (Number.isFinite(Number(t)) ? Number(t) : NaN); };

function checkLimit() {
  const v = parseNum($('#p-val')?.value);
  const w = $('#p-warn');
  if (!w) return;
  w.textContent = Number.isNaN(v) ? 'Nilai harus berupa angka.' : outOfLimit(pop.item, v) ? '⚠ Di luar batas standar — disarankan simbol X.' : '';
}

async function commitPop(symbol) {
  const { item, day } = pop;
  const value = item.accepts_value ? parseNum($('#p-val').value) : null;
  if (Number.isNaN(value)) { toast('Nilai ukur harus berupa angka.', 'err'); return; }
  const note = $('#p-note').value;
  if (symbol === undefined) symbol = pop.symbol;
  if (symbol === null && value !== null) symbol = outOfLimit(item, value) ? 'X' : 'V';
  $('#pop').hidden = true; pop = null;

  // Auto-registrasi ke Action Sidebar bila ada temuan Not Good (NG = X)
  if (symbol === 'X') {
    api.createAction({
      sheet_id: S?.sheet?.id,
      instance_code: S?.sheet?.equipment_no || S?.template?.code,
      item_name: item.part,
      ng_description: note ? `${note} (Nilai: ${value ?? '-'})` : `Kondisi NG pada item ${item.part} tanggal ${day}. Standar: ${item.standard || '-'}`,
      action_type: 'TODAY',
    }).then(() => {
      toast('Temuan NG otomatis dicatat ke daftar Action (Tindakan) ⚡', 'ok');
      loadActionCounts();
    }).catch(() => {});
  }

  await mutate(() => api.entry(S.sheet.id, { item_id: item.id, day, symbol, value, note }));
}

async function quickSet(item, day, symbol) {
  const e = S.entries[item.id]?.[day] || {};
  if (dayLocked(day)) { toast('Hari ini sudah dikunci.', 'err'); return; }

  if (symbol === 'X') {
    api.createAction({
      sheet_id: S?.sheet?.id,
      instance_code: S?.sheet?.equipment_no || S?.template?.code,
      item_name: item.part,
      ng_description: `Kondisi abnormal (NG) pada item ${item.part} tanggal ${day}. Standar: ${item.standard || '-'}`,
      action_type: 'TODAY',
    }).then(() => {
      toast('Temuan NG dicatat ke daftar Action (Tindakan) ⚡', 'ok');
      loadActionCounts();
    }).catch(() => {});
  }

  const ok = await mutate(() => api.entry(S.sheet.id, { item_id: item.id, day, symbol, value: e.value ?? null, note: e.note ?? '' }));
  if (ok) moveFocus(item.id, day, 1, 0);
}

function moveFocus(itemId, day, dRow, dCol) {
  const items = S.template.items.filter((i) => !i.calc);
  let ri = items.findIndex((i) => i.id === Number(itemId));
  if (ri < 0) ri = 0;
  ri = Math.min(items.length - 1, Math.max(0, ri + dRow));
  const nd = Math.min(S.sheet.days_in_month, Math.max(1, day + dCol));
  ui.focus = { item: items[ri].id, day: nd };
  $(`td.day[data-item="${items[ri].id}"][data-day="${nd}"]`)?.focus({ preventScroll: false });
}

// ------------------------------------------------------------------ dialog approval & audit
function openApprovalDlg({ scope, refNo, role, title }) {
  const d = $('#dlg');
  const cur = findAp(S.approvals, scope, refNo, role);
  const me = getActor();
  d.innerHTML = `
    <h3>${esc(title)}</h3>
    <p>Persetujuan ini akan mengunci isian yang bersangkutan terhadap perubahan biasa.</p>
    ${cur ? `<div class="info">Status saat ini: <b>${esc(cur.status)}</b> oleh ${esc(cur.actor_name)} (${fmtDT(cur.acted_at)})</div>` : ''}
    <label>Nama pemeriksa/penyetuju</label><input type="text" id="a-name" value="${esc(cur?.actor_name || me || '')}">
    <label>Catatan persetujuan</label><input type="text" id="a-note" value="${esc(cur?.note || '')}" placeholder="Opsional">
    <div class="row">
      <button class="btn pri" id="a-ok">Setujui (Approve)</button>
      ${cur ? '<button class="btn warn" id="a-revoke">Cabut Approval</button>' : ''}
      <button class="btn ghost" id="a-cancel">Batal</button>
    </div>`;
  d.showModal();
  $('#a-name').focus();
  $('#a-ok').onclick = async () => {
    const actor_name = $('#a-name').value.trim();
    if (!actor_name) return toast('Nama pemeriksa harus diisi.', 'err');
    setActor(actor_name);
    updateActorUI(actor_name);
    d.close();
    await mutate(() => api.approve(S.sheet.id, { scope, ref_no: refNo, role, status: 'OK', note: $('#a-note').value, actor_name }), 'Approval berhasil disimpan ✔');
  };
  if ($('#a-revoke')) {
    $('#a-revoke').onclick = async () => {
      d.close();
      await mutate(() => api.revoke(S.sheet.id, { scope, ref_no: refNo, role }), 'Approval dicabut.');
    };
  }
  $('#a-cancel').onclick = () => d.close();
}

function askName(force = false) {
  return new Promise((resolve) => {
    const d = $('#dlg');
    d.innerHTML = `
      <h3>Identitas Pemeriksa</h3>
      <p>Masukkan nama Anda. Nama ini otomatis tercatat pada setiap isian dan approval checksheet.</p>
      <input type="text" id="who-name" value="${esc(getActor())}" placeholder="mis. Ahmad Subarjo" autocomplete="name">
      <div class="row"><button class="btn pri" id="who-ok">Gunakan Nama Ini</button>${force ? '' : '<button class="btn ghost" id="who-skip">Batal</button>'}</div>`;
    d.showModal();
    const inp = $('#who-name');
    inp.focus(); inp.select();
    const save = () => {
      const n = inp.value.trim();
      if (!n && force) return;
      if (n) { setActor(n); updateActorUI(n); }
      d.close();
      resolve(n);
    };
    $('#who-ok').onclick = save;
    inp.onkeydown = (e) => { if (e.key === 'Enter') save(); };
    if ($('#who-skip')) $('#who-skip').onclick = () => { d.close(); resolve(getActor()); };
  });
}

// ------------------------------------------------------------------ event delegation di dalam lembar
sheetEl.addEventListener('click', (e) => {
  const tdDay = e.target.closest('td.day');
  if (tdDay && !tdDay.classList.contains('c-calc')) { openPop(tdDay); return; }
  const bDay = e.target.closest('button.btn-fill-day');
  if (bDay) {
    const d = Number(bDay.dataset.day);
    if (dayLocked(d)) return toast('Hari sudah dikunci.', 'err');
    const dlg = $('#dlg');
    dlg.innerHTML = `
      <h3>Isi Cepat Hari ke-${d}</h3>
      <p>Setel semua item yang belum diisi pada tanggal ini dengan simbol berikut:</p>
      <div class="row">${SYMBOLS.map((s) => `<button class="btn ${s.code}" data-sym="${s.code}">${glyph(s.code)} ${s.label}</button>`).join('')}</div>
      <div class="row" style="margin-top:14px"><button class="btn ghost" id="f-cancel">Batal</button></div>`;
    dlg.showModal();
    dlg.querySelectorAll('button[data-sym]').forEach((btn) => {
      btn.onclick = async () => {
        dlg.close();
        await mutate(() => api.fillDay(S.sheet.id, d, btn.dataset.sym), `Hari ke-${d} berhasil diisi ✔`);
      };
    });
    $('#f-cancel').onclick = () => dlg.close();
    return;
  }
  const ap = e.target.closest('td.ap-cell');
  if (ap) {
    openApprovalDlg({ scope: ap.dataset.scope, refNo: Number(ap.dataset.ref || 0), role: ap.dataset.role, title: ap.dataset.title || 'Approval' });
    return;
  }
});

sheetEl.addEventListener('keydown', (e) => {
  const td = e.target.closest('td.day');
  if (!td || overlayOpen() || typing()) return;
  const sym = SYMBOLS.find((s) => s.key === e.key.toLowerCase());
  if (sym) {
    e.preventDefault();
    quickSet(itemById(td.dataset.item), Number(td.dataset.day), sym.code);
    return;
  }
  if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault();
    quickSet(itemById(td.dataset.item), Number(td.dataset.day), null);
    return;
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    openPop(td);
    return;
  }
  const nav = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
  if (nav) {
    e.preventDefault();
    moveFocus(td.dataset.item, Number(td.dataset.day), nav[0], nav[1]);
  }
});

// Popover button wiring
$('#pop').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.sym !== undefined) { commitPop(b.dataset.sym); return; }
  if (b.id === 'p-save') { commitPop(); return; }
  if (b.id === 'p-clear') { commitPop(null); return; }
  if (b.id === 'p-close') { closePop(); return; }
});

$('#pop').addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closePop();
  if (e.key === 'Enter' && e.target.id === 'p-val') { commitPop(); }
});

document.addEventListener('mousedown', (e) => { if (!$('#pop').hidden && !e.target.closest('#pop') && !e.target.closest('td.day')) closePop(); });

// ------------------------------------------------------------------ views & navigation
function showLogin() {
  const login = $('#login-view');
  const pt = $('#portal-view');
  const ws = $('#workstation-view');
  if (pt) { pt.hidden = true; pt.style.setProperty('display', 'none', 'important'); }
  if (ws) { ws.hidden = true; ws.style.setProperty('display', 'none', 'important'); }
  if (login) { login.style.display = 'flex'; }
  ui.view = 'login';
}

function showPortal() {
  const login = $('#login-view');
  const ws = $('#workstation-view');
  const pt = $('#portal-view');
  if (login) login.style.display = 'none';
  if (ws) { ws.hidden = true; ws.style.setProperty('display', 'none', 'important'); }
  if (pt) {
    pt.hidden = false;
    pt.style.setProperty('display', 'block', 'important');
    pt.scrollTop = 0;
  }
  ui.view = 'portal';
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  updatePortalKPIs();
  loadActionCounts();
}

function updatePortalKPIs() {
  const kpiTot = $('#kpi-total-machines');
  const kpiAct = $('#kpi-active-forms');
  if (kpiTot) kpiTot.textContent = EQUIPMENT_CATALOG.length;
  if (kpiAct) kpiAct.textContent = '2 Mesin (Chiller & Air Dryer)';
}

async function showWorkstation(tplCode) {
  if (tplCode) {
    ui.tpl = tplCode;
    localStorage.setItem('cs_tpl', ui.tpl);
  }
  const login = $('#login-view');
  const pt = $('#portal-view');
  const ws = $('#workstation-view');
  if (login) login.style.display = 'none';
  if (pt) { pt.hidden = true; pt.style.setProperty('display', 'none', 'important'); }
  if (ws) {
    ws.hidden = false;
    ws.style.setProperty('display', 'flex', 'important');
  }
  ui.view = 'workstation';
  if ($('#switch-tpl')) $('#switch-tpl').value = ui.tpl;

  const isAnnualOrStd = ui.tpl === 'CHILLER_M' || ui.tpl === 'CHILLER_S' || ui.tpl === 'AD_M' || ui.tpl === 'AD_S';
  const mSelect = $('#month');
  const pSep = $('.period-sep');
  if (mSelect) mSelect.style.display = isAnnualOrStd ? 'none' : '';
  if (pSep) pSep.style.display = isAnnualOrStd ? 'none' : '';
  if ($('#period-prev')) $('#period-prev').title = isAnnualOrStd ? 'Tahun sebelumnya' : 'Bulan sebelumnya';
  if ($('#period-next')) $('#period-next').title = isAnnualOrStd ? 'Tahun berikutnya' : 'Bulan berikutnya';

  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  await openSheet();
}

// ------------------------------------------------------------------ Stage Panning
function initStagePanning() {
  const stage = $('#stage');
  if (!stage) return;
  let isDown = false;
  let startX = 0, startY = 0;
  let sLeft = 0, sTop = 0;
  let hasMoved = false;

  stage.addEventListener('mousedown', (e) => {
    if (e.target.closest('input, textarea, select, button, .pop, dialog')) return;
    isDown = true;
    hasMoved = false;
    startX = e.clientX;
    startY = e.clientY;
    sLeft = stage.scrollLeft;
    sTop = stage.scrollTop;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!hasMoved && Math.hypot(dx, dy) > 5) {
      hasMoved = true;
      stage.classList.add('grabbing');
    }
    if (hasMoved) {
      stage.scrollLeft = sLeft - dx;
      stage.scrollTop = sTop - dy;
    }
  });

  window.addEventListener('mouseup', () => {
    if (isDown) {
      isDown = false;
      stage.classList.remove('grabbing');
    }
  });
}

// ------------------------------------------------------------------ Live Clock & Time-Boxing
function startClock() {
  const update = () => {
    const portalEl = $('#portal-clock-txt');
    const now = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dName = days[now.getDay()];
    const dDate = now.getDate();
    const dMon = MONTHS[now.getMonth()].slice(0, 3);
    const dYr = now.getFullYear();
    const dHr = String(now.getHours()).padStart(2, '0');
    const dMin = String(now.getMinutes()).padStart(2, '0');
    const formatted = `${dName}, ${dDate} ${dMon} ${dYr} • ${dHr}:${dMin} WIB`;
    if (portalEl) portalEl.textContent = formatted;

    // Time-boxing evaluation:
    // 07:30 - 10:00: CHECK TIME
    // 10:00 - 14:00: ACTION TIME
    // 14:00 - 16:00: REPORT TIME
    const mins = now.getHours() * 60 + now.getMinutes();
    const pill = $('#timebox-pill');
    const label = $('#timebox-label');
    if (pill && label) {
      if (mins >= 450 && mins < 600) { // 07:30 - 10:00
        pill.className = 'timebox-badge timebox-check';
        label.textContent = '07:30 - 10:00: CHECK TIME (Inspeksi Aktif)';
      } else if (mins >= 600 && mins < 840) { // 10:00 - 14:00
        pill.className = 'timebox-badge timebox-action';
        label.textContent = '10:00 - 14:00: ACTION TIME (Penanganan NG)';
      } else if (mins >= 840 && mins < 960) { // 14:00 - 16:00
        pill.className = 'timebox-badge timebox-report';
        label.textContent = '14:00 - 16:00: REPORTING TIME (Pelaporan)';
      } else {
        pill.className = 'timebox-badge timebox-check';
        label.textContent = 'STANDBY / MONITORING';
      }
    }
  };
  update();
  setInterval(update, 15000);
}

// ------------------------------------------------------------------ Equipment Multi-Instance Catalog
const getAssetBase = () => (window.CS?.baseUrl || document.querySelector('meta[name="base-url"]')?.content || '').replace(/\/+$/, '');

const EQUIPMENT_CATALOG = [
  // 1. AIR DRYER FRIULAIR ACT80 (3 INSTANCES)
  {
    id: 'air-dryer-1',
    group: 'air-dryer',
    title: 'Air Dryer Friulair ACT80 (#1)',
    instanceCode: 'AD-001',
    building: 'Gedung A',
    location: 'Ruang Kompresor Utama Gedung A',
    assetId: 'ID: AD-001 • Gedung A',
    lastStatus: 'Standar Preventif STD',
    hasStd: true,
    img: `${getAssetBase()}/assets/img/machines/air_dryer.png`,
    deptBadges: [
      { text: 'Gedung A', bg: '#0369a1' },
      { text: 'Seksi Utility', bg: '#2b6cb0' },
      { text: '⭐ STD PREVENTIVE', bg: '#15803d' }
    ],
    sections: ['Utility', 'Maintenance', 'PLANT SERVICE'],
    badgeStatus: { text: '3 Form Tersedia', bg: '#dcfce7', color: '#15803d' },
    desc: 'Pengering udara tekan sistem refrigerasi Friulair ACT80. Pengawasan suhu kerja (70-100°C), dew point, dan filter cartridge.',
    scheduleType: 'multi',
    scheduleItems: ['Daily & Weekly (Harian)', 'Overhaul & Berkala', 'Standard Preventive Master'],
    forms: [
      { code: 'AD_D', title: 'Harian & Mingguan (Daily & Weekly)', sub: 'Indikator Power, Dew Point, Suhu Kerja, Kompresor, Fan, Filter FTX/FTS', period: 'Harian & Mingguan', formNo: 'Form-PLS-MTC-D08', section: 'Utility' },
      { code: 'AD_M', title: 'Overhaul & Berkala (Form D09)', sub: 'Pre/After Filter Replacement, Tekanan Freon, Dry & Wet Cleaning Kondenser', period: '1-6 Bulan', formNo: 'Form-PLS-MTC-D09', section: 'Utility' },
      { code: 'AD_S', title: 'Standard Preventive Machine (STD)', sub: 'Master SOP perawatan, standar parameter operasi, instruksi kerja Form-PLS-MTC-D04', period: 'Standar Acuan', formNo: 'Form-PLS-MTC-D04', section: 'Maintenance' },
    ]
  },
  {
    id: 'air-dryer-2',
    group: 'air-dryer',
    title: 'Air Dryer Friulair ACT80 (#2)',
    instanceCode: 'AD-002',
    building: 'Gedung B',
    location: 'Sub-Station Assembly Gedung B',
    assetId: 'ID: AD-002 • Gedung B',
    lastStatus: 'Standar Preventif STD',
    hasStd: true,
    img: `${getAssetBase()}/assets/img/machines/air_dryer.png`,
    deptBadges: [
      { text: 'Gedung B', bg: '#b45309' },
      { text: 'Seksi Utility', bg: '#2b6cb0' },
      { text: '⭐ STD PREVENTIVE', bg: '#15803d' }
    ],
    sections: ['Utility', 'Maintenance', 'PLANT SERVICE'],
    badgeStatus: { text: '3 Form Tersedia', bg: '#dcfce7', color: '#15803d' },
    desc: 'Unit Air Dryer Friulair ACT80 pendukung lini Assembly Gedung B. Memastikan suplai udara instrumen bebas uap air dan minyak.',
    scheduleType: 'multi',
    scheduleItems: ['Daily & Weekly (Harian)', 'Overhaul & Berkala', 'Standard Preventive Master'],
    forms: [
      { code: 'AD_D', title: 'Harian & Mingguan (Daily & Weekly)', sub: 'Indikator Power, Dew Point, Suhu Kerja, Kompresor, Fan, Filter FTX/FTS', period: 'Harian & Mingguan', formNo: 'Form-PLS-MTC-D08', section: 'Utility' },
      { code: 'AD_M', title: 'Overhaul & Berkala (Form D09)', sub: 'Pre/After Filter Replacement, Tekanan Freon, Dry & Wet Cleaning Kondenser', period: '1-6 Bulan', formNo: 'Form-PLS-MTC-D09', section: 'Utility' },
      { code: 'AD_S', title: 'Standard Preventive Machine (STD)', sub: 'Master SOP perawatan, standar parameter operasi, instruksi kerja Form-PLS-MTC-D04', period: 'Standar Acuan', formNo: 'Form-PLS-MTC-D04', section: 'Maintenance' },
    ]
  },
  {
    id: 'air-dryer-3',
    group: 'air-dryer',
    title: 'Air Dryer Friulair ACT80 (#3)',
    instanceCode: 'AD-003',
    building: 'Gedung C',
    location: 'Area Wet Charging Gedung C',
    assetId: 'ID: AD-003 • Gedung C',
    lastStatus: 'Standar Preventif STD',
    hasStd: true,
    img: `${getAssetBase()}/assets/img/machines/air_dryer.png`,
    deptBadges: [
      { text: 'Gedung C', bg: '#6b21a8' },
      { text: 'Seksi Utility', bg: '#2b6cb0' },
      { text: '⭐ STD PREVENTIVE', bg: '#15803d' }
    ],
    sections: ['Utility', 'Maintenance', 'WET CHARGING'],
    badgeStatus: { text: '3 Form Tersedia', bg: '#dcfce7', color: '#15803d' },
    desc: 'Unit Air Dryer Friulair ACT80 area Wet Charging Gedung C. Mendukung sistem otomatisasi pengisian asam dan formasi baterai.',
    scheduleType: 'multi',
    scheduleItems: ['Daily & Weekly (Harian)', 'Overhaul & Berkala', 'Standard Preventive Master'],
    forms: [
      { code: 'AD_D', title: 'Harian & Mingguan (Daily & Weekly)', sub: 'Indikator Power, Dew Point, Suhu Kerja, Kompresor, Fan, Filter FTX/FTS', period: 'Harian & Mingguan', formNo: 'Form-PLS-MTC-D08', section: 'Utility' },
      { code: 'AD_M', title: 'Overhaul & Berkala (Form D09)', sub: 'Pre/After Filter Replacement, Tekanan Freon, Dry & Wet Cleaning Kondenser', period: '1-6 Bulan', formNo: 'Form-PLS-MTC-D09', section: 'Utility' },
      { code: 'AD_S', title: 'Standard Preventive Machine (STD)', sub: 'Master SOP perawatan, standar parameter operasi, instruksi kerja Form-PLS-MTC-D04', period: 'Standar Acuan', formNo: 'Form-PLS-MTC-D04', section: 'Maintenance' },
    ]
  },

  // 2. CHILLER LSBLG250 (3 INSTANCES)
  {
    id: 'chiller-1',
    group: 'chiller',
    title: 'Chiller LSBLG250 (#1)',
    instanceCode: 'CH-001',
    building: 'Gedung A',
    location: 'Chiller Plant Ruang Utama Gedung A',
    assetId: 'ID: CH-001 • Gedung A',
    lastStatus: 'Standar Preventif STD',
    hasStd: true,
    img: `${getAssetBase()}/assets/img/machines/chiller.jpg`,
    deptBadges: [
      { text: 'Gedung A', bg: '#0369a1' },
      { text: 'Seksi Utility', bg: '#2b6cb0' },
      { text: '⭐ STD PREVENTIVE', bg: '#15803d' }
    ],
    sections: ['Utility', 'Maintenance', 'WET CHARGING', 'PLANT SERVICE'],
    badgeStatus: { text: '3 Form Tersedia', bg: '#dcfce7', color: '#15803d' },
    desc: 'Sistem pendingin sentral utama pabrik. Dilengkapi checklist harian, mingguan, serta inspeksi berkala.',
    scheduleType: 'multi',
    scheduleItems: ['Harian & Mingguan', 'Bulanan & Berkala', 'Standard Preventive Master'],
    forms: [
      { code: 'CHILLER_D', title: 'Harian & Mingguan (Daily & Weekly)', sub: 'High/Low Press Indikator, Suhu CT, Running Hour, % Running, E-Stop, Freon', period: 'Harian & Mingguan', formNo: 'Form-PLS-MTC-D08', section: 'WET CHARGING' },
      { code: 'CHILLER_M', title: 'Bulanan & Berkala (Monthly Preventive)', sub: 'Panel Kontrol, Filter Core Dryer, Selenoid & Expansion Valve, Kondensor, Evaporator', period: 'Bulanan & Berkala', formNo: 'Form-PLS-MTC-D09', section: 'Utility' },
      { code: 'CHILLER_S', title: 'Standard Preventive Machine (STD)', sub: 'Master parameter acuan, foto & posisi komponen, frekuensi & instruksi Form-PLS-MTC-D04', period: 'Standar Master Acuan', formNo: 'Form-PLS-MTC-D04', section: 'WET CHARGING' },
    ]
  },
  {
    id: 'chiller-2',
    group: 'chiller',
    title: 'Chiller LSBLG250 (#2)',
    instanceCode: 'CH-002',
    building: 'Gedung B',
    location: 'Sub Chiller Plant Gedung B',
    assetId: 'ID: CH-002 • Gedung B',
    lastStatus: 'Standar Preventif STD',
    hasStd: true,
    img: `${getAssetBase()}/assets/img/machines/chiller.jpg`,
    deptBadges: [
      { text: 'Gedung B', bg: '#b45309' },
      { text: 'Seksi Utility', bg: '#2b6cb0' },
      { text: '⭐ STD PREVENTIVE', bg: '#15803d' }
    ],
    sections: ['Utility', 'Maintenance', 'WET CHARGING', 'PLANT SERVICE'],
    badgeStatus: { text: '3 Form Tersedia', bg: '#dcfce7', color: '#15803d' },
    desc: 'Unit Chiller LSBLG250 Sub-Plant Gedung B. Suplai sirkulasi air dingin mesin cetak grid dan assembly.',
    scheduleType: 'multi',
    scheduleItems: ['Harian & Mingguan', 'Bulanan & Berkala', 'Standard Preventive Master'],
    forms: [
      { code: 'CHILLER_D', title: 'Harian & Mingguan (Daily & Weekly)', sub: 'High/Low Press Indikator, Suhu CT, Running Hour, % Running, E-Stop, Freon', period: 'Harian & Mingguan', formNo: 'Form-PLS-MTC-D08', section: 'WET CHARGING' },
      { code: 'CHILLER_M', title: 'Bulanan & Berkala (Monthly Preventive)', sub: 'Panel Kontrol, Filter Core Dryer, Selenoid & Expansion Valve, Kondensor, Evaporator', period: 'Bulanan & Berkala', formNo: 'Form-PLS-MTC-D09', section: 'Utility' },
      { code: 'CHILLER_S', title: 'Standard Preventive Machine (STD)', sub: 'Master parameter acuan, foto & posisi komponen, frekuensi & instruksi Form-PLS-MTC-D04', period: 'Standar Master Acuan', formNo: 'Form-PLS-MTC-D04', section: 'WET CHARGING' },
    ]
  },
  {
    id: 'chiller-3',
    group: 'chiller',
    title: 'Chiller LSBLG250 (#3)',
    instanceCode: 'CH-003',
    building: 'Gedung C',
    location: 'Ruang Chiller Standby Gedung C',
    assetId: 'ID: CH-003 • Gedung C',
    lastStatus: 'Standar Preventif STD',
    hasStd: true,
    img: `${getAssetBase()}/assets/img/machines/chiller.jpg`,
    deptBadges: [
      { text: 'Gedung C', bg: '#6b21a8' },
      { text: 'Seksi Utility', bg: '#2b6cb0' },
      { text: '⭐ STD PREVENTIVE', bg: '#15803d' }
    ],
    sections: ['Utility', 'Maintenance', 'WET CHARGING', 'PLANT SERVICE'],
    badgeStatus: { text: '3 Form Tersedia', bg: '#dcfce7', color: '#15803d' },
    desc: 'Unit Chiller cadangan dan pendukung formasi baterai area Wet Charging Gedung C.',
    scheduleType: 'multi',
    scheduleItems: ['Harian & Mingguan', 'Bulanan & Berkala', 'Standard Preventive Master'],
    forms: [
      { code: 'CHILLER_D', title: 'Harian & Mingguan (Daily & Weekly)', sub: 'High/Low Press Indikator, Suhu CT, Running Hour, % Running, E-Stop, Freon', period: 'Harian & Mingguan', formNo: 'Form-PLS-MTC-D08', section: 'WET CHARGING' },
      { code: 'CHILLER_M', title: 'Bulanan & Berkala (Monthly Preventive)', sub: 'Panel Kontrol, Filter Core Dryer, Selenoid & Expansion Valve, Kondensor, Evaporator', period: 'Bulanan & Berkala', formNo: 'Form-PLS-MTC-D09', section: 'Utility' },
      { code: 'CHILLER_S', title: 'Standard Preventive Machine (STD)', sub: 'Master parameter acuan, foto & posisi komponen, frekuensi & instruksi Form-PLS-MTC-D04', period: 'Standar Master Acuan', formNo: 'Form-PLS-MTC-D04', section: 'WET CHARGING' },
    ]
  },

  // 3. COOLING TOWER
  {
    id: 'cooling-tower-1',
    group: 'cooling-tower',
    title: 'Cooling Tower Utama (#1)',
    instanceCode: 'CT-001',
    building: 'Gedung A',
    location: 'Rooftop Utility Gedung A',
    assetId: 'ID: CT-001 • Gedung A',
    lastStatus: 'Inspeksi Harian',
    hasStd: false,
    img: `${getAssetBase()}/assets/img/machines/cooling_tower.jpg`,
    deptBadges: [
      { text: 'Gedung A', bg: '#0369a1' },
      { text: 'Seksi Utility', bg: '#2b6cb0' },
      { text: 'Dept. Maintenance', bg: '#6b46c1' }
    ],
    sections: ['Utility', 'Maintenance'],
    badgeStatus: { text: '1 Form Aktif', bg: '#fef3c7', color: '#92400e' },
    desc: 'Monitoring sirkulasi air pendingin, temperatur inlet/outlet, motor fan, dan level basin.',
    scheduleType: 'single',
    scheduleItem: 'Checksheet Harian (Daily)',
    forms: [
      { code: 'CT', title: 'Checksheet Harian (Daily)', sub: 'Inlet/Outlet Temp, ΔT, Basin Level, Motor Ampere, Getaran Fan, pH Air, Kebocoran', period: 'Harian (Setiap Hari)', formNo: 'Form-PLS-MTC-D08', section: 'Utility' }
    ]
  },

  // 4. SCRUBBER
  {
    id: 'scrubber-1',
    group: 'scrubber',
    title: 'Scrubber Kimia (#1)',
    instanceCode: 'SCR-001',
    building: 'Gedung A',
    location: 'Exhaust Area Outdoor Gedung A',
    assetId: 'ID: SCR-001 • Gedung A',
    lastStatus: 'Inspeksi Harian',
    hasStd: false,
    img: `${getAssetBase()}/assets/img/machines/scrubber.jpg`,
    deptBadges: [
      { text: 'Gedung A', bg: '#0369a1' },
      { text: 'Seksi Utility', bg: '#2b6cb0' },
      { text: 'Dept. Maintenance', bg: '#6b46c1' }
    ],
    sections: ['Utility', 'Maintenance'],
    badgeStatus: { text: '1 Form Aktif', bg: '#fef3c7', color: '#92400e' },
    desc: 'Pengawasan sistem penetral emisi udara, pH air sirkulasi, nozzle spray, dan fan blower.',
    scheduleType: 'single',
    scheduleItem: 'Checksheet Harian (Daily)',
    forms: [
      { code: 'SCR', title: 'Checksheet Harian (Daily)', sub: 'pH Air, Flow Pompa, Tekanan Hisap, Level Tangki, Nozzle Spray, Getaran Fan, Sludge', period: 'Harian (Setiap Hari)', formNo: 'Form-PLS-MTC-D08', section: 'Utility' }
    ]
  }
];

function openFormSelectorDialog(eq) {
  const dlg = $('#dlg-form-select');
  if (!dlg) return;
  $('#fsd-title').textContent = `Pilih Formulir ${eq.title}`;
  $('#fsd-sub').textContent = `Unit: ${eq.instanceCode} • Lokasi: ${eq.location}`;
  
  const optContainer = $('#fsd-options');
  if (optContainer) {
    optContainer.innerHTML = eq.forms.map((f, idx) => `
      <div class="fsd-option" role="button" tabindex="0" data-code="${esc(f.code)}">
        <div class="fsd-option-icon ${idx === 0 ? 'blue' : idx === 1 ? 'amber' : 'green'}">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </div>
        <div class="fsd-option-text">
          <h4>${esc(f.title)}</h4>
          <p>${esc(f.sub)}</p>
          <small style="color:#64748b;font-weight:600;margin-top:2px;display:inline-block">${esc(f.formNo || '')} • Periode: ${esc(f.period)}</small>
        </div>
        <svg class="fsd-option-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
      </div>
    `).join('');

    optContainer.querySelectorAll('.fsd-option').forEach((opt) => {
      const choose = () => {
        const code = opt.dataset.code;
        dlg.close();
        showWorkstation(code).catch((er) => toast(er.message, 'err'));
      };
      opt.addEventListener('click', choose);
      opt.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(); }
      });
    });
  }

  dlg.showModal();
}

function renderEquipGrid() {
  const grid = $('#equip-grid');
  if (!grid) return;

  const query = (ui.search || '').toLowerCase();
  const filterBuilding = ui.buildingFilter || 'all';
  const filterFocus = ui.focusFilter || 'all';

  const items = EQUIPMENT_CATALOG.filter((eq) => {
    // 1. Text Search (Search by Title, ID, Location, Building, or Code)
    if (query) {
      const matchTitle = eq.title.toLowerCase().includes(query);
      const matchId = eq.instanceCode.toLowerCase().includes(query);
      const matchLoc = eq.location.toLowerCase().includes(query);
      const matchBld = eq.building.toLowerCase().includes(query);
      const matchForms = eq.forms.some((f) => f.title.toLowerCase().includes(query) || f.code.toLowerCase().includes(query));
      if (!matchTitle && !matchId && !matchLoc && !matchBld && !matchForms) return false;
    }

    // 2. Building Filter
    if (filterBuilding !== 'all') {
      if (eq.building !== filterBuilding) return false;
    }

    // 3. Focus Filter: only show machines that have Standard Preventive (Chiller & Air Dryer)
    if (filterFocus === 'std') {
      if (!eq.hasStd) return false;
    }

    return true;
  });

  const countMsg = $('#equip-count-msg');
  if (countMsg) {
    countMsg.textContent = `Menampilkan ${items.length} dari ${EQUIPMENT_CATALOG.length} unit mesin (CBI Maintenance)`;
  }

  if (!items.length) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; background:#fff; border-radius:16px; padding:48px 20px; text-align:center; border:1px solid #e2e8f0; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
        <svg style="width:48px;height:48px;color:#94a3b8;margin:0 auto 12px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <h3 style="font-size:15px;font-weight:700;color:#1e293b;margin:0 0 4px;">Tidak ada unit peralatan yang cocok</h3>
        <p style="font-size:12px;color:#64748b;margin:0;">Coba ganti filter gedung atau gunakan kata kunci pencarian ID lain.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = items.map((eq) => `
    <div class="portal-card eq-card" data-eq-id="${esc(eq.id)}">
      <div>
        <!-- Top 16:9 Photo Banner with Asset Tag Overlay -->
        <div class="card-photo-box">
          <img 
            src="${esc(eq.img)}" 
            alt="${esc(eq.title)}" 
            loading="lazy"
          >
          <div class="asset-overlay-badge">
            <div class="asset-id">${esc(eq.assetId)}</div>
            <div class="asset-status">${esc(eq.location)}</div>
          </div>
        </div>

        <!-- Card Body -->
        <div class="card-content">
          <h2 class="card-machine-title">${esc(eq.title)}</h2>

          <!-- Badges Row -->
          <div class="card-badges-row">
            <div class="card-dept-group">
              ${eq.deptBadges.map((b) => `
                <span class="pill-dept" style="background-color:${esc(b.bg)}">
                  ${esc(b.text)}
                </span>
              `).join('')}
            </div>
            <span class="pill-status" style="background-color:${esc(eq.badgeStatus.bg)};color:${esc(eq.badgeStatus.color)}">
              ${esc(eq.badgeStatus.text)}
            </span>
          </div>

          <!-- Description -->
          <p class="card-desc">
            ${esc(eq.desc)}
          </p>

          <!-- Schedule & Location Box -->
          <div class="card-schedule-box">
            <div class="schedule-multi-row">
              ${(eq.scheduleItems || [eq.scheduleItem]).map((s) => `
                <div class="schedule-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  <span>${esc(s)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Card Footer CTA Button -->
      <div class="card-footer">
        ${eq.forms.length === 1 ? `
          <button type="button" class="btn-cta-crimson btn-open-form" data-code="${esc(eq.forms[0].code)}">
            <span>Buka Checksheet (${esc(eq.instanceCode)})</span>
            <span class="cta-arrow">&rarr;</span>
          </button>
        ` : `
          <button type="button" class="btn-cta-dark btn-pick-form" data-eq-id="${esc(eq.id)}">
            <span>Pilih Formulir ${esc(eq.instanceCode)} (${eq.forms.length})</span>
            <span class="cta-arrow">&rarr;</span>
          </button>
        `}
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.eq-card').forEach((card) => {
    const eqId = card.dataset.eqId;
    const eq = EQUIPMENT_CATALOG.find((x) => x.id === eqId);
    if (!eq) return;

    const openSingle = (code) => {
      showWorkstation(code).catch((er) => toast(er.message, 'err'));
    };

    const pickForm = () => {
      openFormSelectorDialog(eq);
    };

    const btnOpen = card.querySelector('.btn-open-form');
    if (btnOpen) {
      btnOpen.addEventListener('click', (e) => {
        e.stopPropagation();
        openSingle(btnOpen.dataset.code);
      });
    }

    const btnPick = card.querySelector('.btn-pick-form');
    if (btnPick) {
      btnPick.addEventListener('click', (e) => {
        e.stopPropagation();
        pickForm();
      });
    }

    card.addEventListener('click', () => {
      if (eq.forms.length === 1) openSingle(eq.forms[0].code);
      else pickForm();
    });
  });
}

// ------------------------------------------------------------------ SIDEBAR 1: ACTION ITEMS (NG MANAGEMENT)
async function loadActionCounts() {
  try {
    const todayItems = await api.actions('TODAY');
    const backlogItems = await api.actions('BACKLOG');
    const todayCount = (todayItems || []).filter((i) => i.status !== 'RESOLVED').length;
    const backlogCount = (backlogItems || []).filter((i) => i.status !== 'RESOLVED').length;

    if ($('#action-badge-count')) $('#action-badge-count').textContent = todayCount + backlogCount;
    if ($('#count-action-today')) $('#count-action-today').textContent = todayCount;
    if ($('#count-action-backlog')) $('#count-action-backlog').textContent = backlogCount;
    if ($('#kpi-action-today')) $('#kpi-action-today').textContent = todayCount;
    if ($('#kpi-action-backlog')) $('#kpi-action-backlog').textContent = backlogCount;
  } catch {}
}

async function renderActionItems() {
  const container = $('#action-items-list');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;padding:30px;color:#94a3b8;">Memuat data...</div>';

  try {
    const items = await api.actions(ui.actionTab);
    const u = getCurrentUser();
    const isLeader = u?.role === 'leader';

    if (!items || !items.length) {
      container.innerHTML = `
        <div style="text-align:center;padding:40px 10px;color:#94a3b8;font-size:12.5px;">
          <div style="font-size:28px;margin-bottom:8px;">✅</div>
          <div style="font-weight:700;color:#334155;">Tidak Ada Tindakan ${ui.actionTab === 'TODAY' ? 'Hari Ini' : 'Backlog'}</div>
          <p style="margin:4px 0 0;font-size:11.5px;">Semua peralatan dalam kondisi optimal atau sudah diselesaikan.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = items.map((it) => `
      <div class="action-card">
        <div class="action-card-header">
          <span class="action-instance-badge">${esc(it.instance_code || '-')}</span>
          <span class="action-status-tag ${it.status === 'RESOLVED' ? 'tag-resolved' : it.action_type === 'TODAY' ? 'tag-today' : 'tag-backlog'}">
            ${esc(it.status === 'RESOLVED' ? 'Selesai' : it.action_type === 'TODAY' ? 'Action Today' : 'Action Backlog')}
          </span>
        </div>
        <h4>${esc(it.item_name)}</h4>
        <p>${esc(it.ng_description)}</p>
        
        <div class="action-card-footer">
          <div>
            <span>📍 ${esc(it.building || '-')}</span>
            ${it.scheduled_date ? `<span style="margin-left:6px;">📅 ${esc(it.scheduled_date)}</span>` : ''}
          </div>
          <div class="action-btn-group">
            ${isLeader ? `
              ${it.action_type === 'TODAY' ? `
                <button type="button" class="btn-card-action btn-switch btn-make-backlog" data-id="${it.id}">
                  📅 Ke Backlog
                </button>
              ` : `
                <button type="button" class="btn-card-action btn-switch btn-make-today" data-id="${it.id}">
                  ⚡ Ke Today
                </button>
              `}
            ` : ''}

            ${it.status !== 'RESOLVED' ? `
              <button type="button" class="btn-card-action btn-resolve btn-action-report" data-id="${it.id}" data-inst="${esc(it.instance_code)}" data-item="${esc(it.item_name)}">
                ✍️ Kerjakan &amp; Buat Laporan
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `).join('');

    // Wire buttons
    container.querySelectorAll('.btn-make-backlog').forEach((btn) => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const targetDate = prompt('Masukkan tanggal target backlog (YYYY-MM-DD):', new Date().toISOString().slice(0, 10));
        if (targetDate) {
          await api.actionDecision(id, { action_type: 'BACKLOG', scheduled_date: targetDate });
          toast('Item dipindahkan ke Action Backlog 🟡', 'ok');
          loadActionCounts();
          renderActionItems();
        }
      };
    });

    container.querySelectorAll('.btn-make-today').forEach((btn) => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        await api.actionDecision(id, { action_type: 'TODAY', scheduled_date: new Date().toISOString().slice(0, 10) });
        toast('Item dipindahkan ke Action Today 🔴', 'ok');
        loadActionCounts();
        renderActionItems();
      };
    });

    container.querySelectorAll('.btn-action-report').forEach((btn) => {
      btn.onclick = () => {
        // Pre-fill reporting form
        closeActionSidebar();
        openReportingSidebar();
        if ($('#rep-instance')) $('#rep-instance').value = btn.dataset.inst;
        if ($('#rep-action')) $('#rep-action').value = `Perbaikan dan verifikasi temuan abnormal pada item: ${btn.dataset.item}. `;
        $('#form-report').dataset.actionItemId = btn.dataset.id;
      };
    });
  } catch (err) {
    container.innerHTML = `<div style="color:#ef4444;padding:20px;text-align:center;">Gagal memuat: ${esc(err.message)}</div>`;
  }
}

function openActionSidebar() {
  $('#sidebar-action-backdrop')?.classList.add('active');
  $('#sidebar-action')?.classList.add('active');
  renderActionItems();
}

function closeActionSidebar() {
  $('#sidebar-action-backdrop')?.classList.remove('active');
  $('#sidebar-action')?.classList.remove('active');
}

// ------------------------------------------------------------------ SIDEBAR 2: REPORTING & PDF EXPORT
function populateInstanceSelect(selectId) {
  const sel = $(selectId);
  if (!sel) return;
  sel.innerHTML = EQUIPMENT_CATALOG.map((eq) => `
    <option value="${esc(eq.instanceCode)}">${esc(eq.instanceCode)} - ${esc(eq.title)} (${esc(eq.building)})</option>
  `).join('');
}

function openReportingSidebar() {
  $('#sidebar-reporting-backdrop')?.classList.add('active');
  $('#sidebar-reporting')?.classList.add('active');
  populateInstanceSelect('#rep-instance');
  if ($('#rep-date')) $('#rep-date').value = new Date().toISOString().slice(0, 10);
  const u = getCurrentUser();
  if ($('#rep-pic')) $('#rep-pic').value = u ? u.full_name : getActor();
}

function closeReportingSidebar() {
  $('#sidebar-reporting-backdrop')?.classList.remove('active');
  $('#sidebar-reporting')?.classList.remove('active');
}

function addPartRow(name = '', partNo = '', qty = 1, unit = 'Pcs') {
  const tbody = $('#tbody-parts');
  if (!tbody) return;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" class="part-name" placeholder="Nama part" value="${esc(name)}" required></td>
    <td><input type="text" class="part-num" placeholder="Part number/spek" value="${esc(partNo)}"></td>
    <td><input type="number" class="part-qty" min="1" value="${qty}"></td>
    <td><input type="text" class="part-unit" value="${esc(unit)}"></td>
    <td style="text-align:center;"><button type="button" class="btn-del-part" style="border:none;background:transparent;color:#ef4444;cursor:pointer;font-weight:700;">✕</button></td>
  `;
  tr.querySelector('.btn-del-part').onclick = () => tr.remove();
  tbody.appendChild(tr);
}

async function renderReportsHistory() {
  const container = $('#report-history-container');
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;padding:30px;color:#94a3b8;">Memuat riwayat laporan...</div>';

  try {
    const list = await api.reports();
    const u = getCurrentUser();
    const isLeader = u?.role === 'leader';

    if (!list || !list.length) {
      container.innerHTML = '<div style="text-align:center;padding:30px;color:#94a3b8;">Belum ada laporan maintenance yang disubmit.</div>';
      return;
    }

    container.innerHTML = list.map((r) => `
      <div class="action-card">
        <div class="action-card-header">
          <span class="action-instance-badge">${esc(r.instance_code)}</span>
          <span class="action-status-tag ${r.status === 'APPROVED' ? 'tag-resolved' : 'tag-backlog'}">
            ${esc(r.status)}
          </span>
        </div>
        <div style="font-size:12px;color:#334155;margin-bottom:6px;">
          <strong>PIC:</strong> ${esc(r.pic_name)} &bull; <strong>Tanggal:</strong> ${esc(r.report_date)} (${esc(r.shift)})
        </div>
        <p style="font-size:11.5px;color:#475569;margin-bottom:8px;">
          ${esc(r.action_taken)}
        </p>
        ${r.parts && r.parts.length ? `
          <div style="font-size:11px;color:#0284c7;background:#f0f9ff;padding:4px 8px;border-radius:4px;margin-bottom:10px;">
            📦 Sparepart: ${r.parts.map((p) => `${esc(p.part_name)} (${p.qty} ${esc(p.unit)})`).join(', ')}
          </div>
        ` : ''}

        <div class="action-card-footer">
          <div>
            ${r.leader_approval_by ? `<span style="color:#15803d;font-weight:700;">✔ Disetujui: ${esc(r.leader_approval_by)}</span>` : '<span style="color:#d97706;">Menunggu Approval Leader</span>'}
          </div>
          <div class="action-btn-group">
            ${isLeader && r.status !== 'APPROVED' ? `
              <button type="button" class="btn-card-action btn-resolve btn-approve-report" data-id="${r.id}">
                ✅ Setujui
              </button>
            ` : ''}
            <a href="${getAssetBase()}/reports/${r.id}/print" target="_blank" class="btn-card-action btn-switch" style="text-decoration:none;">
              🖨️ Cetak / Unduh PDF
            </a>
          </div>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.btn-approve-report').forEach((btn) => {
      btn.onclick = async () => {
        await api.approveReport(btn.dataset.id);
        toast('Laporan disetujui Leader ✔', 'ok');
        renderReportsHistory();
      };
    });
  } catch (err) {
    container.innerHTML = `<div style="color:#ef4444;padding:20px;text-align:center;">Gagal: ${esc(err.message)}</div>`;
  }
}

// ------------------------------------------------------------------ MODAL: JOB ASSIGNMENT (LEADER ONLY)
async function openAssignmentModal() {
  const dlg = $('#dlg-assignment');
  if (!dlg) return;
  populateInstanceSelect('#assign-instance');
  if ($('#assign-date')) $('#assign-date').value = new Date().toISOString().slice(0, 10);
  
  // Populate users
  const userSelect = $('#assign-user');
  if (userSelect) {
    try {
      const users = await api.users();
      userSelect.innerHTML = users.map((u) => `
        <option value="${u.id}">${esc(u.full_name)} (${esc(u.role === 'leader' ? 'Leader' : 'Teknisi')})</option>
      `).join('');
    } catch {}
  }

  dlg.showModal();
}

// ------------------------------------------------------------------ EVENT LISTENERS SETUP
function setupEventListeners() {
  // 1. Auth Form & Quick Logins
  $('#form-login')?.addEventListener('submit', async () => {
    const un = $('#login-username')?.value.trim();
    const pw = $('#login-password')?.value;
    const errBox = $('#login-error');
    if (!un || !pw) return;
    try {
      if (errBox) errBox.style.display = 'none';
      const res = await api.login(un, pw);
      setCurrentUser(res.user);
      updateActorUI(res.user.full_name);
      toast(`Selamat datang, ${res.user.full_name}! 👋`, 'ok');
      showPortal();
    } catch (e) {
      if (errBox) {
        errBox.textContent = e.message || 'Login gagal.';
        errBox.style.display = 'block';
      }
    }
  });

  document.querySelectorAll('.btn-quick-user').forEach((btn) => {
    btn.addEventListener('click', () => {
      const u = btn.dataset.user;
      if ($('#login-username')) $('#login-username').value = u;
      if ($('#login-password')) $('#login-password').value = '12345';
      $('#form-login')?.dispatchEvent(new Event('submit'));
    });
  });

  $('#btn-logout')?.addEventListener('click', async () => {
    if (confirm('Apakah Anda yakin ingin keluar dari sistem checksheet?')) {
      try { await api.logout(); } catch {}
      setCurrentUser(null);
      toast('Anda telah keluar.');
      showLogin();
    }
  });

  // 2. Action Sidebar Triggers
  $('#btn-open-actions')?.addEventListener('click', openActionSidebar);
  $('#sidebar-action-close')?.addEventListener('click', closeActionSidebar);
  $('#sidebar-action-backdrop')?.addEventListener('click', closeActionSidebar);

  $('#tab-action-today')?.addEventListener('click', () => {
    ui.actionTab = 'TODAY';
    $('#tab-action-today').classList.add('active');
    $('#tab-action-backlog').classList.remove('active');
    renderActionItems();
  });

  $('#tab-action-backlog')?.addEventListener('click', () => {
    ui.actionTab = 'BACKLOG';
    $('#tab-action-backlog').classList.add('active');
    $('#tab-action-today').classList.remove('active');
    renderActionItems();
  });

  // 3. Reporting Sidebar Triggers
  $('#btn-open-reporting')?.addEventListener('click', openReportingSidebar);
  $('#sidebar-reporting-close')?.addEventListener('click', closeReportingSidebar);
  $('#sidebar-reporting-backdrop')?.addEventListener('click', closeReportingSidebar);

  $('#tab-report-new')?.addEventListener('click', () => {
    $('#tab-report-new').classList.add('active');
    $('#tab-report-history').classList.remove('active');
    $('#panel-report-new').style.display = 'block';
    $('#panel-report-history').style.display = 'none';
  });

  $('#tab-report-history')?.addEventListener('click', () => {
    $('#tab-report-history').classList.add('active');
    $('#tab-report-new').classList.remove('active');
    $('#panel-report-new').style.display = 'none';
    $('#panel-report-history').style.display = 'block';
    renderReportsHistory();
  });

  $('#btn-add-part-row')?.addEventListener('click', () => addPartRow());

  $('#form-report')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const inst = $('#rep-instance')?.value;
    const dt = $('#rep-date')?.value;
    const shift = $('#rep-shift')?.value;
    const pic = $('#rep-pic')?.value.trim();
    const act = $('#rep-action')?.value.trim();
    const conc = $('#rep-conclusion')?.value.trim();
    const actionItemId = $('#form-report').dataset.actionItemId || null;

    if (!inst || !dt || !pic || !act) {
      toast('Mohon lengkapi semua field laporan.', 'err');
      return;
    }

    // Collect dynamic parts
    const parts = [];
    document.querySelectorAll('#tbody-parts tr').forEach((tr) => {
      const pName = tr.querySelector('.part-name')?.value.trim();
      const pNum = tr.querySelector('.part-num')?.value.trim();
      const pQty = Number(tr.querySelector('.part-qty')?.value || 1);
      const pUnit = tr.querySelector('.part-unit')?.value.trim() || 'Pcs';
      if (pName) {
        parts.push({ part_name: pName, part_number: pNum, qty: pQty, unit: pUnit });
      }
    });

    try {
      const res = await api.createReport({
        instance_code: inst,
        report_date: dt,
        shift,
        pic_name: pic,
        action_taken: act,
        conclusion: conc,
        action_item_id: actionItemId,
        parts
      });

      toast('Laporan pemeliharaan berhasil disimpan ✔', 'ok');
      delete $('#form-report').dataset.actionItemId;
      $('#tbody-parts').innerHTML = '';
      $('#rep-action').value = '';

      // Langsung buka dokumen PDF di tab baru
      if (res.print_url) {
        window.open(res.print_url, '_blank');
      }

      loadActionCounts();
      closeReportingSidebar();
    } catch (err) {
      toast('Gagal menyimpan laporan: ' + err.message, 'err');
    }
  });

  // 4. Assignment Triggers (Leader)
  $('#btn-open-assignment')?.addEventListener('click', openAssignmentModal);
  $('#dlg-assignment-close')?.addEventListener('click', () => $('#dlg-assignment')?.close());

  $('#form-assignment')?.addEventListener('submit', async () => {
    const inst = $('#assign-instance')?.value;
    const dt = $('#assign-date')?.value;
    const type = $('#assign-type')?.value;
    const userId = $('#assign-user')?.value;
    const notes = $('#assign-notes')?.value.trim();

    try {
      await api.createAssignment({
        instance_code: inst,
        schedule_date: dt,
        inspection_type: type,
        assigned_to_user_id: userId,
        notes
      });

      toast('Penugasan berhasil disimpan ke jadwal teknisi ✔', 'ok');
      $('#dlg-assignment')?.close();
    } catch (err) {
      toast('Gagal menyimpan penugasan: ' + err.message, 'err');
    }
  });

  // 5. Building & Focus Filters
  document.querySelectorAll('.filter-building').forEach((pill) => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.filter-building').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      ui.buildingFilter = pill.dataset.building || 'all';
      renderEquipGrid();
    });
  });

  document.querySelectorAll('.filter-focus').forEach((pill) => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.filter-focus').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      ui.focusFilter = pill.dataset.focus || 'all';
      renderEquipGrid();
    });
  });

  // Search input
  $('#portal-search')?.addEventListener('input', (e) => {
    ui.search = (e.target.value || '').trim();
    renderEquipGrid();
  });

  // Dialog Close Wiring
  $('#fsd-close')?.addEventListener('click', () => $('#dlg-form-select')?.close());
  $('#dlg-form-select')?.addEventListener('click', (e) => {
    if (e.target === $('#dlg-form-select')) $('#dlg-form-select').close();
  });

  // Photo Zoom Modal Wiring
  document.addEventListener('click', (e) => {
    const photo = e.target.closest('.std-photo-panel img, .chiller-photo-wrap img, .card-photo-box img');
    if (photo && e.target.closest('.std-photo-panel, .chiller-photo-wrap')) {
      const dlg = $('#dlg-photo-zoom');
      const zoomImg = $('#photo-zoom-img');
      if (dlg && zoomImg) {
        zoomImg.src = photo.src;
        dlg.showModal();
      }
    }
    if (e.target === $('#dlg-photo-zoom') || e.target.closest('#photo-zoom-close')) {
      $('#dlg-photo-zoom')?.close();
    }
  });

  // Menu Utama from workstation
  $('#btn-back-hub')?.addEventListener('click', (e) => {
    e.preventDefault();
    showPortal();
  });

  $('#portal-who')?.addEventListener('click', () => askName(false));

  // Period changes
  const periodChanged = () => { 
    ui.month = Number($('#month').value); 
    ui.year = Number($('#year').value); 
    if (ui.year >= 2000 && ui.year <= 2100) openSheet().catch((er) => toast(er.message, 'err')); 
  };
  $('#month')?.addEventListener('change', periodChanged);
  $('#year')?.addEventListener('change', periodChanged);

  function shiftPeriod(delta) {
    const isAnnualOrStd = ui.tpl === 'CHILLER_M' || ui.tpl === 'CHILLER_S' || ui.tpl === 'AD_M' || ui.tpl === 'AD_S';
    if (isAnnualOrStd) {
      let y = Number($('#year').value) + delta;
      if (y >= 2000 && y <= 2100) {
        $('#year').value = y;
        periodChanged();
      }
      return;
    }
    let m = Number($('#month').value) + delta;
    let y = Number($('#year').value);
    if (m < 1) { m = 12; y--; }
    else if (m > 12) { m = 1; y++; }
    $('#month').value = m;
    $('#year').value = y;
    periodChanged();
  }
  $('#period-prev')?.addEventListener('click', () => shiftPeriod(-1));
  $('#period-next')?.addEventListener('click', () => shiftPeriod(1));

  $('#zoom-in').onclick = () => setZoom(ui.zoom + 0.1);
  $('#zoom-out').onclick = () => setZoom(ui.zoom - 0.1);
  $('#zoom-fit').onclick = fit;
  $('#btn-print').onclick = () => window.print();
  $('#btn-excel').onclick = () => {
    if (!S) return toast('Data belum siap untuk diekspor', 'err');
    exportExcel(S);
    toast('File Excel berhasil diunduh ✔', 'ok');
  };
  $('#who').onclick = () => askName(false);
  $('#sync')?.addEventListener('click', async () => {
    if (ui.busy) return;
    setSync('busy', 'Sync…');
    toast('Menyinkronkan data…');
    try {
      const r = await api.poll(S.sheet.id, -1);
      apply(r, { force: true });
      setSync('', 'Live');
      toast('Data tersinkronisasi ✔', 'ok');
    } catch (err) {
      setSync('err', 'Gagal');
      toast('Gagal sinkronisasi: ' + err.message, 'err');
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea, select')) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      window.print();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
      e.preventDefault();
      $('#btn-excel')?.click();
    } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
      e.preventDefault();
      fit();
    } else if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
      e.preventDefault();
      setZoom(ui.zoom + 0.1);
    } else if ((e.ctrlKey || e.metaKey) && (e.key === '-' || e.key === '_')) {
      e.preventDefault();
      setZoom(ui.zoom - 0.1);
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowLeft') {
      e.preventDefault();
      shiftPeriod(-1);
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowRight') {
      e.preventDefault();
      shiftPeriod(1);
    }
  });
}

function dismissSplash() {
  document.querySelectorAll('#splash').forEach((el) => {
    el.classList.add('done');
    setTimeout(() => { try { el.remove(); } catch {} }, 400);
  });
}

// ------------------------------------------------------------------ BOOT
(async function boot() {
  const msg = $('#splash-msg');
  const watchdog = setTimeout(() => {
    console.warn('Watchdog: splash auto-dismissed');
    dismissSplash();
  }, 3500);

  try {
    const now = new Date();
    ui.year = now.getFullYear(); ui.month = now.getMonth() + 1;
    $('#month').innerHTML = MONTHS.map((m, i) => `<option value="${i + 1}"${i + 1 === ui.month ? ' selected' : ''}>${m}</option>`).join('');
    $('#year').value = ui.year;

    setupEventListeners();
    startClock();
    initStagePanning();

    if (msg) msg.textContent = 'Memeriksa sesi login…';

    // Periksa status login
    let user = getCurrentUser();
    if (!user) {
      try {
        const meRes = await api.me();
        if (meRes.authenticated && meRes.user) {
          user = meRes.user;
          setCurrentUser(user);
        }
      } catch {}
    }

    if (msg) msg.textContent = 'Memuat master peralatan…';
    ui.templates = await api.templates();
    if (!ui.templates.length) throw new Error('Belum ada template form. Jalankan: php spark db:seed ChecksheetSeeder');
    if (!ui.templates.some((t) => t.code === ui.tpl)) ui.tpl = ui.templates[0].code;

    const sw = $('#switch-tpl');
    if (sw) {
      sw.innerHTML = ui.templates.map((t) => `<option value="${esc(t.code)}">${esc(t.machine_type)} (${esc(t.section || 'Utility')})</option>`).join('');
      sw.value = ui.tpl;
    }

    renderEquipGrid();

    clearTimeout(watchdog);
    dismissSplash();

    if (user) {
      updateActorUI(user.full_name);
      showPortal();
      loadActionCounts();
    } else {
      showLogin();
    }

    schedulePoll();
  } catch (e) {
    console.error('Boot error:', e);
    clearTimeout(watchdog);
    if (msg) {
      msg.innerHTML = `<span style="color:#ef4444;font-weight:600">⚠ ${esc(e.message)}</span><br><button onclick="location.reload()" style="margin-top:12px;padding:7px 18px;border-radius:6px;border:none;background:#2563eb;color:#fff;cursor:pointer;font-weight:600;font-size:13px">Muat Ulang</button>`;
    }
    const bar = $('.bar');
    if (bar) bar.style.display = 'none';
  }
})();
