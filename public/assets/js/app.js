import { api, getActor, setActor } from './api.js';
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
  filter: 'all',
  search: '',
};
let S = null;
let pop = null; // { item, day }

function updateActorUI(name) {
  const n = name || getActor() || 'Belum diisi';
  document.querySelectorAll('.actor-name').forEach((el) => { el.textContent = n; });
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
  // Gunakan skala 100% terbaca secara default agar tabel tajam & bebas digeser di segala arah
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

  // Smart toggle: Bila sudah fit, klik lagi akan mengembalikan ke skala 100% normal
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

// ------------------------------------------------------------------ polling (real-time antar pengguna)
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
  if (symbol === null && value !== null) symbol = outOfLimit(item, value) ? 'X' : 'V'; // auto-simbol dari nilai ukur
  $('#pop').hidden = true; pop = null;
  await mutate(() => api.entry(S.sheet.id, { item_id: item.id, day, symbol, value, note }));
}

async function quickSet(item, day, symbol) {
  const e = S.entries[item.id]?.[day] || {};
  if (dayLocked(day)) { toast('Hari ini sudah dikunci.', 'err'); return; }
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

// ------------------------------------------------------------------ dialog approval
function statusBox(a) {
  if (!a) return '<div class="status">⏳ Menunggu keputusan</div>';
  const ok = a.status === 'APPROVED';
  return `<div class="status ${ok ? 'ok' : 'rej'}"><b>${ok ? '✔ Approved' : '✖ Rejected'}</b><span>oleh ${esc(a.actor)} • ${fmtDT(a.at)}${a.note ? `<br>Catatan: ${esc(a.note)}` : ''}</span></div>`;
}

function openDialog(html, bind) {
  const d = $('#dlg');
  d.innerHTML = `<div class="dlg">${html}</div>`;
  d.showModal();
  bind(d);
  d.addEventListener('close', () => { if (ui.dirty) render(); }, { once: true });
}

async function decide(scope, ref, role, status, d) {
  const note = $('#d-note', d).value.trim();
  if (status === 'REJECTED' && !note) { toast('Catatan wajib diisi saat Reject.', 'err'); $('#d-note', d).focus(); return; }
  d.close();
  await mutate(() => api.approve(S.sheet.id, { scope, ref, role, status, note }), status === 'APPROVED' ? 'Disetujui ✔' : 'Ditolak ✖');
}
async function reset(scope, ref, role, d) {
  d.close();
  await mutate(() => api.revoke(S.sheet.id, { scope, ref, role }), 'Keputusan dibatalkan');
}

function approvalActions(scope, ref, role, a) {
  return `<label for="d-note">Catatan ${a ? '' : '(wajib bila Reject)'}</label><textarea id="d-note" rows="2" maxlength="500" placeholder="Alasan / catatan…"></textarea>
    <div class="actions"><button class="btn ok" data-do="APPROVED">✔ Approve</button><button class="btn ng" data-do="REJECTED">✖ Reject</button>
    ${a ? '<button class="btn" data-do="RESET">Reset</button>' : ''}<span class="sp"></span><button class="btn ghost" data-do="CLOSE">Tutup</button></div>`;
}

function bindDecision(d, scope, ref, role) {
  d.onclick = (ev) => {
    const act = ev.target.closest('[data-do]')?.dataset.do;
    if (!act) return;
    if (act === 'CLOSE') d.close();
    else if (act === 'RESET') reset(scope, ref, role, d);
    else decide(scope, ref, role, act, d);
  };
}

function openDay(day) {
  const a = findAp(S, 'DAY', day, 'KASUBSIE');
  const locked = dayLocked(day);
  const cnt = S.stats.per_day[day] || 0;
  const dateTxt = new Date(S.sheet.year, S.sheet.month - 1, day).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  openDialog(`<h3>Review hari ke-${day}</h3><p class="sub">${esc(dateTxt)} • ${cnt} dari ${S.template.items.filter((i) => !i.calc).length} item terisi</p>
    ${statusBox(a)}
    <label for="d-pic">PIC MTN (pemeriksa hari ini)</label>
    <div style="display:flex;gap:6px"><input type="text" id="d-pic" maxlength="100" value="${esc(S.pics[day] || '')}" ${locked ? 'disabled' : ''}><button class="btn" data-do="PIC" ${locked ? 'disabled' : ''}>Simpan</button></div>
    <div class="actions" style="margin-top:10px"><button class="btn" data-do="FILL" ${locked ? 'disabled' : ''}>Isi semua kosong = ${glyph('V')}</button></div>
    ${approvalActions('DAY', day, 'KASUBSIE', a)}`, (d) => {
    bindDecision(d, 'DAY', day, 'KASUBSIE');
    const decision = d.onclick;
    d.onclick = (ev) => {
      const act = ev.target.closest('[data-do]')?.dataset.do;
      if (act === 'PIC') { const name = $('#d-pic', d).value; d.close(); mutate(() => api.pic(S.sheet.id, day, name), 'PIC disimpan'); }
      else if (act === 'FILL') { d.close(); mutate(() => api.fillDay(S.sheet.id, day, 'V'), 'Semua item kosong diisi V'); }
      else decision(ev);
    };
  });
}

function openWeek(block) {
  const [f, t] = S.config.week_blocks[block - 1];
  const a = findAp(S, 'WEEK', block, 'KASIE');
  openDialog(`<h3>Approval Kasie MTN</h3><p class="sub">Minggu ke-${block} (tanggal ${f}–${Math.min(t, S.sheet.days_in_month)})</p>${statusBox(a)}
    <p class="sub" style="margin-top:10px">Syarat: semua hari berisi pada blok ini sudah di-approve KaSubSie. Reject akan membuka kembali hari-hari tsb.</p>
    ${approvalActions('WEEK', block, 'KASIE', a)}`, (d) => bindDecision(d, 'WEEK', block, 'KASIE'));
}

function openSign(role) {
  const a = findAp(S, 'DOC', 0, role);
  openDialog(`<h3>Tanda tangan ${ROLE_LABEL[role]}</h3><p class="sub">${esc(S.template.machine_type)} — ${MONTHS[S.sheet.month - 1]} ${S.sheet.year}</p>${statusBox(a)}
    <p class="sub" style="margin-top:10px">Urutan: ${S.config.doc_order.map((r) => ROLE_LABEL[r]).join(' → ')}. Ka.Dept menyetujui = lembar final & terkunci.</p>
    ${approvalActions('DOC', 0, role, a)}`, (d) => bindDecision(d, 'DOC', 0, role));
}

// ------------------------------------------------------------------ identitas pengguna (tanpa login)
function askName(first = false) {
  return new Promise((res) => {
    openDialog(`<h3>${first ? 'Selamat datang 👋' : 'Ganti nama pengguna'}</h3><p class="sub">Aplikasi ini tanpa login. Nama Anda hanya dicatat sebagai jejak siapa yang mengisi / menyetujui.</p>
      <label for="d-name">Nama Anda</label><input type="text" id="d-name" maxlength="100" value="${esc(getActor())}" autocomplete="name" placeholder="Ketik nama Anda...">
      <div class="actions"><button class="btn pri" id="d-ok">Mulai</button></div>`, (d) => {
      const input = $('#d-name', d);
      const btn = $('#d-ok', d);
      const go = () => {
        const v = input.value.trim();
        if (!v) {
          input.focus();
          input.style.borderColor = '#b3261e';
          return;
        }
        setActor(v);
        updateActorUI(v);
        d.close();
        res();
      };
      btn.onclick = go;
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          go();
        }
      });
      d.addEventListener('cancel', (e) => { if (!getActor()) e.preventDefault(); });
      setTimeout(() => input.focus(), 50);
    });
  });
}

