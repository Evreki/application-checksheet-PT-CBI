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

const td = (html = '', { c = 1, r = 1, cl = '', at = '' } = {}) =>
  `<td${c > 1 ? ` colspan="${c}"` : ''}${r > 1 ? ` rowspan="${r}"` : ''}${cl ? ` class="${cl}"` : ''}${at ? ` ${at}` : ''}>${html}</td>`;

const WIDTHS = [40, 34, 220, 150, 160, 110, 80, 70, ...Array(31).fill(36), 100, 90];

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

export function renderSheet(S, extraRows = 0) {
  const { sheet: sh, template: T } = S;
  const items = T.items;
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const locked = new Set(sh.locked_days);
  const out = [];

  out.push(`<table class="cs"><colgroup>${WIDTHS.map((w) => `<col style="width:${w}px">`).join('')}</colgroup><tbody>`);

  // --- Kop form ---
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

  // --- Judul kolom ---
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

  // --- Item inspeksi ---
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

  // --- Footer: PIC / KaSubSie / Kasie / legenda ---
  const sym = [
    ['V : TIDAK ADA PROBLEM'], ['X : BELUM OK / PERLU DICEK'], [`${glyph('XF')} : PROBLEM SUDAH DIPERBAIKI`], ['O : PENGGANTIAN PART'],
  ];
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
  out.push(`<tr style="height:30px">${td('', {})}${td(LEGEND[4], { c: 2, cl: 'lg' })}</tr>`);
  out.push(`<tr style="height:30px">${td('', {})}${td(LEGEND[5], { c: 2, cl: 'lg' })}</tr>`);

  // --- Tabel Temuan Problem ---
  out.push(`<tr style="height:26px">${td('Temuan Problem', { c: 41, cl: 'b', at: 'style="border-left:0;border-right:0;padding-left:2px"' })}</tr>`);
  out.push(`<tr class="fh">${td('No', { c: 2, cl: 'fh' })}${td('Tanggal', { cl: 'fh' })}${td('Masalah', { c: 5, cl: 'fh' })}${td('Akar Masalah', { c: 13, cl: 'fh' })}${td('Counter Measure', { c: 13, cl: 'fh' })}${td('Due Date', { c: 5, cl: 'fh' })}${td('PIC', { c: 2, cl: 'fh' })}</tr>`);
  const byLine = Object.fromEntries(S.findings.map((f) => [f.line_no, f]));
  const maxLine = Math.max(S.config.min_finding_rows, ...S.findings.map((f) => f.line_no)) + extraRows;
  const inp = (name, v, type = 'text') => `<input class="cell" type="${type}" data-f="${name}" value="${esc(v)}" maxlength="${type === 'text' ? 500 : 10}">`;
  for (let n = 1; n <= maxLine; n++) {
    const f = byLine[n] || {};
    out.push(`<tr class="frow" data-line="${n}" style="height:26px">${td(n, { c: 2, cl: 'c' })}${td(inp('found_date', f.found_date, 'date'))}${td(inp('problem', f.problem), { c: 5 })}${td(inp('root_cause', f.root_cause), { c: 13 })}${td(inp('counter_measure', f.counter_measure), { c: 13 })}${td(inp('due_date', f.due_date, 'date'), { c: 5 })}${td(inp('pic', f.pic), { c: 2 })}</tr>`);
  }
  out.push(`<tr class="no-print">${td('<button class="btn ghost" id="add-row" style="margin:6px">+ Tambah baris temuan</button>', { c: 41, at: 'style="border:0"' })}</tr>`);
  out.push('</tbody></table>');
  return out.join('');
}
