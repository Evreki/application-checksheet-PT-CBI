// Render murni: state JSON -> string HTML. Tidak menyentuh DOM, sehingga mudah diuji.
export const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
export const ROLE_LABEL = { KASUBSIE: 'Ka.Sub Sie', KASIE: 'Ka.Sie', KADEPT: 'Ka.Dept' };
export const SYMBOLS = [
  { code: 'V', label: 'Tidak ada problem', key: 'v' },
  { code: 'X', label: 'Belum OK / perlu dicek', key: 'x' },
  { code: 'XF', label: 'Problem sudah diperbaiki', key: 'f' },
  { code: 'O', label: 'Penggantian part', key: 'o' },
];
const LEGEND = ['A : ADJUST', 'B : BERSIHKAN', 'C : CHECK', 'T : TAMBAH', 'U : UKUR', 'S : SERVICE'];

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const fmtNum = (n) => (n === null || n === undefined ? '' : String(Math.round(n * 1000) / 1000).replace('.', ','));
export const fmtDT = (s) => {
  if (!s) return '';
  const d = new Date(s.replace(' ', 'T'));
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
export const glyph = (sym) => (sym === 'XF' ? '<span class="rg">X</span>' : esc(sym));
const initials = (n) => esc((n || '').trim().split(/\s+/)[0].slice(0, 4).toUpperCase());

export const outOfLimit = (item, v) => v !== null && v !== undefined && ((item.min !== null && v < item.min) || (item.max !== null && v > item.max));
export const findAp = (S, scope, ref, role) => S.approvals.find((a) => a.scope === scope && a.ref === ref && a.role === role);
const cls = (a) => (a ? (a.status === 'APPROVED' ? 'ok' : 'rej') : '');

export const assetUrl = (path) => {
  let base = window.CS?.baseUrl;
  if (!base) {
    const meta = document.querySelector('meta[name="base-url"]');
    if (meta && meta.content) base = meta.content;
  }
  if (!base) base = './';
  if (!base.endsWith('/')) base += '/';
  return base + String(path || '').replace(/^\//, '');
};

const td = (html = '', { c = 1, r = 1, cl = '', at = '' } = {}) =>
  `<td${c > 1 ? ` colspan="${c}"` : ''}${r > 1 ? ` rowspan="${r}"` : ''}${cl ? ` class="${cl}"` : ''}${at ? ` ${at}` : ''}>${html}</td>`;

function dayMeta(S, d) {
  const { year, month, days_in_month } = S.sheet;
  const dow = new Date(year, month - 1, d).getDay();
  const now = new Date();
  return {
    off: d > days_in_month,
    sun: d <= days_in_month && dow === 0,
    today: now.getFullYear() === year && now.getMonth() + 1 === month && now.getDate() === d,
  };
}

function cellHtml(S, item, d) {
  if (item.calc) {
    const v = S.derived[item.id]?.[d];
    return v === undefined ? '' : `<span class="v" style="margin-top:20px">${fmtNum(v)}</span>`;
  }
  const e = S.entries[item.id]?.[d];
  if (!e) return '';
  const bad = outOfLimit(item, e.value);
  return (e.symbol ? `<span class="g ${esc(e.symbol)}">${glyph(e.symbol)}</span>` : '')
    + (e.value !== null ? `<span class="v${bad ? ' bad' : ''}" ${e.symbol ? '' : 'style="margin-top:20px"'}>${fmtNum(e.value)}</span>` : '');
}

function signBox(S, role, label, colspan = 1) {
  const a = findAp(S, 'DOC', 0, role);
  const body = a
    ? `<b>${a.status === 'APPROVED' ? '✔ Approved' : '✖ Rejected'}</b><span>${esc(a.actor)}</span><span>${fmtDT(a.at)}</span>`
    : '<span style="color:#999">menunggu</span>';
  return td(`<div class="box">${body}</div><div class="lbl">${label}</div>`, { c: colspan, cl: `sign ${cls(a)}`, at: `data-sign="${role}" title="Klik untuk approve / reject"` });
}

// ------------------------------------------------------------------ 1. Standard Sheet (Cooling Tower & Scrubber)
function renderStandardSheet(S, extraRows = 0) {
  const { sheet: sh, template: T } = S;
  const items = T.items;
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const locked = new Set(sh.locked_days);
  const widths = [40, 34, 220, 150, 160, 110, 80, 70, ...Array(31).fill(36), 100, 90];
  const out = [];

  out.push(`<table class="cs"><colgroup>${widths.map((w) => `<col style="width:${w}px">`).join('')}</colgroup><tbody>`);

  // Kop form
  out.push(`<tr style="height:84px">
    ${td(`<img src="${esc(window.CS?.logo || '')}" alt="CBI">`, { c: 2, cl: 'logo-cell med' })}
    ${td(esc(window.CS?.company || '').replace('PT. ', 'PT. <br>'), { cl: 'co' })}
    ${td('LEMBAR HASIL INSPEKSI HARIAN', { c: 5, cl: 'title' })}
    ${td(`<table><tr><td class="l">Dept</td><td colspan="2">: <b>${esc(T.department)}</b></td><td class="rl">No. Form</td><td>: ${esc(T.form_no)}</td></tr>
      <tr><td class="l">Seksi</td><td colspan="2">: <b>${esc(T.section)}</b></td><td class="rl">Revisi</td><td>: ${esc(T.revision)}</td></tr>
      <tr><td class="l">No. Alat</td><td colspan="2">: <input data-hdr="equipment_no" value="${esc(sh.equipment_no)}" placeholder="isi no. alat" maxlength="100"></td><td class="rl">Tgl.</td><td>: <input type="date" data-hdr="form_date" value="${esc(sh.form_date)}"></td></tr>
      <tr><td class="l">M/C Type</td><td colspan="2">: <b>${esc(T.machine_type)}</b></td><td class="rl">Page</td><td>: <b>${esc(T.page_info)}</b></td></tr></table>`, { c: 28, cl: 'meta' })}
    ${signBox(S, 'KADEPT', 'Ka.Dept', 3)}${signBox(S, 'KASIE', 'Ka.Sie')}${signBox(S, 'KASUBSIE', 'Ka.Sub Sie')}
  </tr>`);

  // Judul kolom
  out.push(`<tr style="height:22px">${['UNIT', 'NO', 'BAGIAN PERALATAN', 'ITEM INSPEKSI', 'STANDART', 'PERIODE', 'JENIS INST.'].map((h) => td(h, { r: 3, cl: 'hd med' })).join('')}
    ${td(`HASIL PEMERIKSAAN TAHUN <u>&nbsp;${sh.year}&nbsp;</u>`, { c: 32, cl: 'hd' })}${td('KETERANGAN', { c: 2, r: 3, cl: 'hd med' })}</tr>`);
  out.push(`<tr style="height:22px">${td(`BULAN : <b>${esc((MONTHS[sh.month - 1] || '').toUpperCase())}</b>`, { c: 32, cl: 'mono b', at: 'style="font-size:12px"' })}</tr>`);
  out.push(`<tr style="height:24px">${td('Shift', { cl: 'hd' })}${days.map((d) => {
    const m = dayMeta(S, d);
    const a = findAp(S, 'DAY', d, 'KASUBSIE');
    const k = ['dayh', m.off ? 'off' : '', m.sun ? 'sun' : '', m.today ? 'today' : '', cls(a)].filter(Boolean).join(' ');
    const tip = m.off ? 'Tidak ada pada bulan ini' : a ? `${a.status === 'APPROVED' ? 'Approved' : 'Rejected'} oleh ${a.actor}` : 'Klik: review hari ini';
    return td(d, { cl: k, at: m.off ? '' : `data-day="${d}" title="${esc(tip)}"` });
  }).join('')}</tr>`);
  out.push(`<tr>${td('TABLE DAILY CHECK', { c: 41, cl: 'sect' })}</tr>`);

  // Item inspeksi
  items.forEach((it, idx) => {
    const rm = S.remarks[it.id] || '';
    out.push(`<tr class="item">
      ${idx === 0 ? td('', { r: items.length, cl: 'unitcol' }) : ''}
      ${td(it.no, { cl: 'c t' })}${td(esc(it.part), { cl: 't' })}${td(esc(it.method), { cl: 't' })}${td(esc(it.standard || ''), { cl: 't' })}
      ${td(esc(it.period), { cl: 'c t' })}${td(esc(it.inst || ''), { cl: 'c t' })}${td(esc(it.mark), { cl: 'c t' })}
      ${days.map((d) => {
        const m = dayMeta(S, d);
        const e = S.entries[it.id]?.[d];
        const k = ['day', m.off ? 'off' : '', m.sun ? 'sun' : '', locked.has(d) || sh.finalized ? 'locked' : '', it.calc ? 'calc' : '',
          e && outOfLimit(it, e.value) ? 'bad' : '', e?.note ? 'hasnote' : ''].filter(Boolean).join(' ');
        return td(cellHtml(S, it, d), { cl: k, at: m.off ? '' : `data-item="${it.id}" data-day="${d}" tabindex="0"${e?.note ? ` title="${esc(e.note)}"` : ''}` });
      }).join('')}
      ${td(`<input class="cell" data-remark="${it.id}" value="${esc(rm)}" maxlength="500" ${sh.finalized ? 'disabled' : ''}>`, { c: 2 })}
    </tr>`);
  });

  // Footer: PIC / KaSubSie / Kasie / legenda
  renderFooterStandard(out, S);

  // Temuan Problem
  renderFindings(out, S, extraRows, 41);

  out.push('</tbody></table>');
  return out.join('');
}

// ------------------------------------------------------------------ 2. Chiller Daily & Weekly (CHILLER_D)
function renderChillerDailyWeeklySheet(S, extraRows = 0) {
  const { sheet: sh, template: T } = S;
  const items = T.items;
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const locked = new Set(sh.locked_days);
  const widths = [44, 30, 200, 130, 85, 65, 42, ...Array(31).fill(30), 85, 85];
  const out = [];

  const dailyItems = items.filter((it) => it.item_no <= 6 || (it.period && (it.period.includes('day') || it.period.includes('Hari'))));
  const weeklyItems = items.filter((it) => it.item_no > 6 || (it.period && (it.period.includes('Week') || it.period.includes('Minggu'))));

  out.push(`<table class="cs"><colgroup>${widths.map((w) => `<col style="width:${w}px">`).join('')}</colgroup><tbody>`);

  // Kop form
  out.push(`<tr style="height:84px">
    ${td(`<img src="${esc(window.CS?.logo || '')}" alt="CBI">`, { c: 2, cl: 'logo-cell med' })}
    ${td(esc(window.CS?.company || '').replace('PT. ', 'PT. <br>'), { cl: 'co' })}
    ${td('LEMBAR HASIL INSPEKSI HARIAN DAN MINGGUAN', { c: 5, cl: 'title' })}
    ${td(`<table><tr><td class="l">Dept</td><td colspan="2">: <b>${esc(T.department)}</b></td><td class="rl">No. Form</td><td>: ${esc(T.form_no)}</td></tr>
      <tr><td class="l">Seksi</td><td colspan="2">: <b>${esc(T.section)}</b></td><td class="rl">Revisi</td><td>: ${esc(T.revision)}</td></tr>
      <tr><td class="l">No. Alat</td><td colspan="2">: <input data-hdr="equipment_no" value="${esc(sh.equipment_no)}" placeholder="isi no. alat" maxlength="100"></td><td class="rl">Tgl.</td><td>: <input type="date" data-hdr="form_date" value="${esc(sh.form_date)}"></td></tr>
      <tr><td class="l">M/C Type</td><td colspan="2">: <b>${esc(T.machine_type)}</b></td><td class="rl">Page</td><td>: <b>${esc(T.page_info)}</b></td></tr></table>`, { c: 27, cl: 'meta' })}
    ${signBox(S, 'KADEPT', 'Ka.Dept', 3)}${signBox(S, 'KASIE', 'Ka.Sie', 1)}${signBox(S, 'KASUBSIE', 'Ka.Sub Sie', 1)}
  </tr>`);

  // Judul kolom
  out.push(`<tr style="height:22px">${['UNIT', 'NO', 'BAGIAN PERALATAN', 'ITEM INSPEKSI', 'PERIODE', 'JENIS INST.'].map((h) => td(h, { r: 3, cl: 'hd med' })).join('')}
    ${td(`HASIL PEMERIKSAAN TAHUN <u>&nbsp;${sh.year}&nbsp;</u>`, { c: 32, cl: 'hd' })}${td('KETERANGAN', { c: 2, r: 3, cl: 'hd med' })}</tr>`);
  out.push(`<tr style="height:22px">${td(`BULAN : <b>${esc((MONTHS[sh.month - 1] || '').toUpperCase())}</b>`, { c: 32, cl: 'mono b', at: 'style="font-size:12px"' })}</tr>`);
  out.push(`<tr style="height:24px">${td('Shift', { cl: 'hd' })}${days.map((d) => {
    const m = dayMeta(S, d);
    const a = findAp(S, 'DAY', d, 'KASUBSIE');
    const k = ['dayh', m.off ? 'off' : '', m.sun ? 'sun' : '', m.today ? 'today' : '', cls(a)].filter(Boolean).join(' ');
    const tip = m.off ? 'Tidak ada pada bulan ini' : a ? `${a.status === 'APPROVED' ? 'Approved' : 'Rejected'} oleh ${a.actor}` : 'Klik: review hari ini';
    return td(d, { cl: k, at: m.off ? '' : `data-day="${d}" title="${esc(tip)}"` });
  }).join('')}</tr>`);

  // --- 1. TABLE DAILY CHECK ---
  out.push(`<tr>${td('TABLE DAILY CHECK', { c: 40, cl: 'sect' })}</tr>`);
  dailyItems.forEach((it, idx) => {
    const rm = S.remarks[it.id] !== undefined ? S.remarks[it.id] : (it.standard || '');
    out.push(`<tr class="item">
      ${idx === 0 ? td(esc(T.machine_type || 'CHILLER LSBLG250'), { r: dailyItems.length, cl: 'unit-v' }) : ''}
      ${td(it.no, { cl: 'c t' })}${td(esc(it.part), { cl: 't b' })}${td(esc(it.method), { cl: 'c t' })}
      ${td(esc(it.period), { cl: 'c t' })}${td(esc(it.inst || ''), { cl: 'c t' })}${td('I', { cl: 'c t b' })}
      ${days.map((d) => {
        const m = dayMeta(S, d);
        const e = S.entries[it.id]?.[d];
        const k = ['day', m.off ? 'off' : '', m.sun ? 'sun' : '', locked.has(d) || sh.finalized ? 'locked' : '', it.calc ? 'calc' : '',
          e && outOfLimit(it, e.value) ? 'bad' : '', e?.note ? 'hasnote' : ''].filter(Boolean).join(' ');
        return td(cellHtml(S, it, d), { cl: k, at: m.off ? '' : `data-item="${it.id}" data-day="${d}" tabindex="0"${e?.note ? ` title="${esc(e.note)}"` : ''}` });
      }).join('')}
      ${td(`<input class="cell" data-remark="${it.id}" value="${esc(rm)}" placeholder="isi keterangan..." maxlength="500" ${sh.finalized ? 'disabled' : ''}>`, { c: 2, cl: 't' })}
    </tr>`);
  });

  // --- 2. TABLE WEEKLY PREVENTIVE ---
  out.push(`<tr style="height:24px">
    ${td('TABLE WEEKLY PREVENTIVE', { c: 7, cl: 'sect b', at: 'style="padding-left:6px"' })}
    ${td('1', { c: 8, cl: 'hd b', at: 'style="background:#fff;font-size:12px"' })}
    ${td('2', { c: 8, cl: 'hd b', at: 'style="background:#fff;font-size:12px"' })}
    ${td('3', { c: 8, cl: 'hd b', at: 'style="background:#fff;font-size:12px"' })}
    ${td('4', { c: 7, cl: 'hd b', at: 'style="background:#fff;font-size:12px"' })}
    ${td('', { c: 2, cl: 'hd' })}
  </tr>`);

  const totalWeeklyRows = 8;
  for (let idx = 0; idx < totalWeeklyRows; idx++) {
    const it = weeklyItems[idx];
    const isBlank = !it;
    const isLast = idx === totalWeeklyRows - 1;
    const rowClass = `item dashed-row${isLast ? ' last-dashed' : ''}`;
    const rm = it ? (S.remarks[it.id] !== undefined ? S.remarks[it.id] : (it.standard || '')) : '';

    const dayCells = days.map((d) => {
      if (isBlank) return td('', { cl: 'day' });
      const m = dayMeta(S, d);
      const e = S.entries[it.id]?.[d];
      const k = ['day', m.off ? 'off' : '', m.sun ? 'sun' : '', locked.has(d) || sh.finalized ? 'locked' : '', it.calc ? 'calc' : '',
        e && outOfLimit(it, e.value) ? 'bad' : '', e?.note ? 'hasnote' : ''].filter(Boolean).join(' ');
      return td(cellHtml(S, it, d), { cl: k, at: m.off ? '' : `data-item="${it.id}" data-day="${d}" tabindex="0"${e?.note ? ` title="${esc(e.note)}"` : ''}` });
    }).join('');

    out.push(`<tr class="${rowClass}">
      ${idx === 0 ? td(esc(T.machine_type || 'CHILLER LSBLG250'), { r: totalWeeklyRows, cl: 'unit-v' }) : ''}
      ${td(isBlank ? '' : (idx + 1), { cl: 'c t' })}
      ${td(isBlank ? '' : esc(it.part), { cl: 't b' })}
      ${td(isBlank ? '' : esc(it.method), { cl: 'c t' })}
      ${td(isBlank ? '' : esc(it.period), { cl: 'c t' })}
      ${td(isBlank ? '' : esc(it.inst || ''), { cl: 'c t' })}
      ${td(isBlank ? '' : 'I', { cl: 'c t b' })}
      ${dayCells}
      ${td(isBlank ? '' : `<input class="cell" data-remark="${it.id}" value="${esc(rm)}" placeholder="isi keterangan..." maxlength="500" ${sh.finalized ? 'disabled' : ''}>`, { c: 2, cl: 't' })}
    </tr>`);
  }

  // Footer: Service Hours box, Simbol, PIC, Kasub, Kasie, Sirkulasi, Temuan Problem
  renderFooterChiller(out, S, days);
  renderFindings(out, S, extraRows, 40);

  out.push('</tbody></table>');
  return out.join('');
}

// ------------------------------------------------------------------ 3. Chiller Monthly & Periodic (CHILLER_M)
function renderChillerMonthlySheet(S, extraRows = 0) {
  const { sheet: sh, template: T } = S;
  const items = T.items;
  const widths = [44, 32, 220, 130, 90, 65, ...Array(12).fill(72), 72, 72];
  const out = [];

  out.push(`<table class="cs"><colgroup>${widths.map((w) => `<col style="width:${w}px">`).join('')}</colgroup><tbody>`);

  // Kop form (Sesuai foto 1: LEMBAR HASIL INSPEKSI DAN MAINTENANCE)
  out.push(`<tr style="height:84px">
    ${td(`<img src="${esc(window.CS?.logo || '')}" alt="CBI">`, { c: 2, cl: 'logo-cell med' })}
    ${td(esc(window.CS?.company || '').replace('PT. ', 'PT. <br>'), { cl: 'co' })}
    ${td('LEMBAR HASIL INSPEKSI DAN MAINTENANCE', { c: 4, cl: 'title' })}
    ${td(`<table><tr><td class="l">Dept</td><td colspan="2">: <b>${esc(T.department)}</b></td><td class="rl">No. Form</td><td>: ${esc(T.form_no)}</td></tr>
      <tr><td class="l">Seksi</td><td colspan="2">: <b>${esc(T.section)}</b></td><td class="rl">Revisi</td><td>: ${esc(T.revision)}</td></tr>
      <tr><td class="l">No. Alat</td><td colspan="2">: <input data-hdr="equipment_no" value="${esc(sh.equipment_no)}" placeholder="isi no. alat" maxlength="100"></td><td class="rl">Tgl.</td><td>: <input type="date" data-hdr="form_date" value="${esc(sh.form_date)}"></td></tr>
      <tr><td class="l">M/C Type</td><td colspan="2">: <b>${esc(T.machine_type)}</b></td><td class="rl">Page</td><td>: <b>${esc(T.page_info)}</b></td></tr></table>`, { c: 10, cl: 'meta' })}
    ${signBox(S, 'KADEPT', 'Ka.Dept')}${signBox(S, 'KASIE', 'Ka.Sie')}${signBox(S, 'KASUBSIE', 'Ka.Sub Sie')}
  </tr>`);

  // Judul kolom
  out.push(`<tr style="height:22px">${['UNIT', 'NO', 'BAGIAN PERALATAN', 'ITEM INSPEKSI', 'PERIODE', 'JENIS INST.'].map((h) => td(h, { r: 3, cl: 'hd med' })).join('')}
    ${td(`HASIL PEMERIKSAAN TAHUN <u>&nbsp;${sh.year}&nbsp;</u>`, { c: 12, cl: 'hd' })}${td('KETERANGAN', { c: 2, r: 3, cl: 'hd med' })}</tr>`);
  out.push(`<tr style="height:22px">${Array.from({ length: 12 }, (_, i) => td(String(i + 1), { cl: 'hd b', at: 'style="background:#f1f5f9;font-size:12px"' })).join('')}</tr>`);
  out.push(`<tr style="height:22px">${Array.from({ length: 12 }, () => td('tgl', { cl: 'mono c', at: 'style="font-size:11px;color:#64748b"' })).join('')}</tr>`);

  out.push(`<tr>${td('TABLE', { c: 20, cl: 'sect' })}</tr>`);

  items.forEach((it, idx) => {
    const rm = S.remarks[it.id] !== undefined ? S.remarks[it.id] : (it.standard || '');
    out.push(`<tr class="item">
      ${idx === 0 ? td(esc(T.machine_type || 'CHILLER LSBLG250'), { r: items.length, cl: 'unit-v' }) : ''}
      ${td(it.no, { cl: 'c t' })}${td(esc(it.part), { cl: 't b' })}${td(esc(it.method), { cl: 't' })}
      ${td(esc(it.period), { cl: 'c t' })}${td(esc(it.inst || ''), { cl: 'c t' })}
      ${Array.from({ length: 12 }, (_, i) => {
        const m = i + 1;
        const e = S.entries[it.id]?.[m];
        const bad = outOfLimit(it, e?.value);
        return td(cellHtml(S, it, m), {
          cl: `day month-cell${e && bad ? ' bad' : ''}`,
          at: `data-item="${it.id}" data-day="${m}" tabindex="0" title="Bulan ${MONTHS[i]}"`,
        });
      }).join('')}
      ${td(`<input class="cell" data-remark="${it.id}" value="${esc(rm)}" placeholder="isi keterangan..." maxlength="500" ${sh.finalized ? 'disabled' : ''}>`, { c: 2, cl: 't' })}
    </tr>`);
  });

  // Footer Bulanan Chiller
  renderFooterMonthly(out, S);

  out.push('</tbody></table>');
  return out.join('');
}

// ------------------------------------------------------------------ 4. Chiller Standard Preventive Machine (CHILLER_S)
function renderChillerStandardSheet(S) {
  const { sheet: sh, template: T } = S;
  const items = T.items;
  // 12 columns total:
  // Col 1-2: Photo panel (width 190 + 190 = 380px)
  // Col 3: UNIT (width 40px)
  // Col 4: NO (width 35px)
  // Col 5: ITEM CHECK (width 155px)
  // Col 6: CONTENTS (width 95px)
  // Col 7: Frek (width 75px)
  // Col 8: Act (width 40px)
  // Col 9-10: STANDARD (width 125 + 125 = 250px)
  // Col 11: DOCUMENT (width 90px)
  // Col 12: SAFETY STD (width 90px)
  const widths = [190, 190, 40, 35, 155, 95, 75, 40, 125, 125, 90, 90];
  const out = [];

  out.push(`<table class="cs"><colgroup>${widths.map((w) => `<col style="width:${w}px">`).join('')}</colgroup><tbody>`);

  // Row 1: Header Kop (spans all 12 columns)
  out.push(`<tr style="height:84px">
    ${td(`<div style="display:flex;align-items:center;justify-content:center;gap:8px;">
      <img src="${esc(window.CS?.logo || '')}" alt="CBI" style="max-height:48px;">
      <div style="font-size:11px;font-weight:700;color:#0f172a;line-height:1.2;text-align:left;">PT. Century Batteries<br>Indonesia</div>
    </div>`, { c: 2, cl: 'logo-cell med' })}
    ${td('STANDARD<br>PREVENTIVE MACHINE', { c: 2, cl: 'title', at: 'style="font-size:16px;font-weight:800;letter-spacing:0.5px;"' })}
    ${td(`<table>
      <tr><td class="l">Dept.</td><td>: <b>${esc(T.department || 'PLANT SERVICE')}</b></td></tr>
      <tr><td class="l">Seksi</td><td>: <b>${esc(T.section || 'WET CHARGING')}</b></td></tr>
      <tr><td class="l">M/C type</td><td>: <b>${esc(T.machine_type || 'CHILLER LSBLG250')}</b></td></tr>
    </table>`, { c: 2, cl: 'meta' })}
    ${td(esc(T.machine_type || 'CHILLER LSBLG250'), { cl: 'c b', at: 'style="font-size:13px;background:#f8fafc;vertical-align:middle;padding:4px;"' })}
    ${td(`<table>
      <tr><td class="l">No Form</td><td>: <b>${esc(T.form_no || 'Form-PLS-MTC-D04')}</b></td></tr>
      <tr><td class="l">Revisi</td><td>: <b>${esc(T.revision || '0')}</b></td></tr>
      <tr><td class="l">Page</td><td>: <b>${esc(T.page_info || '1 dari 1')}</b></td></tr>
    </table>`, { c: 2, cl: 'meta' })}
    ${signBox(S, 'KADEPT', 'Ka.Dept PLS')}
    ${signBox(S, 'KASIE', 'Ka.Sie Eng')}
    ${signBox(S, 'KASUBSIE', 'Ka.Sie PLS')}
  </tr>`);

  // Row 2: Header Kolom Table & Left Photo Panel
  // Photo panel spans 31 rows (1 header + 19 items + 11 empty rows = 31 rows)
  out.push(`<tr style="height:28px">
    ${td(`<div class="std-photo-panel" style="display:flex;flex-direction:column;gap:6px;">
      <div style="font-weight:700;font-size:11px;color:#1e293b;text-align:center;padding:3px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:3px;">
        LAYOUT &amp; FOTO KOMPONEN CHILLER LSBLG250
      </div>
      <div style="border:1px solid #000;border-radius:3px;overflow:hidden;background:#fff;cursor:zoom-in;" class="chiller-photo-wrap" title="Klik untuk memperbesar foto">
        <img src="${esc(window.CS?.chillerPhoto || assetUrl('assets/img/chiller/std_photos.png'))}" alt="Layout Chiller LSBLG250" style="width:100%;height:auto;display:block;">
      </div>
      <div style="font-size:10px;color:#475569;line-height:1.4;padding:4px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:3px;">
        <b>Keterangan Nomor Foto:</b><br>
        ① Panel Kontrol &bull; ② Filter Core Dryer &bull; ③ Solenoid Valve &bull; ④ Expansion Valve &bull; ⑤ Motor Pump &bull; ⑥ Valve In/Out &bull; ⑦ Kondensor &bull; ⑧ Evaporator &bull; ⑨ Cooling Tower &bull; ⑩ Dual Pressure Gauge &bull; ⑪ Flow Switch
      </div>
    </div>`, { c: 2, r: 31, at: 'style="vertical-align:top;width:380px;padding:6px;background:#fff;border-right:2px solid #000;"' })}
    ${td('UNIT', { cl: 'hd med' })}
    ${td('ITEM CHECK', { c: 2, cl: 'hd med' })}
    ${td('CONTENTS', { cl: 'hd med' })}
    ${td('Frek', { cl: 'hd med' })}
    ${td('Act', { cl: 'hd med' })}
    ${td('STANDARD', { c: 2, cl: 'hd med' })}
    ${td('DOCUMENT', { cl: 'hd med' })}
    ${td('SAFETY STD', { cl: 'hd med' })}
  </tr>`);

  // Item Display Mapping (16 physical numbered items across 19 rows)
  const displayMap = {
    1: { num: 1, span: 1 },
    2: { num: 2, span: 1 },
    3: { num: 3, span: 2 },
    4: { skipHeader: true },
    5: { num: 4, span: 1 },
    6: { num: 5, span: 1 },
    7: { num: 6, span: 1 },
    8: { num: 7, span: 1 },
    9: { num: 8, span: 1 },
    10: { num: 9, span: 1 },
    11: { num: 10, span: 2 },
    12: { skipHeader: true },
    13: { num: 11, span: 1 },
    14: { num: 12, span: 1 },
    15: { num: 13, span: 2 },
    16: { skipHeader: true },
    17: { num: 14, span: 1 },
    18: { num: 15, span: 1 },
    19: { num: 16, span: 1 },
  };

  items.forEach((it, idx) => {
    const dInfo = displayMap[it.no] || { num: it.no, span: 1 };
    out.push(`<tr class="item" style="height:24px">
      ${idx === 0 ? td('A. CHILLER LSBLG250', { r: 30, cl: 'unit-v', at: 'style="font-weight:700;letter-spacing:2px;background:#f8fafc;text-align:center;"' }) : ''}
      ${!dInfo.skipHeader ? td(dInfo.num, { r: dInfo.span, cl: 'c t b' }) : ''}
      ${!dInfo.skipHeader ? td(esc(it.part), { r: dInfo.span, cl: 't b' }) : ''}
      ${td(esc(it.method), { cl: 't' })}
      ${td(esc(it.period), { cl: 'c t' })}
      ${td(esc(it.inst || ''), { cl: 'c t b' })}
      ${td(esc(it.standard || ''), { c: 2, cl: 't' })}
      ${td('Check Sheet', { cl: 'c t' })}
      ${td('M/C OFF', { cl: 'c t b', at: 'style="color:#b91c1c;"' })}
    </tr>`);
  });

  // Empty rows to match document grid (11 rows)
  for (let r = 0; r < 11; r++) {
    out.push(`<tr class="dashed-row" style="height:22px">
      ${td('', { cl: 'c' })}
      ${td('', { cl: 't' })}
      ${td('', { cl: 't' })}
      ${td('', { cl: 'c' })}
      ${td('', { cl: 'c' })}
      ${td('', { c: 2, cl: 't' })}
      ${td('', { cl: 'c' })}
      ${td('', { cl: 'c' })}
    </tr>`);
  }

  // Row 32: Catatan Service & Tugas Legend (spans columns 3-12, total 10 columns)
  out.push(`<tr style="height:100px">
    ${td(`<div>
      <div style="font-weight:700;font-size:11px;margin-bottom:4px;color:#0f172a;">Catatan</div>
      <div style="border:1px solid #000;padding:8px 12px;background:#f8fafc;font-size:11px;line-height:1.6;">
        <div style="font-weight:700;text-decoration:underline;margin-bottom:4px;color:#0f172a;">CATATAN SERVICE :</div>
        <div style="font-weight:600;">1/ 4 Bln &nbsp;:&nbsp; 4000 jam</div>
        <div style="font-weight:600;">1/6 Bln &nbsp;:&nbsp; 8000 jam</div>
        <div style="font-weight:600;">1/1 Thn &nbsp;:&nbsp; 12000 jam</div>
      </div>
    </div>`, { c: 4, at: 'style="vertical-align:top;padding:6px;"' })}
    ${td(`<div>
      <div style="font-weight:700;font-size:11px;margin-bottom:4px;color:#0f172a;">Tugas</div>
      <table style="width:100%;font-size:11px;border-collapse:collapse;border:none;">
        <tr style="height:20px;">
          <td style="border:none;padding:2px 6px;"><b>A</b> &nbsp; Adjust/setting</td>
          <td style="border:none;padding:2px 6px;"><b>K</b> &nbsp; Kencangkan</td>
        </tr>
        <tr style="height:20px;">
          <td style="border:none;padding:2px 6px;"><b>B</b> &nbsp; Bersihkan</td>
          <td style="border:none;padding:2px 6px;"><b>S</b> &nbsp; Service</td>
        </tr>
        <tr style="height:20px;">
          <td style="border:none;padding:2px 6px;"><b>C</b> &nbsp; Cek/Periksa</td>
          <td style="border:none;padding:2px 6px;"><b>T</b> &nbsp; Tambah</td>
        </tr>
        <tr style="height:20px;">
          <td style="border:none;padding:2px 6px;"><b>G</b> &nbsp; Ganti</td>
          <td style="border:none;padding:2px 6px;"><b>U</b> &nbsp; Ukur</td>
        </tr>
      </table>
    </div>`, { c: 6, at: 'style="vertical-align:top;padding:6px;"' })}
  </tr>`);

  out.push('</tbody></table>');
  return out.join('');
}

// ------------------------------------------------------------------ 5. Air Dryer Standard Preventive Machine (AD_S)
function renderAirDryerStandardSheet(S) {
  const { sheet: sh, template: T } = S;
  const widths = [190, 190, 40, 35, 165, 95, 75, 40, 125, 125, 90, 90];
  const out = [];

  out.push(`<table class="cs"><colgroup>${widths.map((w) => `<col style="width:${w}px">`).join('')}</colgroup><tbody>`);

  // Row 1: Header Kop Form-PLS-MTC-D04 (spans 12 columns)
  out.push(`<tr style="height:84px">
    ${td(`<div style="display:flex;align-items:center;justify-content:center;gap:8px;">
      <img src="${esc(window.CS?.logo || '')}" alt="CBI" style="max-height:48px;">
      <div style="font-size:11px;font-weight:700;color:#0f172a;line-height:1.2;text-align:left;">PT. Century Batteries<br>Indonesia</div>
    </div>`, { c: 2, cl: 'logo-cell med' })}
    ${td('STANDARD<br>PREVENTIVE MACHINE', { c: 2, cl: 'title', at: 'style="font-size:16px;font-weight:800;letter-spacing:0.5px;"' })}
    ${td(`<table>
      <tr><td class="l">Dept.</td><td>: <b>${esc(T.department || 'PLANT SERVICE')}</b></td></tr>
      <tr><td class="l">Seksi</td><td>: <b>${esc(T.section || 'MAINTENANCE')}</b></td></tr>
      <tr><td class="l">M/C type</td><td>: <b>${esc(T.machine_type || 'AIR DRYER FRIULAIR ACT55/80')}</b></td></tr>
    </table>`, { c: 2, cl: 'meta' })}
    ${td('AIR DRYER FRIULAIR ACT 55', { cl: 'c b', at: 'style="font-size:13px;background:#f8fafc;vertical-align:middle;padding:4px;font-weight:700;"' })}
    ${td(`<table>
      <tr><td class="l">No Form</td><td>: <b>${esc(T.form_no || 'Form-PLS-MTC-D04')}</b></td></tr>
      <tr><td class="l">Revisi</td><td>: <b>${esc(T.revision || '0')}</b></td></tr>
      <tr><td class="l">Page</td><td>: <b>${esc(T.page_info || '1 dari 1')}</b></td></tr>
    </table>`, { c: 2, cl: 'meta' })}
    ${signBox(S, 'KADEPT', 'Ka.Dept PLS')}
    ${signBox(S, 'KASIE', 'Ka.Sie PLS')}
    ${signBox(S, 'KASUBSIE', 'Staff')}
  </tr>`);

  // Row 2: Table Header & Left Photo Panel (Layout Friulair ACT 55 + FTX/FTS)
  // Left Photo Panel spans 28 rows
  out.push(`<tr style="height:28px">
    ${td(`<div class="std-photo-panel" style="display:flex;flex-direction:column;gap:10px;">
      <!-- Judul Panel -->
      <div style="font-weight:700;font-size:12px;color:#1e293b;text-align:center;padding:5px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:4px;letter-spacing:0.5px;">
        LAYOUT &amp; FOTO STANDAR PREVENTIVE AIR DRYER ACT 55
      </div>

      <!-- 1. Diagram Master Utuh Form-PLS-MTC-D04 -->
      <div style="border:1.5px solid #0f172a;border-radius:4px;overflow:hidden;background:#fff;padding:6px;box-shadow:0 1px 3px rgba(0,0,0,0.08);" title="Diagram Master SOP Form-PLS-MTC-D04">
        <div style="font-size:10.5px;font-weight:700;color:#0f172a;margin-bottom:4px;display:flex;align-items:center;justify-content:space-between;">
          <span>📐 Diagram Acuan (Callout C.4, A.7, C.2 &amp; FTX/FTS)</span>
          <span style="font-size:9.5px;color:#64748b;font-weight:normal;">Form-PLS-MTC-D04</span>
        </div>
        <img src="${esc(assetUrl('assets/img/air_dryer/std_air_dryer_diagram.png'))}" alt="Diagram Master Air Dryer ACT 55" style="width:100%;height:auto;display:block;margin:0 auto;border:1px solid #e2e8f0;border-radius:3px;">
      </div>

      <!-- 2. Galeri Foto Fisik Asli Komponen (Unit & Filter Cartridge) -->
      <div style="border:1px solid #cbd5e1;border-radius:4px;background:#fff;padding:8px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        <div style="font-size:10.5px;font-weight:700;color:#0f172a;margin-bottom:6px;">
          📷 Foto Fisik Mesin &amp; Filter Cartridge (Friulair)
        </div>
        
        <!-- Grid 2x2 Foto Komponen -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px;">
          <!-- Foto 1: ACT 55 Front -->
          <div style="border:1px solid #e2e8f0;border-radius:3px;padding:4px;text-align:center;background:#f8fafc;">
            <img src="${esc(assetUrl('assets/img/air_dryer/act55_front.jpg'))}" alt="Air Dryer ACT 55" style="height:90px;max-width:100%;object-fit:contain;margin:0 auto;display:block;">
            <div style="font-size:9.5px;font-weight:700;color:#1e293b;margin-top:3px;">Unit ACT 55</div>
            <div style="font-size:8.5px;color:#64748b;">(Body &amp; Dew Point)</div>
          </div>

          <!-- Foto 2: ACT 360 Cutaway -->
          <div style="border:1px solid #e2e8f0;border-radius:3px;padding:4px;text-align:center;background:#f8fafc;">
            <img src="${esc(assetUrl('assets/img/air_dryer/act360_cutaway.jpg'))}" alt="ACT Internal Cutaway" style="height:90px;max-width:100%;object-fit:contain;margin:0 auto;display:block;">
            <div style="font-size:9.5px;font-weight:700;color:#1e293b;margin-top:3px;">Internal Mesin</div>
            <div style="font-size:8.5px;color:#64748b;">(Kondensor &amp; Kompresor)</div>
          </div>

          <!-- Foto 3: Filter FTX -->
          <div style="border:1px solid #e2e8f0;border-radius:3px;padding:4px;text-align:center;background:#f8fafc;">
            <img src="${esc(assetUrl('assets/img/air_dryer/filter_ftx.jpg'))}" alt="Filter Cartridge FTX" style="height:90px;max-width:100%;object-fit:contain;margin:0 auto;display:block;">
            <div style="font-size:9.5px;font-weight:700;color:#1e293b;margin-top:3px;">Pre-Filter FTX</div>
            <div style="font-size:8.5px;color:#64748b;">(Inlet Air Dryer)</div>
          </div>

          <!-- Foto 4: Filter FTS -->
          <div style="border:1px solid #e2e8f0;border-radius:3px;padding:4px;text-align:center;background:#f8fafc;">
            <img src="${esc(assetUrl('assets/img/air_dryer/filter_fts.jpg'))}" alt="Filter Cartridge FTS" style="height:90px;max-width:100%;object-fit:contain;margin:0 auto;display:block;">
            <div style="font-size:9.5px;font-weight:700;color:#1e293b;margin-top:3px;">After-Filter FTS</div>
            <div style="font-size:8.5px;color:#64748b;">(Outlet Air Dryer)</div>
          </div>
        </div>
      </div>

      <!-- 3. Keterangan Callout & Standar Tugas -->
      <div style="font-size:10px;color:#334155;line-height:1.5;padding:6px 8px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:3px;">
        <b>Keterangan Callout Diagram Acuan:</b><br>
        &bull; <b>C.4</b> : Indikator Dew Point (Monitor panel depan)<br>
        &bull; <b>A.7</b> : Filter Kondensor (Pembersihan kisi bawah mingguan)<br>
        &bull; <b>C.2</b> : Kompresor Refrigerasi (Suhu kerja 70-100°C)<br>
        &bull; <b>FTX / FTS</b> : Filter Cartridge (Pembersihan 1x/mgg, Ganti 1x/6 bln)
      </div>
    </div>`, { c: 2, r: 28, at: 'style="vertical-align:top;width:380px;padding:6px;background:#fff;border-right:2px solid #000;"' })}
    ${td('UNIT', { cl: 'hd med' })}
    ${td('ITEM CHECK', { c: 2, cl: 'hd med' })}
    ${td('CONTENTS', { cl: 'hd med' })}
    ${td('Frek', { cl: 'hd med' })}
    ${td('Act', { cl: 'hd med' })}
    ${td('STANDARD', { c: 2, cl: 'hd med' })}
    ${td('DOCUMENT', { cl: 'hd med' })}
    ${td('SAFETY STD', { cl: 'hd med' })}
  </tr>`);

  // Row 3: Subheader A.GENERAL MAINTENACE
  out.push(`<tr style="height:24px">
    ${td('AIR DYER ACT 55', { r: 26, cl: 'unit-v', at: 'style="font-weight:700;letter-spacing:2px;background:#f8fafc;text-align:center;"' })}
    ${td('A.GENERAL MAINTENACE', { c: 9, cl: 'b sect', at: 'style="font-weight:700;letter-spacing:1px;background:#f8fafc;padding-left:8px;"' })}
  </tr>`);

  // 14 item rows from ACT80 Form-PLS-MTC-D04 standard
  const adItems = [
    { no: 1, part: 'INDIKATOR POWER', contents: 'KONDISI', frek: '1x /Day', act: 'C', std: 'LAMPU MENYALA' },
    { no: 2, part: 'DUE POINT INDIKATOR', contents: 'KONDISI', frek: '1x /Day', act: 'C', std: 'TIDAK ADA INDIKATOR ALARM MENYALA' },
    { no: 3, part: 'EMERGENCY STOP', contents: 'FUNGSI', frek: '1x/Week', act: 'C', std: 'EMERGENCY BERFUNGSI' },
    { no: 4, part: 'BODY MESIN', contents: 'KEBERSIHAN', frek: '1x/Week', act: 'B', std: 'BODY MESIN BERSIH' },
    { no: 5, part: 'TEMPERATUR KERJA', contents: 'KONDISI', frek: '1x /Day', act: 'C', std: '70 S/D 100 C' },
    { no: 6, part: 'CHECK KEBOCORAN ANGIN', contents: 'KONDISI', frek: '1x/Week', act: 'C', std: 'TIDAK ADA UDARA BOCOR PADA PIPA' },
    { no: 7, part: 'FILTER KONDENSOR', contents: 'KEBERSIHAN', frek: '1x/Week', act: 'B', std: 'TIDAK KOTOR / BERDEBU' },
    { no: 8, part: 'KOMPRESOR', contents: 'FUNGSI', frek: '1x /Day', act: 'C', std: 'RUNNING TANPA VIBRASI' },
    { no: 9, part: 'FAN KONDENSOR', contents: 'FUNGSI', frek: '1x /Day', act: 'C', std: 'RUNNING TANPA VIBRASI' },
    { no: 10, part: 'PRE FILTER DRYER', contents: 'KEBERSIHAN', frek: '1x/Week', act: 'B', std: 'BERSIHKAN FILTER CATRIDE', span: 2 },
    { no: 11, part: 'PRE FILTER DRYER', contents: 'PERGANTIAN', frek: '1x/6 bulan', act: 'G', std: 'GANTI FILTER CATRIDE ELEMENT', skipHdr: true },
    { no: 12, part: 'AFTER FILTER DRYER', contents: 'KEBERSIHAN', frek: '1x/Week', act: 'B', std: 'BERSIHKAN FILTER CATRIDE', span: 2 },
    { no: 13, part: 'AFTER FILTER DRYER', contents: 'PERGANTIAN', frek: '1x/6 bulan', act: 'G', std: 'GANTI FILTER CATRIDE ELEMENT', skipHdr: true },
    { no: 14, part: 'AUTO DRAIN', contents: 'FUNGSI', frek: '1x /Day', act: 'C', std: 'BERSIHKAN' },
  ];

  adItems.forEach((it) => {
    out.push(`<tr class="item" style="height:24px">
      ${!it.skipHdr ? td(it.no === 11 ? 10 : (it.no === 14 ? 13 : it.no), { r: it.span || 1, cl: 'c t b' }) : ''}
      ${!it.skipHdr ? td(esc(it.part), { r: it.span || 1, cl: 't b' }) : ''}
      ${td(esc(it.contents), { cl: 't' })}
      ${td(esc(it.frek), { cl: 'c t' })}
      ${td(esc(it.act), { cl: 'c t b' })}
      ${td(esc(it.std), { c: 2, cl: 't' })}
      ${td('CS', { cl: 'c t' })}
      ${td('APD STANDARD', { cl: 'c t b', at: 'style="color:#0f172a;font-size:11px;"' })}
    </tr>`);
  });

  // 11 empty dashed rows (matching Sheet ACT80 Form-PLS-MTC-D04)
  for (let r = 0; r < 11; r++) {
    const isWatermarkRow = (r === 4);
    out.push(`<tr class="dashed-row" style="height:22px">
      ${td('', { cl: 'c' })}
      ${td('', { cl: 't' })}
      ${td('', { cl: 't' })}
      ${td('', { cl: 'c' })}
      ${td('', { cl: 'c' })}
      ${td(isWatermarkRow ? '<span style="font-size:36px;color:#cbd5e1;font-weight:700;letter-spacing:6px;opacity:0.4;">Halaman 1</span>' : '', { c: 2, cl: 't c', at: isWatermarkRow ? 'style="position:relative;"' : '' })}
      ${td('', { cl: 'c' })}
      ${td('', { cl: 'c' })}
    </tr>`);
  }

  // Row 28: Catatan & Tugas Legend (spans columns 3-12, total 10 columns)
  out.push(`<tr style="height:100px">
    ${td(`<div>
      <div style="font-weight:700;font-size:11px;margin-bottom:4px;color:#0f172a;">Catatan</div>
      <div style="border:1px solid #000;padding:8px 12px;background:#f8fafc;font-size:11px;line-height:1.6;min-height:64px;">
        <div style="color:#64748b;font-style:italic;">Catatan inspeksi atau tindakan preventif khusus...</div>
      </div>
    </div>`, { c: 4, at: 'style="vertical-align:top;padding:6px;"' })}
    ${td(`<div>
      <div style="font-weight:700;font-size:11px;margin-bottom:4px;color:#0f172a;">Tugas</div>
      <table style="width:100%;font-size:11px;border-collapse:collapse;border:none;">
        <tr style="height:20px;">
          <td style="border:none;padding:2px 6px;"><b>A</b> &nbsp; Adjust/setting</td>
          <td style="border:none;padding:2px 6px;"><b>K</b> &nbsp; Kencangkan</td>
        </tr>
        <tr style="height:20px;">
          <td style="border:none;padding:2px 6px;"><b>B</b> &nbsp; Bersihkan</td>
          <td style="border:none;padding:2px 6px;"><b>S</b> &nbsp; Service</td>
        </tr>
        <tr style="height:20px;">
          <td style="border:none;padding:2px 6px;"><b>C</b> &nbsp; Cek/Periksa</td>
          <td style="border:none;padding:2px 6px;"><b>T</b> &nbsp; Tambah</td>
        </tr>
        <tr style="height:20px;">
          <td style="border:none;padding:2px 6px;"><b>G</b> &nbsp; Ganti</td>
          <td style="border:none;padding:2px 6px;"><b>U</b> &nbsp; Ukur</td>
        </tr>
      </table>
    </div>`, { c: 6, at: 'style="vertical-align:top;padding:6px;"' })}
  </tr>`);

  out.push('</tbody></table>');
  return out.join('');
}

// ------------------------------------------------------------------ Shared Footers
function renderFooterStandard(out, S) {
  const sym = [
    ['V : TIDAK ADA PROBLEM'], ['X : BELUM OK / PERLU DICEK'], [`${glyph('XF')} : PROBLEM SUDAH DIPERBAIKI`], ['O : PENGGANTIAN PART'],
  ];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const nF = S.findings.length;

  out.push(`<tr style="height:48px">${td('TEMUAN PROBLEM', { c: 3, cl: 'redh med' })}${td('SIMBOL', { cl: 'lg c' })}${td('', { r: 7 })}
    ${td(`Jumlah Item Check<br><span class="mono" style="font-size:12px">${S.stats.checked_total} / ${S.stats.expected_total}</span>`, { r: 3, cl: 'big' })}
    ${td('PIC MTN', { cl: 'big' })}${td('I', { cl: 'c b' })}
    ${days.map((d) => {
      const m = dayMeta(S, d);
      const n = S.pics[d];
      return td(n ? initials(n) : '', { cl: `pic${m.off ? ' off' : ''}`, at: m.off ? '' : `data-day="${d}" title="${esc(n || 'Klik untuk isi PIC')}"` });
    }).join('')}
    ${td('JENIS INSTRUKSI', { c: 2, cl: 'lg c b' })}</tr>`);
  out.push(`<tr style="height:30px">${td(`<div class="mono b" style="text-align:center;padding:8px">${nF ? nF + ' temuan tercatat' : 'Tidak ada temuan'}</div>`, { c: 3, r: 6 })}${td(esc(sym[0][0]), { cl: 'lg' })}
    ${td('KaSubSie MTN', { c: 2, cl: 'big' })}
    ${days.map((d) => {
      const a = findAp(S, 'DAY', d, 'KASUBSIE');
      const m = dayMeta(S, d);
      return td(a ? (a.status === 'APPROVED' ? '✔' : '✖') : '', { cl: `ap ${cls(a)}${m.off ? ' off' : ''}`, at: m.off ? '' : `data-day="${d}" title="${esc(a ? `${a.status} • ${a.actor}` : 'Klik untuk review')}"` });
    }).join('')}${td(LEGEND[0], { c: 2, cl: 'lg' })}</tr>`);
  out.push(`<tr style="height:30px">${td(esc(sym[1][0]), { cl: 'lg' })}${td('Kasie MTN', { c: 2, cl: 'big' })}
    ${S.config.week_blocks.map(([f, t], i) => {
      const a = findAp(S, 'WEEK', i + 1, 'KASIE');
      return td(a ? (a.status === 'APPROVED' ? '✔ Approved' : '✖ Rejected') : `${f}–${Math.min(t, 31)}`, { c: t - f + 1, cl: `wk ${cls(a)}`, at: `data-week="${i + 1}" title="${esc(a ? `${a.actor} • ${fmtDT(a.at)}` : 'Klik untuk approve minggu ini')}"` });
    }).join('')}${td(LEGEND[1], { c: 2, cl: 'lg' })}</tr>`);
  out.push(`<tr style="height:26px">${td(sym[2][0], { cl: 'lg' })}${td('', { r: 4 })}${td('SIRKULASI PENYERAHAN DOKUMEN', { c: 33, cl: 'lg c b' })}${td(LEGEND[2], { c: 2, cl: 'lg' })}</tr>`);

  const flow = S.config.doc_order.map((r) => {
    const a = findAp(S, 'DOC', 0, r);
    return `<div class="chip ${cls(a)}" data-sign="${r}" style="cursor:pointer">${ROLE_LABEL[r]}<small>${a ? `${a.status === 'APPROVED' ? '✔' : '✖'} ${esc(a.actor)}` : 'menunggu'}</small></div>`;
  });
  out.push(`<tr style="height:34px">${td(sym[3][0], { cl: 'lg' })}${td(`<div class="flow"><div class="chip">PIC MTN<small>input harian</small></div><span class="arrow">→</span>${flow.join('<span class="arrow">→</span>')}</div>`, { c: 33, r: 3 })}${td(LEGEND[3], { c: 2, cl: 'lg' })}</tr>`);
  out.push(`<tr style="height:30px">${td('&nbsp;', {})}${td(LEGEND[4], { c: 2, cl: 'lg' })}</tr>`);
  out.push(`<tr style="height:30px">${td('&nbsp;', {})}${td(LEGEND[5], { c: 2, cl: 'lg' })}</tr>`);
}

function renderFooterChiller(out, S, days) {
  const serviceBoxHtml = `
    <div class="cs-service-box">
      <div class="sb-head">CATATAN SERVICE :</div>
      <div class="sb-line"><span>1/ 4 Bln</span> <span>: <b>4000 jam</b></span></div>
      <div class="sb-line"><span>1/6 Bln</span> <span>: <b>8000 jam</b></span></div>
      <div class="sb-line"><span>1/1 Thn</span> <span>: <b>12000 jam</b></span></div>
    </div>
  `;

  const sym = [
    'V : TIDAK ADA PROBLEM',
    'X : BELUM OK / PERLU DICEK',
    `${glyph('XF')} : PROBLEM SUDAH DIPERBAIKI`,
    'O : PENGGANTIAN PART',
  ];

  const flow = S.config.doc_order.map((r) => {
    const a = findAp(S, 'DOC', 0, r);
    return `<div class="chip ${cls(a)}" data-sign="${r}" style="cursor:pointer">${ROLE_LABEL[r]}<small>${a ? `${a.status === 'APPROVED' ? '✔' : '✖'} ${esc(a.actor)}` : 'menunggu'}</small></div>`;
  });

  const picCells = (shift) => days.map((d) => {
    const m = dayMeta(S, d);
    const n = S.pics[d];
    return td(n ? initials(n) : '', { cl: `pic${m.off ? ' off' : ''}`, at: m.off ? '' : `data-day="${d}" title="${esc(n || 'Klik untuk isi PIC')}"` });
  }).join('');

  const kasubCells = (shift) => days.map((d) => {
    const a = findAp(S, 'DAY', d, 'KASUBSIE');
    const m = dayMeta(S, d);
    return td(a ? (a.status === 'APPROVED' ? '✔' : '✖') : '', { cl: `ap ${cls(a)}${m.off ? ' off' : ''}`, at: m.off ? '' : `data-day="${d}" title="${esc(a ? `${a.status} • ${a.actor}` : 'Klik untuk review')}"` });
  }).join('');

  const kasieCells = (shift) => days.map((d) => {
    const a = findAp(S, 'DAY', d, 'KASIE');
    const m = dayMeta(S, d);
    return td(a ? (a.status === 'APPROVED' ? '✔' : '✖') : '', { cl: `ap ${cls(a)}${m.off ? ' off' : ''}`, at: m.off ? '' : `data-day="${d}" title="${esc(a ? `${a.status} • ${a.actor}` : 'Klik untuk review')}"` });
  }).join('');

  // Row 39: Red block (c:3), SIMBOL, Jumlah Item Check (r:6), PIC (r:2), I, 31 cells, JENIS INSTRUKSI
  out.push(`<tr style="height:32px">
    ${td('', { c: 3, cl: 'red-cell' })}
    ${td('SIMBOL', { cl: 'b c', at: 'style="font-size:11px"' })}
    ${td(`Jumlah Item<br>Check<br><span class="mono" style="font-size:12px;font-weight:700;margin-top:4px;display:block">${S.stats.checked_total} / ${S.stats.expected_total}</span>`, { r: 6, cl: 'c b', at: 'style="font-size:11px;vertical-align:middle;padding:4px;"' })}
    ${td('PIC', { r: 2, cl: 'c b', at: 'style="vertical-align:middle;font-size:12px"' })}
    ${td('I', { cl: 'c b' })}
    ${picCells(1)}
    ${td('JENIS INSTRUKSI', { cl: 'c b', at: 'style="font-size:11px"' })}
  </tr>`);

  // Row 40: CATATAN SERVICE (c:3, r:8), V : TIDAK ADA PROBLEM, II, 31 cells, A : ADJUST
  out.push(`<tr style="height:26px">
    ${td(serviceBoxHtml, { c: 3, r: 8, cl: 'p-0', at: 'style="vertical-align:top;"' })}
    ${td(esc(sym[0]), { cl: 'lg' })}
    ${td('II', { cl: 'c b' })}
    ${picCells(2)}
    ${td('A : ADJUST', { cl: 'lg' })}
  </tr>`);

  // Row 41: X : BELUM OK, KaSub (r:2), I, 31 cells, B : BERSIHKAN
  out.push(`<tr style="height:26px">
    ${td(esc(sym[1]), { cl: 'lg' })}
    ${td('KaSub', { r: 2, cl: 'c b', at: 'style="vertical-align:middle;font-size:12px"' })}
    ${td('I', { cl: 'c b' })}
    ${kasubCells(1)}
    ${td('B : BERSIHKAN', { cl: 'lg' })}
  </tr>`);

  // Row 42: XF : PROBLEM SUDAH DIPERBAIKI, II, 31 cells, C : CHECK
  out.push(`<tr style="height:26px">
    ${td(sym[2], { cl: 'lg' })}
    ${td('II', { cl: 'c b' })}
    ${kasubCells(2)}
    ${td('C : CHECK', { cl: 'lg' })}
  </tr>`);

  // Row 43: O : PENGGANTIAN PART, Ka.Sie (r:2), I, 31 cells, G : GANTI
  out.push(`<tr style="height:26px">
    ${td(esc(sym[3]), { cl: 'lg' })}
    ${td('Ka.Sie', { r: 2, cl: 'c b', at: 'style="vertical-align:middle;font-size:12px"' })}
    ${td('I', { cl: 'c b' })}
    ${kasieCells(1)}
    ${td('G : GANTI', { cl: 'lg' })}
  </tr>`);

  // Row 44: empty, II, 31 cells, K : KENCANGKAN
  out.push(`<tr style="height:26px">
    ${td('', { cl: 'lg' })}
    ${td('II', { cl: 'c b' })}
    ${kasieCells(2)}
    ${td('K : KENCANGKAN', { cl: 'lg' })}
  </tr>`);

  // Row 45: empty, empty (r:3), SIRKULASI PENYERAHAN DOKUMEN (c:33), T : TAMBAH
  out.push(`<tr style="height:26px">
    ${td('', { cl: 'lg' })}
    ${td('', { r: 3, cl: 'c b', at: 'style="font-size:11px"' })}
    ${td('SIRKULASI PENYERAHAN DOKUMEN', { c: 33, cl: 'b c', at: 'style="font-size:11px;background:#f8fafc;"' })}
    ${td('T : TAMBAH', { cl: 'lg' })}
  </tr>`);

  // Row 46: empty, Approval flow (c:33, r:2), U : UKUR
  out.push(`<tr style="height:28px">
    ${td('', { cl: 'lg' })}
    ${td(`<div class="flow"><div class="chip">PIC MTN<small>input harian</small></div><span class="arrow">➔</span>${flow.join('<span class="arrow">➔</span>')}</div>`, { c: 33, r: 2 })}
    ${td('U : UKUR', { cl: 'lg' })}
  </tr>`);

  // Row 47: empty, S : SERVICE
  out.push(`<tr style="height:28px">
    ${td('', { cl: 'lg' })}
    ${td('S : SERVICE', { cl: 'lg' })}
  </tr>`);
}

function renderFooterMonthly(out, S) {
  const serviceBoxHtml = `
    <div class="service-box" style="font-size:11px;line-height:1.4">
      <span class="sb-title" style="font-weight:700">CATATAN SERVICE :</span>
      <div style="margin-top:2px"><b>1/ 4 Bln</b> : 4000 jam</div>
      <div><b>1/6 Bln</b> : 8000 jam</div>
      <div><b>1/1 Thn</b> : 12000 jam</div>
    </div>
  `;

  const sym = [
    'V : TIDAK ADA PROBLEM',
    'X : BELUM OK / PERLU DICEK',
    `${glyph('XF')} : PROBLEM SUDAH DIPERBAIKI`,
    'O : PENGGANTIAN PART',
  ];

  const flow = S.config.doc_order.map((r) => {
    const a = findAp(S, 'DOC', 0, r);
    return `<div class="chip ${cls(a)}" data-sign="${r}" style="cursor:pointer">${ROLE_LABEL[r]}<small>${a ? `${a.status === 'APPROVED' ? '✔' : '✖'} ${esc(a.actor)}` : 'menunggu'}</small></div>`;
  });

  const picMonthCells = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const n = S.pics[m];
    return td(n ? initials(n) : '', {
      cl: 'pic',
      at: `data-day="${m}" title="${esc(n || `Klik untuk isi PIC Bulan ${MONTHS[i]}`)}" style="text-align:center;font-size:11px;font-weight:600"`,
    });
  }).join('');

  const kasubMonthCells = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const a = findAp(S, 'DAY', m, 'KASUBSIE');
    return td(a ? (a.status === 'APPROVED' ? '✔' : '✖') : '', {
      cl: `ap ${cls(a)}`,
      at: `data-day="${m}" title="${esc(a ? `${a.status} • ${a.actor}` : `Klik untuk review Bulan ${MONTHS[i]}`)}" style="text-align:center;font-size:11px"`,
    });
  }).join('');

  const kasieMonthCells = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const a = findAp(S, 'DAY', m, 'KASIE') || findAp(S, 'WEEK', m, 'KASIE');
    return td(a ? (a.status === 'APPROVED' ? '✔' : '✖') : '', {
      cl: `ap ${cls(a)}`,
      at: `data-day="${m}" title="${esc(a ? `${a.status} • ${a.actor}` : `Bulan ${MONTHS[i]}`)}" style="text-align:center;font-size:11px"`,
    });
  }).join('');

  // Row 30: B30:D30 (3 cols), SIMBOL (1 col), Jumlah Item Check (rowspan 3, 1 col), PIC (1 col), 12 month cells, JENIS INSTRUKSI (2 cols)
  out.push(`<tr style="height:26px">
    ${td('', { c: 3 })}
    ${td('SIMBOL', { cl: 'lg c b' })}
    ${td(`Jumlah Item Check<br><span class="mono" style="font-size:11px">${S.stats.checked_total} / ${S.stats.expected_total}</span>`, { r: 3, cl: 'big c', at: 'style="vertical-align:middle;font-size:11px;font-weight:700;line-height:1.2;padding:4px"' })}
    ${td('PIC', { cl: 'c b', at: 'style="font-size:12px;vertical-align:middle"' })}
    ${picMonthCells}
    ${td('JENIS INSTRUKSI', { c: 2, cl: 'lg c b' })}
  </tr>`);

  // Row 31: B31:D35 (rowspan 5, 3 cols), V : TIDAK ADA PROBLEM (1 col), Ka.Sub Sie (1 col), 12 month cells, B : BERSIHKAN / C : Check (2 cols)
  out.push(`<tr style="height:26px">
    ${td(serviceBoxHtml, { c: 3, r: 5, cl: 'meta', at: 'style="vertical-align:top;padding:4px 6px"' })}
    ${td(esc(sym[0]), { cl: 'lg' })}
    ${td('Ka.Sub Sie', { cl: 'c b', at: 'style="font-size:11px;vertical-align:middle"' })}
    ${kasubMonthCells}
    ${td('B : BERSIHKAN / C : Check', { c: 2, cl: 'lg' })}
  </tr>`);

  // Row 32: X : BELUM OK / PERLU DICEK (1 col), Ka.Sie (1 col), 12 month cells, G : GANTI / S : Service (2 cols)
  out.push(`<tr style="height:26px">
    ${td(esc(sym[1]), { cl: 'lg' })}
    ${td('Ka.Sie', { cl: 'c b', at: 'style="font-size:11px;vertical-align:middle"' })}
    ${kasieMonthCells}
    ${td('G : GANTI / S : Service', { c: 2, cl: 'lg' })}
  </tr>`);

  // Row 33: Ⓧ : PROBLEM SUDAH DIPERBAIKI (1 col), empty (rowspan 3, 1 col), SIRKULASI PENYERAHAN DOKUMEN (13 cols), K : KENCANGKAN / A : Adjust (2 cols)
  out.push(`<tr style="height:26px">
    ${td(sym[2], { cl: 'lg' })}
    ${td('', { r: 3, cl: 'c', at: 'style="background:#f8fafc"' })}
    ${td('SIRKULASI PENYERAHAN DOKUMEN', { c: 13, cl: 'b c', at: 'style="font-size:11px;background:#f8fafc;"' })}
    ${td('K : KENCANGKAN / A : Adjust', { c: 2, cl: 'lg' })}
  </tr>`);

  // Row 34: O : PENGGANTIAN PART (1 col), Flow Diagram (13 cols, rowspan 2), T : TAMBAH (2 cols)
  out.push(`<tr style="height:28px">
    ${td(esc(sym[3]), { cl: 'lg' })}
    ${td(`<div class="flow"><div class="chip">PIC MTN<small>inspeksi</small></div><span class="arrow">➔</span>${flow.join('<span class="arrow">➔</span>')}</div>`, { c: 13, r: 2 })}
    ${td('T : TAMBAH', { c: 2, cl: 'lg' })}
  </tr>`);

  // Row 35: empty (1 col), U : UKUR (2 cols)
  out.push(`<tr style="height:28px">
    ${td('', { cl: 'lg' })}
    ${td('U : UKUR', { c: 2, cl: 'lg' })}
  </tr>`);
}