// ------------------------------------------------------------------ event wiring
sheetEl.addEventListener('click', (e) => {
  const cell = e.target.closest('td.day[data-item]');
  if (cell) { closePop(); return openPop(cell); }
  const dayEl = e.target.closest('[data-day]');
  if (dayEl && !dayEl.matches('td.day')) return openDay(Number(dayEl.dataset.day));
  const wk = e.target.closest('[data-week]');
  if (wk) return openWeek(Number(wk.dataset.week));
  const sg = e.target.closest('[data-sign]');
  if (sg) return openSign(sg.dataset.sign);
  if (e.target.id === 'add-row') { ui.extraRows += 3; render(); }
});

sheetEl.addEventListener('keydown', (e) => {
  const cell = e.target.closest?.('td.day[data-item]');
  if (!cell || e.ctrlKey || e.metaKey || e.altKey) return;
  const item = itemById(cell.dataset.item), day = Number(cell.dataset.day);
  const arrows = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
  if (arrows[e.key]) { e.preventDefault(); return moveFocus(item.id, day, ...arrows[e.key]); }
  if (e.key === 'Enter') { e.preventDefault(); return openPop(cell); }
  if (item.calc) return;
  const sym = SYMBOLS.find((s) => s.key === e.key.toLowerCase());
  if (sym) { e.preventDefault(); return quickSet(item, day, sym.code); }
  if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); quickSet(item, day, null); }
});

sheetEl.addEventListener('focusin', (e) => { const c = e.target.closest?.('td.day[data-item]'); if (c) ui.focus = { item: Number(c.dataset.item), day: Number(c.dataset.day) }; });
sheetEl.addEventListener('focusout', () => setTimeout(() => { if (ui.dirty && !typing() && !overlayOpen()) render(); }, 150));

sheetEl.addEventListener('change', (e) => {
  const t = e.target;
  if (t.dataset.hdr) return void mutate(() => api.header(S.sheet.id, { [t.dataset.hdr]: t.value }));
  if (t.dataset.remark) return void mutate(() => api.remark(S.sheet.id, Number(t.dataset.remark), t.value));
  if (t.dataset.f) {
    const tr = t.closest('tr.frow');
    const body = { line_no: Number(tr.dataset.line) };
    tr.querySelectorAll('[data-f]').forEach((i) => { body[i.dataset.f] = i.value; });
    mutate(() => api.finding(S.sheet.id, body));
  }
});

$('#pop').addEventListener('click', (e) => {
  const sym = e.target.closest('[data-sym]');
  if (sym) return void commitPop(sym.dataset.sym);
  if (e.target.id === 'p-save') return void commitPop();
  if (e.target.id === 'p-clear') { const { item, day } = pop; $('#pop').hidden = true; pop = null; return void mutate(() => api.entry(S.sheet.id, { item_id: item.id, day, symbol: null, value: null, note: '' })); }
  if (e.target.id === 'p-close') closePop();
});
$('#pop').addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closePop(); return; }
  if (e.key === 'Enter') { e.preventDefault(); commitPop(); return; }
  if (e.target.tagName !== 'INPUT') { const s = SYMBOLS.find((x) => x.key === e.key.toLowerCase()); if (s) { e.preventDefault(); commitPop(s.code); } }
});
document.addEventListener('mousedown', (e) => { if (!$('#pop').hidden && !e.target.closest('#pop') && !e.target.closest('td.day')) closePop(); });

// ------------------------------------------------------------------ portal & workstation navigation
function showPortal() {
  const ws = $('#workstation-view');
  const pt = $('#portal-view');
  if (ws) {
    ws.hidden = true;
    ws.style.setProperty('display', 'none', 'important');
  }
  if (pt) {
    pt.hidden = false;
    pt.style.setProperty('display', 'flex', 'important');
  }
  ui.view = 'portal';
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  document.body.scrollLeft = 0;
  document.documentElement.scrollLeft = 0;
}

async function showWorkstation(tplCode) {
  if (tplCode) {
    ui.tpl = tplCode;
    localStorage.setItem('cs_tpl', ui.tpl);
  }
  const ws = $('#workstation-view');
  const pt = $('#portal-view');
  if (pt) {
    pt.hidden = true;
    pt.style.setProperty('display', 'none', 'important');
  }
  if (ws) {
    ws.hidden = false;
    ws.style.setProperty('display', 'flex', 'important');
  }
  ui.view = 'workstation';
  if ($('#switch-tpl')) $('#switch-tpl').value = ui.tpl;

  // Pastikan posisi viewport selalu di 0,0 agar topbar tidak pernah bergeser / terpotong
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  document.body.scrollLeft = 0;
  document.documentElement.scrollLeft = 0;

  if (!S || S.template?.code !== ui.tpl) {
    setSync('busy', 'Memuat…');
    await openSheet();
  } else {
    if (!ui.zoom || ui.zoom < 0.8) setZoom(1.0);
    else setZoom(ui.zoom);
  }

  const stage = $('#stage');
  if (stage) {
    stage.scrollTop = 0;
    stage.scrollLeft = 0;
  }
}