function renderFindings(out, S, extraRows, totalCols) {
  out.push(`<tr style="height:26px">${td('Temuan Problem', { c: totalCols, cl: 'b sect', at: 'style="padding-left:6px"' })}</tr>`);
  const isChiller = totalCols === 39 || totalCols === 40;
  const cProb = 4;
  const cDue = isChiller ? 5 : 6;
  const cPic = totalCols === 40 ? 2 : (isChiller ? 1 : 2);

  out.push(`<tr class="fh">${td('No', { c: 2, cl: 'fh' })}${td('Tanggal', { cl: 'fh' })}${td('Masalah', { c: cProb, cl: 'fh' })}${td('Akar Masalah', { c: 13, cl: 'fh' })}${td('Counter Measure', { c: 13, cl: 'fh' })}${td('Due Date', { c: cDue, cl: 'fh' })}${td('PIC', { c: cPic, cl: 'fh' })}</tr>`);
  const byLine = Object.fromEntries(S.findings.map((f) => [f.line_no, f]));
  const maxLine = Math.max(S.config.min_finding_rows, ...S.findings.map((f) => f.line_no)) + extraRows;
  const inp = (name, v, type = 'text') => `<input class="cell" type="${type}" data-f="${name}" value="${esc(v)}" maxlength="${type === 'text' ? 500 : 10}">`;
  for (let n = 1; n <= maxLine; n++) {
    const f = byLine[n] || {};
    out.push(`<tr class="frow" data-line="${n}" style="height:26px">${td(n, { c: 2, cl: 'c' })}${td(inp('found_date', f.found_date, 'date'))}${td(inp('problem', f.problem), { c: cProb })}${td(inp('root_cause', f.root_cause), { c: 13 })}${td(inp('counter_measure', f.counter_measure), { c: 13 })}${td(inp('due_date', f.due_date, 'date'), { c: cDue })}${td(inp('pic', f.pic), { c: cPic })}</tr>`);
  }
  out.push(`<tr class="no-print">${td('<button class="btn ghost" id="add-row" style="margin:6px">+ Tambah baris temuan</button>', { c: totalCols, at: 'style="border:0"' })}</tr>`);
}

// ------------------------------------------------------------------ Main renderSheet Dispatcher
export function renderSheet(S, extraRows = 0) {
  if (S.template.code === 'AD_S') {
    return renderAirDryerStandardSheet(S);
  }
  if (S.template.code === 'CHILLER_S') {
    return renderChillerStandardSheet(S);
  }
  if (S.template.code === 'CHILLER_M' || S.template.code === 'AD_M') {
    return renderChillerMonthlySheet(S, extraRows);
  }
  if (S.template.code === 'CHILLER_D' || S.template.code === 'AD_D') {
    return renderChillerDailyWeeklySheet(S, extraRows);
  }
  return renderStandardSheet(S, extraRows);
}