// ------------------------------------------------------------------ stage smooth drag-to-pan
function initStagePanning() {
  const stage = $('#stage');
  if (!stage) return;
  let isDown = false;
  let startX = 0, startY = 0;
  let sLeft = 0, sTop = 0;
  let hasMoved = false;

  stage.addEventListener('mousedown', (e) => {
    // Abaikan jika klik pada kontrol form / input / popover / dialog
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

function showComingSoon(badgeText, titleText, descText) {
  const dlg = $('#dlg-coming-soon');
  if (!dlg) return;
  $('#cs-dlg-badge').textContent = badgeText;
  $('#cs-dlg-title').textContent = titleText;
  $('#cs-dlg-desc').textContent = descText;
  dlg.showModal();
}

function startClock() {
  const update = () => {
    const el = $('#clock-txt');
    if (!el) return;
    const now = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const dName = days[now.getDay()];
    const dDate = now.getDate();
    const dMon = MONTHS[now.getMonth()].slice(0, 3);
    const dYr = now.getFullYear();
    const dHr = String(now.getHours()).padStart(2, '0');
    const dMin = String(now.getMinutes()).padStart(2, '0');
    el.textContent = `${dName}, ${dDate} ${dMon} ${dYr} • ${dHr}:${dMin} WIB`;
  };
  update();
  setInterval(update, 30000);
}

// ------------------------------------------------------------------ event wiring
$('#btn-back-hub')?.addEventListener('click', showPortal);

$('#switch-tpl')?.addEventListener('change', (e) => {
  if (e.target.value) {
    showWorkstation(e.target.value).catch((er) => toast(er.message, 'err'));
  }
});

// 3 Pillar Navigation (Harian, Mingguan, Tahunan)
document.querySelectorAll('.pillar-card').forEach((card) => {
  card.addEventListener('click', () => {
    const freq = card.dataset.freq;
    if (freq === 'daily') {
      showWorkstation(ui.tpl).catch((er) => toast(er.message, 'err'));
    } else if (freq === 'weekly') {
      showComingSoon(
        'MODUL MINGGUAN',
        'Laporan Mingguan Sedang Dipersiapkan',
        'Format checklist rekapitulasi 7-harian, greasing bearing mekanik, dan pembersihan filter sedang distandarisasi bersama tim Maintenance PT. Century Batteries Indonesia. Modul ini akan segera aktif!'
      );
    } else if (freq === 'yearly') {
      showComingSoon(
        'MODUL TAHUNAN / OVERHAUL',
        'Laporan Tahunan Sedang Dipersiapkan',
        'Format audit tahunan komprehensif, evaluasi masa pakai spare part kritis, overhaul besar mesin, dan sertifikasi alat sedang diformulasikan bersama tim Maintenance PT. Century Batteries Indonesia. Modul ini akan segera aktif!'
      );
    }
  });

  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      card.click();
    }
  });
});

$('#btn-open-daily')?.addEventListener('click', (e) => {
  e.stopPropagation();
  showWorkstation(ui.tpl).catch((er) => toast(er.message, 'err'));
});

$('#cs-dlg-close')?.addEventListener('click', () => {
  $('#dlg-coming-soon')?.close();
});

$('#portal-who')?.addEventListener('click', () => askName(false));

const periodChanged = () => { ui.month = Number($('#month').value); ui.year = Number($('#year').value); if (ui.year >= 2000 && ui.year <= 2100) openSheet().catch((er) => toast(er.message, 'err')); };
$('#month').addEventListener('change', periodChanged);
$('#year').addEventListener('change', periodChanged);

function shiftPeriod(delta) {
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

addEventListener('resize', () => {
  document.body.scrollLeft = 0;
  document.documentElement.scrollLeft = 0;
});

function dismissSplash() {
  document.querySelectorAll('#splash').forEach((el) => {
    el.classList.add('done');
    setTimeout(() => { try { el.remove(); } catch {} }, 400);
  });
}

// ------------------------------------------------------------------ boot
(async function boot() {
  const msg = $('#splash-msg');
  // Failsafe: jamin splash tidak pernah hang melebihi 3 detik jika ada kendala
  const watchdog = setTimeout(() => {
    console.warn('Watchdog: splash auto-dismissed');
    dismissSplash();
  }, 3500);

  try {
    const now = new Date();
    ui.year = now.getFullYear(); ui.month = now.getMonth() + 1;
    $('#month').innerHTML = MONTHS.map((m, i) => `<option value="${i + 1}"${i + 1 === ui.month ? ' selected' : ''}>${m}</option>`).join('');
    $('#year').value = ui.year;

    updateActorUI();
    startClock();
    initStagePanning();

    if (msg) msg.textContent = 'Memuat master peralatan…';
    ui.templates = await api.templates();
    if (!ui.templates.length) throw new Error('Belum ada template form. Jalankan: php spark db:seed ChecksheetSeeder');
    if (!ui.templates.some((t) => t.code === ui.tpl)) ui.tpl = ui.templates[0].code;

    // Populate switch-tpl dropdown in workstation
    const sw = $('#switch-tpl');
    if (sw) {
      sw.innerHTML = ui.templates.map((t) => `<option value="${esc(t.code)}">${esc(t.machine_type)} (${esc(t.section || 'Utility')})</option>`).join('');
      sw.value = ui.tpl;
    }

    showPortal();

    clearTimeout(watchdog);
    dismissSplash();
    if (!getActor()) await askName(true);
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
