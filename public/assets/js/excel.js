import { MONTHS, ROLE_LABEL, esc, fmtDT, fmtNum, findAp, outOfLimit } from './render.js';

function signText(a) {
  if (!a) return '<span style="color:#888888;font-size:8pt;">menunggu</span>';
  const st = a.status === 'APPROVED' ? '✔ Approved' : '✖ Rejected';
  return `<b>${st}</b><br style="mso-data-placement:same-cell;"><span style="font-size:9pt;">${esc(a.actor)}</span><br style="mso-data-placement:same-cell;"><span style="font-size:7.5pt;color:#555;">${fmtDT(a.at)}</span>`;
}

function dayMeta(S, d) {
  const { year, month, days_in_month } = S.sheet;
  const dow = new Date(year, month - 1, d).getDay();
  return {
    off: d > days_in_month,
    sun: d <= days_in_month && dow === 0,
  };
}

export function exportExcel(S) {
  if (!S || !S.sheet || !S.template) return;

  const { sheet: sh, template: T } = S;
  if (T.code === 'CHILLER_S') {
    return exportChillerStandardExcel(S);
  }
  if (T.code === 'CHILLER_M') {
    return exportChillerMonthlyExcel(S);
  }
  if (T.code === 'CHILLER_D') {
    return exportChillerDailyWeeklyExcel(S);
  }
  return exportStandardExcel(S);
}

// ------------------------------------------------------------------ 1. Standard Excel (CT & SCR)
function exportStandardExcel(S) {
  const { sheet: sh, template: T } = S;
  const items = T.items;
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const nF = S.findings.length;

  const apKaDept = findAp(S, 'DOC', 0, 'KADEPT');
  const apKaSie = findAp(S, 'DOC', 0, 'KASIE');
  const apKaSubSie = findAp(S, 'DOC', 0, 'KASUBSIE');
  const clsBg = (a) => (a ? (a.status === 'APPROVED' ? 'background:#cdf0d6;color:#0b5a22;' : 'background:#ffd6d6;color:#8d1111;') : '');

  const flowParts = (S.config.doc_order || ['KASUBSIE', 'KASIE', 'KADEPT']).map((r) => {
    const a = findAp(S, 'DOC', 0, r);
    const st = a ? (a.status === 'APPROVED' ? `✔ ${a.actor}` : `✖ ${a.actor}`) : 'menunggu';
    return `${ROLE_LABEL[r]} (${st})`;
  });
  const flowSummary = `PIC MTN (Input harian)  ➔  ${flowParts.join('  ➔  ')}`;

  const rows = [];

  // Row 1: Kop 1
  rows.push(`<tr style="height:24pt;">
    <td colspan="3" class="c b" style="font-size:11pt;background:#f8fafc;">PT. CENTURY BATTERIES INDONESIA</td>
    <td colspan="5" rowspan="4" class="c b" style="font-size:16pt;background:#ffffff;vertical-align:middle;">LEMBAR HASIL INSPEKSI HARIAN</td>
    <td colspan="10" class="l">Dept : <b>${esc(T.department)}</b></td>
    <td colspan="18" class="l">No. Form : <b>${esc(T.form_no)}</b></td>
    <td colspan="3" class="hd">Ka.Dept</td>
    <td class="hd">Ka.Sie</td>
    <td class="hd">Ka.Sub Sie</td>
  </tr>`);

  // Row 2: Kop 2
  rows.push(`<tr style="height:22pt;">
    <td colspan="3" class="c" style="font-style:italic;background:#f8fafc;">Maintenance Department</td>
    <td colspan="10" class="l">Seksi : <b>${esc(T.section)}</b></td>
    <td colspan="18" class="l">Revisi : <b>${esc(T.revision)}</b></td>
    <td colspan="3" rowspan="3" class="c" style="vertical-align:middle;${clsBg(apKaDept)}">${signText(apKaDept)}</td>
    <td rowspan="3" class="c" style="vertical-align:middle;${clsBg(apKaSie)}">${signText(apKaSie)}</td>
    <td rowspan="3" class="c" style="vertical-align:middle;${clsBg(apKaSubSie)}">${signText(apKaSubSie)}</td>
  </tr>`);

  // Row 3: Kop 3
  rows.push(`<tr style="height:22pt;">
    <td colspan="3" class="c b" style="background:#f8fafc;">${esc(T.machine_type)}</td>
    <td colspan="10" class="l">No. Alat : <b>${esc(sh.equipment_no || '-')}</b></td>
    <td colspan="18" class="l">Tgl. : <b>${esc(sh.form_date || '-')}</b></td>
  </tr>`);

  // Row 4: Kop 4
  rows.push(`<tr style="height:22pt;">
    <td colspan="3" class="c" style="background:#f8fafc;"></td>
    <td colspan="10" class="l">M/C Type : <b>${esc(T.machine_type)}</b></td>
    <td colspan="18" class="l">Page : <b>${esc(T.page_info)}</b></td>
  </tr>`);

  // Row 5: Column Headers 1
  rows.push(`<tr style="height:22pt;">
    <td rowspan="3" class="hd">UNIT</td>
    <td rowspan="3" class="hd">NO</td>
    <td rowspan="3" class="hd">BAGIAN PERALATAN</td>
    <td rowspan="3" class="hd">ITEM INSPEKSI</td>
    <td rowspan="3" class="hd">STANDART</td>
    <td rowspan="3" class="hd">PERIODE</td>
    <td rowspan="3" class="hd">JENIS INST.</td>
    <td colspan="32" class="hd">HASIL PEMERIKSAAN TAHUN <u>&nbsp;${sh.year}&nbsp;</u></td>
    <td colspan="2" rowspan="3" class="hd">KETERANGAN</td>
  </tr>`);

  // Row 6: Column Headers 2
  rows.push(`<tr style="height:20pt;">
    <td colspan="32" class="hd" style="font-size:11pt;">BULAN : <b>${esc((MONTHS[sh.month - 1] || '').toUpperCase())}</b></td>
  </tr>`);

  // Row 7: Column Headers 3
  const dayHeaderCells = days.map((d) => {
    const m = dayMeta(S, d);
    const bg = m.off ? 'background:#e2e8f0;' : m.sun ? 'background:#fee2e2;color:#991b1b;' : 'background:#f1f5f9;';
    return `<td class="c b" style="${bg}">${d}</td>`;
  }).join('');
  rows.push(`<tr style="height:22pt;"><td class="hd">Shift</td>${dayHeaderCells}</tr>`);

  // Row 8: Section Header
  rows.push(`<tr style="height:22pt;"><td colspan="41" class="sect">TABLE DAILY CHECK</td></tr>`);

  // Inspection Items
  items.forEach((it, idx) => {
    const itemCells = days.map((d) => {
      const m = dayMeta(S, d);
      if (m.off) return '<td style="background:#e5e7eb;"></td>';
      if (it.calc) {
        const v = S.derived[it.id]?.[d];
        return `<td class="num" style="background:#f9fafb;">${v === undefined ? '' : fmtNum(v)}</td>`;
      }
      const e = S.entries[it.id]?.[d];
      if (!e) return `<td class="c" style="${m.sun ? 'background:#fef2f2;' : ''}"></td>`;
      const bad = outOfLimit(it, e.value);
      let content = e.symbol ? `<b>${esc(e.symbol)}</b>` : (e.value !== null ? fmtNum(e.value) : '');
      return `<td class="c" style="${bad ? 'background:#fee2e2;color:#991b1b;font-weight:bold;' : ''}">${content}</td>`;
    }).join('');

    rows.push(`<tr style="height:32pt;">
      ${idx === 0 ? `<td rowspan="${items.length}" class="c" style="background:#f8fafc;"></td>` : ''}
      <td class="c">${it.no}</td>
      <td class="l">${esc(it.part)}</td>
      <td class="l">${esc(it.method)}</td>
      <td class="l">${esc(it.standard || '')}</td>
      <td class="c">${esc(it.period)}</td>
      <td class="c">${esc(it.inst || '')}</td>
      <td class="c">${esc(it.mark)}</td>
      ${itemCells}
      <td colspan="2" class="l">${esc(S.remarks[it.id] || '')}</td>
    </tr>`);
  });

  // Footers & Findings
  renderExcelFooterStandard(rows, S, days, nF, flowSummary);

  const colWidths = [45, 35, 200, 160, 160, 90, 80, 65, ...Array(31).fill(34), 90, 80];
  downloadHtmlTable(rows, colWidths, T.machine_type || 'Checksheet', sh.month, sh.year);
}

// ------------------------------------------------------------------ 2. Chiller Daily & Weekly Excel (CHILLER_D)
function exportChillerDailyWeeklyExcel(S) {
  const { sheet: sh, template: T } = S;
  const items = T.items;
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const nF = S.findings.length;

  const apKaDept = findAp(S, 'DOC', 0, 'KADEPT');
  const apKaSie = findAp(S, 'DOC', 0, 'KASIE');
  const apKaSubSie = findAp(S, 'DOC', 0, 'KASUBSIE');
  const clsBg = (a) => (a ? (a.status === 'APPROVED' ? 'background:#cdf0d6;color:#0b5a22;' : 'background:#ffd6d6;color:#8d1111;') : '');

  const rows = [];

  // Kop form
  rows.push(`<tr style="height:24pt;">
    <td colspan="3" class="c b" style="font-size:11pt;background:#f8fafc;">PT. CENTURY BATTERIES INDONESIA</td>
    <td colspan="4" rowspan="4" class="c b" style="font-size:15pt;background:#ffffff;vertical-align:middle;">LEMBAR HASIL INSPEKSI HARIAN DAN MINGGUAN</td>
    <td colspan="10" class="l">Dept : <b>${esc(T.department)}</b></td>
    <td colspan="15" class="l">No. Form : <b>${esc(T.form_no)}</b></td>
    <td colspan="3" class="hd">Ka.Dept</td>
    <td class="hd">Ka.Sie</td>
    <td class="hd">Ka.Sub Sie</td>
  </tr>`);

  rows.push(`<tr style="height:22pt;">
    <td colspan="3" class="c" style="font-style:italic;background:#f8fafc;">Maintenance Department</td>
    <td colspan="10" class="l">Seksi : <b>${esc(T.section)}</b></td>
    <td colspan="15" class="l">Revisi : <b>${esc(T.revision)}</b></td>
    <td colspan="3" rowspan="3" class="c" style="vertical-align:middle;${clsBg(apKaDept)}">${signText(apKaDept)}</td>
    <td rowspan="3" class="c" style="vertical-align:middle;${clsBg(apKaSie)}">${signText(apKaSie)}</td>
    <td rowspan="3" class="c" style="vertical-align:middle;${clsBg(apKaSubSie)}">${signText(apKaSubSie)}</td>
  </tr>`);

  rows.push(`<tr style="height:22pt;">
    <td colspan="3" class="c b" style="background:#f8fafc;">CHILLER LSBLG250</td>
    <td colspan="10" class="l">No. Alat : <b>${esc(sh.equipment_no || '-')}</b></td>
    <td colspan="15" class="l">Tgl. : <b>${esc(sh.form_date || '-')}</b></td>
  </tr>`);

  rows.push(`<tr style="height:22pt;">
    <td colspan="3" class="c" style="background:#f8fafc;"></td>
    <td colspan="10" class="l">M/C Type : <b>CHILLER LSBLG250</b></td>
    <td colspan="15" class="l">Page : <b>1 dari 1</b></td>
  </tr>`);

  // Column Headers
  rows.push(`<tr style="height:22pt;">
    <td rowspan="3" class="hd">UNIT</td>
    <td rowspan="3" class="hd">NO</td>
    <td rowspan="3" class="hd">BAGIAN PERALATAN</td>
    <td rowspan="3" class="hd">ITEM INSPEKSI</td>
    <td rowspan="3" class="hd">PERIODE</td>
    <td rowspan="3" class="hd">JENIS INST.</td>
    <td colspan="32" class="hd">HASIL PEMERIKSAAN TAHUN <u>&nbsp;${sh.year}&nbsp;</u></td>
    <td colspan="2" rowspan="3" class="hd">KETERANGAN</td>
  </tr>`);

  rows.push(`<tr style="height:20pt;">
    <td colspan="32" class="hd" style="font-size:11pt;">BULAN : <b>${esc((MONTHS[sh.month - 1] || '').toUpperCase())}</b></td>
  </tr>`);

  const dayHeaderCells = days.map((d) => `<td class="c b" style="background:#f1f5f9;">${d}</td>`).join('');
  rows.push(`<tr style="height:22pt;"><td class="hd">Shift</td>${dayHeaderCells}</tr>`);

  // --- 1. TABLE DAILY CHECK ---
  rows.push(`<tr style="height:22pt;"><td colspan="40" class="sect">TABLE DAILY CHECK</td></tr>`);
  const dailyItems = items.filter((it) => it.item_no <= 6 || (it.period && (it.period.includes('day') || it.period.includes('Hari'))));
  dailyItems.forEach((it, idx) => {
    const rm = S.remarks[it.id] !== undefined ? S.remarks[it.id] : (it.standard || '');
    const itemCells = days.map((d) => {
      const e = S.entries[it.id]?.[d];
      if (!e) return '<td class="c"></td>';
      const bad = outOfLimit(it, e.value);
      const content = e.symbol ? `<b>${esc(e.symbol)}</b>` : (e.value !== null ? fmtNum(e.value) : '');
      return `<td class="c" style="${bad ? 'background:#fee2e2;color:#991b1b;font-weight:bold;' : ''}">${content}</td>`;
    }).join('');

    rows.push(`<tr style="height:28pt;">
      ${idx === 0 ? `<td rowspan="${dailyItems.length}" class="c b" style="background:#f8fafc;vertical-align:middle;">CHILLER LSBLG250</td>` : ''}
      <td class="c">${it.no}</td>
      <td class="l b">${esc(it.part)}</td>
      <td class="c">${esc(it.method)}</td>
      <td class="c">${esc(it.period)}</td>
      <td class="c">${esc(it.inst || '')}</td>
      <td class="c b">I</td>
      ${itemCells}
      <td colspan="2" class="l" style="font-size:8.5pt;">${esc(rm)}</td>
    </tr>`);
  });

  // --- 2. TABLE WEEKLY PREVENTIVE ---
  rows.push(`<tr style="height:24pt;">
    <td colspan="7" class="sect b">TABLE WEEKLY PREVENTIVE</td>
    <td colspan="8" class="c b" style="background:#f1f5f9;">1</td>
    <td colspan="8" class="c b" style="background:#f1f5f9;">2</td>
    <td colspan="8" class="c b" style="background:#f1f5f9;">3</td>
    <td colspan="7" class="c b" style="background:#f1f5f9;">4</td>
    <td colspan="2" class="hd"></td>
  </tr>`);

  const weeklyItems = items.filter((it) => it.item_no > 6 || (it.period && (it.period.includes('Week') || it.period.includes('Minggu'))));
  const totalWeeklyRows = 8;
  for (let idx = 0; idx < totalWeeklyRows; idx++) {
    const it = weeklyItems[idx];
    const isBlank = !it;
    const rm = it ? (S.remarks[it.id] !== undefined ? S.remarks[it.id] : (it.standard || '')) : '';
    const itemCells = days.map((d) => {
      if (isBlank) return '<td class="c"></td>';
      const e = S.entries[it.id]?.[d];
      if (!e) return '<td class="c"></td>';
      const bad = outOfLimit(it, e.value);
      const content = e.symbol ? `<b>${esc(e.symbol)}</b>` : (e.value !== null ? fmtNum(e.value) : '');
      return `<td class="c" style="${bad ? 'background:#fee2e2;color:#991b1b;font-weight:bold;' : ''}">${content}</td>`;
    }).join('');

    rows.push(`<tr style="height:28pt;">
      ${idx === 0 ? `<td rowspan="${totalWeeklyRows}" class="c b" style="background:#f8fafc;vertical-align:middle;">CHILLER LSBLG250</td>` : ''}
      <td class="c">${isBlank ? '' : (idx + 1)}</td>
      <td class="l b">${isBlank ? '' : esc(it.part)}</td>
      <td class="c">${isBlank ? '' : esc(it.method)}</td>
      <td class="c">${isBlank ? '' : esc(it.period)}</td>
      <td class="c">${isBlank ? '' : esc(it.inst || '')}</td>
      <td class="c b">${isBlank ? '' : 'I'}</td>
      ${itemCells}
      <td colspan="2" class="l" style="font-size:8.5pt;">${isBlank ? '' : esc(rm)}</td>
    </tr>`);
  }

  // Footers
  renderExcelFooterChiller(rows, S, days);

  const colWidths = [45, 30, 200, 120, 80, 65, 45, ...Array(31).fill(30), 85, 85];
  downloadHtmlTable(rows, colWidths, 'Checksheet_Chiller_Daily_Weekly', sh.month, sh.year);
}

// ------------------------------------------------------------------ 3. Chiller Monthly Excel (CHILLER_M)
function exportChillerMonthlyExcel(S) {
  const { sheet: sh, template: T } = S;
  const items = T.items;

  const apKaDept = findAp(S, 'DOC', 0, 'KADEPT');
  const apKaSie = findAp(S, 'DOC', 0, 'KASIE');
  const apKaSubSie = findAp(S, 'DOC', 0, 'KASUBSIE');
  const clsBg = (a) => (a ? (a.status === 'APPROVED' ? 'background:#cdf0d6;color:#0b5a22;' : 'background:#ffd6d6;color:#8d1111;') : '');

  const rows = [];

  // Kop form
  rows.push(`<tr style="height:24pt;">
    <td colspan="3" class="c b" style="font-size:11pt;background:#f8fafc;">PT. CENTURY BATTERIES INDONESIA</td>
    <td colspan="3" rowspan="4" class="c b" style="font-size:15pt;background:#ffffff;vertical-align:middle;">LEMBAR HASIL INSPEKSI DAN MAINTENANCE</td>
    <td colspan="6" class="l">Dept : <b>${esc(T.department)}</b></td>
    <td colspan="5" class="l">No. Form : <b>${esc(T.form_no)}</b></td>
    <td class="hd">Ka.Dept</td>
    <td class="hd">Ka.Sie</td>
    <td class="hd">Ka.Sub Sie</td>
  </tr>`);

  rows.push(`<tr style="height:22pt;">
    <td colspan="3" class="c" style="font-style:italic;background:#f8fafc;">Maintenance Department</td>
    <td colspan="6" class="l">Seksi : <b>${esc(T.section)}</b></td>
    <td colspan="5" class="l">Revisi : <b>${esc(T.revision)}</b></td>
    <td rowspan="3" class="c" style="vertical-align:middle;${clsBg(apKaDept)}">${signText(apKaDept)}</td>
    <td rowspan="3" class="c" style="vertical-align:middle;${clsBg(apKaSie)}">${signText(apKaSie)}</td>
    <td rowspan="3" class="c" style="vertical-align:middle;${clsBg(apKaSubSie)}">${signText(apKaSubSie)}</td>
  </tr>`);

  rows.push(`<tr style="height:22pt;">
    <td colspan="3" class="c b" style="background:#f8fafc;">CHILLER LSBLG250</td>
    <td colspan="6" class="l">No. Alat : <b>${esc(sh.equipment_no || '-')}</b></td>
    <td colspan="5" class="l">Tgl. : <b>${esc(sh.form_date || '-')}</b></td>
  </tr>`);

  rows.push(`<tr style="height:22pt;">
    <td colspan="3" class="c" style="background:#f8fafc;"></td>
    <td colspan="6" class="l">M/C Type : <b>CHILLER LSBLG250</b></td>
    <td colspan="5" class="l">Page : <b>1 dari 1</b></td>
  </tr>`);

  // Column Headers
  rows.push(`<tr style="height:22pt;">
    <td rowspan="3" class="hd">UNIT</td>
    <td rowspan="3" class="hd">NO</td>
    <td rowspan="3" class="hd">BAGIAN PERALATAN</td>
    <td rowspan="3" class="hd">ITEM INSPEKSI</td>
    <td rowspan="3" class="hd">PERIODE</td>
    <td rowspan="3" class="hd">JENIS INST.</td>
    <td colspan="12" class="hd">HASIL PEMERIKSAAN TAHUN <u>&nbsp;${sh.year}&nbsp;</u></td>
    <td colspan="2" rowspan="3" class="hd">KETERANGAN</td>
  </tr>`);

  const monthNumCells = Array.from({ length: 12 }, (_, i) => `<td class="c b" style="background:#f1f5f9;">${i + 1}</td>`).join('');
  rows.push(`<tr style="height:20pt;">${monthNumCells}</tr>`);
  const tglCells = Array.from({ length: 12 }, () => `<td class="c" style="font-size:8pt;color:#64748b;">tgl</td>`).join('');
  rows.push(`<tr style="height:18pt;">${tglCells}</tr>`);

  rows.push(`<tr style="height:22pt;"><td colspan="20" class="sect">TABLE</td></tr>`);

  items.forEach((it, idx) => {
    const rm = S.remarks[it.id] !== undefined ? S.remarks[it.id] : (it.standard || '');
    const mCells = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const e = S.entries[it.id]?.[m];
      if (!e) return '<td class="c"></td>';
      const content = e.symbol ? `<b>${esc(e.symbol)}</b>` : (e.value !== null ? fmtNum(e.value) : '');
      return `<td class="c">${content}</td>`;
    }).join('');

    rows.push(`<tr style="height:26pt;">
      ${idx === 0 ? `<td rowspan="${items.length}" class="c b" style="background:#f8fafc;vertical-align:middle;">CHILLER LSBLG250</td>` : ''}
      <td class="c">${it.no}</td>
      <td class="l b">${esc(it.part)}</td>
      <td class="l">${esc(it.method)}</td>
      <td class="c">${esc(it.period)}</td>
      <td class="c">${esc(it.inst || '')}</td>
      ${mCells}
      <td colspan="2" class="l" style="font-size:8.5pt;">${esc(rm)}</td>
    </tr>`);
  });

  // Footer Bulanan (Sesuai 6 baris sheet3.xml)
  const picCells = Array.from({ length: 12 }, (_, i) => {
    const n = S.pics[i + 1];
    return `<td class="c" style="font-size:8.5pt;">${n ? esc(n.split(' ')[0]) : ''}</td>`;
  }).join('');

  const kasubCells = Array.from({ length: 12 }, (_, i) => {
    const a = findAp(S, 'DAY', i + 1, 'KASUBSIE');
    const bg = a ? (a.status === 'APPROVED' ? 'background:#cdf0d6;color:#0b5a22;' : 'background:#ffd6d6;color:#8d1111;') : '';
    return `<td class="c" style="font-weight:bold;${bg}">${a ? (a.status === 'APPROVED' ? '✔' : '✖') : ''}</td>`;
  }).join('');

  const kasieCells = Array.from({ length: 12 }, (_, i) => {
    const a = findAp(S, 'DAY', i + 1, 'KASIE') || findAp(S, 'WEEK', i + 1, 'KASIE');
    const bg = a ? (a.status === 'APPROVED' ? 'background:#cdf0d6;color:#0b5a22;' : 'background:#ffd6d6;color:#8d1111;') : '';
    return `<td class="c" style="font-weight:bold;${bg}">${a ? (a.status === 'APPROVED' ? '✔' : '✖') : ''}</td>`;
  }).join('');

  // Row 30
  rows.push(`<tr style="height:22pt;">
    <td colspan="3"></td>
    <td class="hd">SIMBOL</td>
    <td rowspan="3" class="c b" style="vertical-align:middle;background:#f8fafc;font-size:9pt;">
      Jumlah Item Check<br style="mso-data-placement:same-cell;">
      <b style="font-size:11pt;">${S.stats.checked_total} / ${S.stats.expected_total}</b>
    </td>
    <td class="hd">PIC</td>
    ${picCells}
    <td colspan="2" class="hd">JENIS INSTRUKSI</td>
  </tr>`);

  // Row 31
  rows.push(`<tr style="height:22pt;">
    <td colspan="3" rowspan="5" class="l" style="vertical-align:top;background:#f8fafc;font-size:8.5pt;">
      <b>CATATAN SERVICE :</b><br>
      • 1/ 4 Bln : 4000 jam<br>
      • 1/6 Bln : 8000 jam<br>
      • 1/1 Thn : 12000 jam
    </td>
    <td class="l" style="font-size:8pt;">V : TIDAK ADA PROBLEM</td>
    <td class="hd">Ka.Sub Sie</td>
    ${kasubCells}
    <td colspan="2" class="l" style="font-size:8pt;">B : BERSIHKAN / C : Check</td>
  </tr>`);

  // Row 32
  rows.push(`<tr style="height:22pt;">
    <td class="l" style="font-size:8pt;">X : BELUM OK / PERLU DICEK</td>
    <td class="hd">Ka.Sie</td>
    ${kasieCells}
    <td colspan="2" class="l" style="font-size:8pt;">G : GANTI / S : Service</td>
  </tr>`);

  // Row 33
  rows.push(`<tr style="height:22pt;">
    <td class="l" style="font-size:8pt;">XF : PROBLEM SUDAH DIPERBAIKI</td>
    <td rowspan="3" class="c" style="background:#f8fafc;"></td>
    <td colspan="13" class="c b" style="background:#f8fafc;font-size:8.5pt;">
      SIRKULASI PENYERAHAN DOKUMEN
    </td>
    <td colspan="2" class="l" style="font-size:8pt;">K : KENCANGKAN / A : Adjust</td>
  </tr>`);

  // Row 34
  rows.push(`<tr style="height:22pt;">
    <td class="l" style="font-size:8pt;">O : PENGGANTIAN PART</td>
    <td colspan="13" rowspan="2" class="c b" style="vertical-align:middle;font-size:8.5pt;">
      PIC MTN ➔ Ka.Sub Sie ➔ Ka.Sie ➔ Ka.Dept
    </td>
    <td colspan="2" class="l" style="font-size:8pt;">T : TAMBAH</td>
  </tr>`);

  // Row 35
  rows.push(`<tr style="height:22pt;">
    <td></td>
    <td colspan="2" class="l" style="font-size:8pt;">U : UKUR</td>
  </tr>`);

  const colWidths = [45, 30, 220, 120, 85, 65, ...Array(12).fill(48), 48, 48];
  downloadHtmlTable(rows, colWidths, 'Checksheet_Chiller_Bulanan', sh.month, sh.year);
}

// ------------------------------------------------------------------ 4. Chiller Standard Preventive Excel (CHILLER_S)
function exportChillerStandardExcel(S) {
  const { sheet: sh, template: T } = S;
  const items = T.items;

  const apKaDept = findAp(S, 'DOC', 0, 'KADEPT');
  const apKaSie = findAp(S, 'DOC', 0, 'KASIE');
  const apKaSubSie = findAp(S, 'DOC', 0, 'KASUBSIE');
  const clsBg = (a) => (a ? (a.status === 'APPROVED' ? 'background:#cdf0d6;color:#0b5a22;' : 'background:#ffd6d6;color:#8d1111;') : '');

  const rows = [];

  // Kop form (Sesuai sheet STD lsbg (2) pada chiler contoh_aset.xlsx)
  rows.push(`<tr style="height:24pt;">
    <td colspan="2" class="c b" style="font-size:11pt;background:#f8fafc;">PT. CENTURY BATTERIES INDONESIA</td>
    <td colspan="2" rowspan="3" class="c b" style="font-size:14pt;background:#ffffff;vertical-align:middle;">STANDARD<br style="mso-data-placement:same-cell;">PREVENTIVE MACHINE</td>
    <td colspan="2" class="l">Dept. : <b>${esc(T.department || 'PLANT SERVICE')}</b></td>
    <td rowspan="3" class="c b" style="font-size:12pt;background:#f8fafc;vertical-align:middle;">${esc(T.machine_type || 'CHILLER LSBLG250')}</td>
    <td colspan="2" class="l">No Form : <b>${esc(T.form_no || 'Form-PLS-MTC-D04')}</b></td>
    <td class="hd" style="width:75pt;">Diketahui</td>
    <td class="hd" style="width:75pt;">Diketahui</td>
    <td class="hd" style="width:75pt;">Dibuat</td>
  </tr>`);

  rows.push(`<tr style="height:22pt;">
    <td colspan="2" class="c" style="font-style:italic;background:#f8fafc;">Plant Service Department</td>
    <td colspan="2" class="l">Seksi : <b>${esc(T.section || 'WET CHARGING')}</b></td>
    <td colspan="2" class="l">Revisi : <b>${esc(T.revision || '0')}</b></td>
    <td rowspan="2" class="c" style="vertical-align:middle;${clsBg(apKaDept)}">${signText(apKaDept)}</td>
    <td rowspan="2" class="c" style="vertical-align:middle;${clsBg(apKaSie)}">${signText(apKaSie)}</td>
    <td rowspan="2" class="c" style="vertical-align:middle;${clsBg(apKaSubSie)}">${signText(apKaSubSie)}</td>
  </tr>`);

  rows.push(`<tr style="height:22pt;">
    <td colspan="2" class="c b" style="background:#f8fafc;">CHILLER LSBLG250</td>
    <td colspan="2" class="l">M/C type : <b>${esc(T.machine_type || 'CHILLER LSBLG250')}</b></td>
    <td colspan="2" class="l">Page : <b>${esc(T.page_info || '1 dari 1')}</b></td>
  </tr>`);

  // Signatures sub-label row
  rows.push(`<tr style="height:18pt;background:#f1f5f9;">
    <td colspan="9" style="border:none;"></td>
    <td class="c b" style="font-size:8.5pt;">Ka.Dept PLS</td>
    <td class="c b" style="font-size:8.5pt;">Ka.Sie Eng</td>
    <td class="c b" style="font-size:8.5pt;">Ka.Sie PLS</td>
  </tr>`);

  // Table Column Headers (12 columns)
  rows.push(`<tr style="height:24pt;">
    <td colspan="2" class="hd" style="background:#e2e8f0;font-size:9.5pt;">FOTO / LAYOUT KOMPONEN</td>
    <td class="hd">UNIT</td>
    <td colspan="2" class="hd">ITEM CHECK</td>
    <td class="hd">CONTENTS</td>
    <td class="hd">Frek</td>
    <td class="hd">Act</td>
    <td colspan="2" class="hd">STANDARD</td>
    <td class="hd">DOCUMENT</td>
    <td class="hd">SAFETY STD</td>
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

  const photoCell = `<td colspan="2" rowspan="31" class="c" style="vertical-align:top;background:#f8fafc;padding:6pt;">
    <b>CHILLER LSBLG250</b><br style="mso-data-placement:same-cell;"><span style="font-size:8pt;color:#555;">(Lihat Lampiran Foto &amp; Dokumen Gambar)</span><br style="mso-data-placement:same-cell;"><br style="mso-data-placement:same-cell;">
    <span style="font-size:7.5pt;text-align:left;display:block;">
    ① Panel Kontrol<br style="mso-data-placement:same-cell;">
    ② Filter Core Dryer<br style="mso-data-placement:same-cell;">
    ③ Solenoid Valve<br style="mso-data-placement:same-cell;">
    ④ Expansion Valve<br style="mso-data-placement:same-cell;">
    ⑤ Motor Pump<br style="mso-data-placement:same-cell;">
    ⑥ Valve In Out Cooling<br style="mso-data-placement:same-cell;">
    ⑦ Kondensor<br style="mso-data-placement:same-cell;">
    ⑧ Evaporator<br style="mso-data-placement:same-cell;">
    ⑨ Cooling Tower<br style="mso-data-placement:same-cell;">
    ⑩ Tekanan Freon / Gauge<br style="mso-data-placement:same-cell;">
    ⑪ Flow Switch Kontrol
    </span>
  </td>`;

  items.forEach((it, idx) => {
    const dInfo = displayMap[it.no] || { num: it.no, span: 1 };
    rows.push(`<tr style="height:20pt;">
      ${idx === 0 ? photoCell : ''}
      ${idx === 0 ? `<td rowspan="30" class="c b" style="vertical-align:middle;background:#f8fafc;">A. AIR DRYER</td>` : ''}
      ${!dInfo.skipHeader ? `<td rowspan="${dInfo.span}" class="c b">${dInfo.num}</td>` : ''}
      ${!dInfo.skipHeader ? `<td rowspan="${dInfo.span}" class="l b">${esc(it.part)}</td>` : ''}
      <td class="l">${esc(it.method)}</td>
      <td class="c">${esc(it.period)}</td>
      <td class="c b">${esc(it.inst || '')}</td>
      <td colspan="2" class="l">${esc(it.standard || '')}</td>
      <td class="c">Check Sheet</td>
      <td class="c b" style="color:#b91c1c;">M/C OFF</td>
    </tr>`);
  });

  // Empty rows (11 rows)
  for (let r = 0; r < 11; r++) {
    rows.push(`<tr style="height:18pt;">
      <td class="c"></td>
      <td class="l"></td>
      <td class="l"></td>
      <td class="c"></td>
      <td class="c"></td>
      <td colspan="2" class="l"></td>
      <td class="c"></td>
      <td class="c"></td>
    </tr>`);
  }

  // Row 36: Catatan & Tugas Legend
  rows.push(`<tr style="height:70pt;">
    <td colspan="4" class="l" style="vertical-align:top;background:#f8fafc;padding:6pt;">
      <b>Catatan</b><br style="mso-data-placement:same-cell;">
      <u><b>CATATAN SERVICE :</b></u><br style="mso-data-placement:same-cell;">
      1/ 4 Bln &nbsp;:&nbsp; 4000 jam<br style="mso-data-placement:same-cell;">
      1/6 Bln &nbsp;:&nbsp; 8000 jam<br style="mso-data-placement:same-cell;">
      1/1 Thn &nbsp;:&nbsp; 12000 jam
    </td>
    <td colspan="6" class="l" style="vertical-align:top;background:#ffffff;padding:6pt;">
      <b>Tugas</b><br style="mso-data-placement:same-cell;">
      <b>A</b> &nbsp; Adjust/setting &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <b>K</b> &nbsp; Kencangkan<br style="mso-data-placement:same-cell;">
      <b>B</b> &nbsp; Bersihkan &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <b>S</b> &nbsp; Service<br style="mso-data-placement:same-cell;">
      <b>C</b> &nbsp; Cek/Periksa &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <b>T</b> &nbsp; Tambah<br style="mso-data-placement:same-cell;">
      <b>G</b> &nbsp; Ganti &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <b>U</b> &nbsp; Ukur
    </td>
  </tr>`);

  const colWidths = [110, 110, 45, 30, 140, 80, 65, 35, 120, 120, 75, 75];
  downloadHtmlTable(rows, colWidths, 'Checksheet_Chiller_Standard_Preventive', sh.month || 1, sh.year);
}

// ------------------------------------------------------------------ Footers Helper
function renderExcelFooterStandard(rows, S, days, nF, flowSummary) {
  const picCells = days.map((d) => {
    const m = dayMeta(S, d);
    if (m.off) return '<td style="background:#e5e7eb;"></td>';
    const n = S.pics[d];
    return `<td class="c" style="font-size:8.5pt;">${n ? esc(n.split(' ')[0]) : ''}</td>`;
  }).join('');

  rows.push(`<tr style="height:34pt;">
    <td colspan="3" class="redh">TEMUAN PROBLEM</td>
    <td class="hd">SIMBOL</td>
    <td rowspan="7" class="c"></td>
    <td rowspan="3" class="c" style="vertical-align:middle;background:#f8fafc;">
      Jumlah Item Check<br style="mso-data-placement:same-cell;">
      <b style="font-size:11pt;">${S.stats.checked_total} / ${S.stats.expected_total}</b>
    </td>
    <td class="hd">PIC MTN</td>
    <td class="c b">I</td>
    ${picCells}
    <td colspan="2" class="hd">JENIS INSTRUKSI</td>
  </tr>`);

  const kasubsieDayCells = days.map((d) => {
    const m = dayMeta(S, d);
    if (m.off) return '<td style="background:#e5e7eb;"></td>';
    const a = findAp(S, 'DAY', d, 'KASUBSIE');
    const bg = a ? (a.status === 'APPROVED' ? 'background:#cdf0d6;color:#0b5a22;' : 'background:#ffd6d6;color:#8d1111;') : '';
    return `<td class="c" style="font-weight:bold;${bg}">${a ? (a.status === 'APPROVED' ? '✔' : '✖') : ''}</td>`;
  }).join('');

  rows.push(`<tr style="height:24pt;">
    <td colspan="3" rowspan="6" class="c b" style="vertical-align:middle;background:#f8fafc;font-size:11pt;">
      ${nF ? nF + ' temuan tercatat' : 'Tidak ada temuan'}
    </td>
    <td class="l">V : TIDAK ADA PROBLEM</td>
    <td colspan="2" class="hd">KaSubSie MTN</td>
    ${kasubsieDayCells}
    <td colspan="2" class="l">A : ADJUST</td>
  </tr>`);

  const kasieWeekCells = (S.config.week_blocks || []).map(([f, t], i) => {
    const a = findAp(S, 'WEEK', i + 1, 'KASIE');
    const span = t - f + 1;
    const bg = a ? (a.status === 'APPROVED' ? 'background:#cdf0d6;color:#0b5a22;' : 'background:#ffd6d6;color:#8d1111;') : '';
    const txt = a ? (a.status === 'APPROVED' ? '✔ Approved' : '✖ Rejected') : `${f}–${Math.min(t, 31)}`;
    return `<td colspan="${span}" class="c b" style="${bg}">${txt}</td>`;
  }).join('');

  rows.push(`<tr style="height:24pt;">
    <td class="l">X : BELUM OK / PERLU DICEK</td>
    <td colspan="2" class="hd">Kasie MTN</td>
    ${kasieWeekCells}
    <td colspan="2" class="l">B : BERSIHKAN</td>
  </tr>`);

  rows.push(`<tr style="height:22pt;">
    <td class="l">XF : PROBLEM SUDAH DIPERBAIKI</td>
    <td rowspan="4" class="c"></td>
    <td colspan="33" class="hd" style="font-size:10pt;">SIRKULASI PENYERAHAN DOKUMEN</td>
    <td colspan="2" class="l">C : CHECK</td>
  </tr>`);

  rows.push(`<tr style="height:26pt;">
    <td class="l">O : PENGGANTIAN PART</td>
    <td colspan="33" rowspan="3" class="c b" style="vertical-align:middle;background:#f8fafc;color:#1e293b;font-size:9.5pt;">
      ${esc(flowSummary)}
    </td>
    <td colspan="2" class="l">T : TAMBAH</td>
  </tr>`);

  rows.push(`<tr style="height:20pt;"><td class="l"></td><td colspan="2" class="l">U : UKUR</td></tr>`);
  rows.push(`<tr style="height:20pt;"><td class="l"></td><td colspan="2" class="l">S : SERVICE</td></tr>`);
}

function renderExcelFooterChiller(rows, S, days) {
  const sym = [
    'V : TIDAK ADA PROBLEM',
    'X : BELUM OK / PERLU DICEK',
    'XF : PROBLEM SUDAH DIPERBAIKI',
    'O : PENGGANTIAN PART',
  ];

  const picCells = (shift) => days.map((d) => `<td class="c">${S.pics[d] ? esc(S.pics[d].split(' ')[0]) : ''}</td>`).join('');
  const kasubCells = (shift) => days.map((d) => {
    const a = findAp(S, 'DAY', d, 'KASUBSIE');
    return `<td class="c">${a ? (a.status === 'APPROVED' ? '✔' : '✖') : ''}</td>`;
  }).join('');
  const kasieCells = (shift) => days.map((d) => {
    const a = findAp(S, 'DAY', d, 'KASIE');
    return `<td class="c">${a ? (a.status === 'APPROVED' ? '✔' : '✖') : ''}</td>`;
  }).join('');

  // Row 39: Red block (c:3), SIMBOL, Jumlah Item Check (r:6), PIC (r:2), I, 31 cells, JENIS INSTRUKSI
  rows.push(`<tr style="height:24pt;">
    <td colspan="3" style="background:#ff0000;border:1pt solid #000;"></td>
    <td class="hd">SIMBOL</td>
    <td rowspan="6" class="c b" style="vertical-align:middle;font-size:9pt;">Jumlah Item Check<br>${S.stats.checked_total} / ${S.stats.expected_total}</td>
    <td rowspan="2" class="hd" style="vertical-align:middle;">PIC</td>
    <td class="c b">I</td>
    ${picCells(1)}
    <td class="hd">JENIS INSTRUKSI</td>
  </tr>`);

  // Row 40: CATATAN SERVICE (c:3, r:8), V : TIDAK ADA PROBLEM, II, 31 cells, A : ADJUST
  rows.push(`<tr style="height:22pt;">
    <td colspan="3" rowspan="8" class="l" style="vertical-align:top;background:#ffffff;border:1pt solid #000;font-size:9pt;padding:6pt;">
      <b>CATATAN SERVICE :</b><br><br>
      • 1/ 4 Bln : 4000 jam<br>
      • 1/6 Bln : 8000 jam<br>
      • 1/1 Thn : 12000 jam
    </td>
    <td class="l" style="font-size:8pt;">${esc(sym[0])}</td>
    <td class="c b">II</td>
    ${picCells(2)}
    <td class="l" style="font-size:8pt;">A : ADJUST</td>
  </tr>`);

  // Row 41: X : BELUM OK, KaSub (r:2), I, 31 cells, B : BERSIHKAN
  rows.push(`<tr style="height:22pt;">
    <td class="l" style="font-size:8pt;">${esc(sym[1])}</td>
    <td rowspan="2" class="hd" style="vertical-align:middle;">KaSub</td>
    <td class="c b">I</td>
    ${kasubCells(1)}
    <td class="l" style="font-size:8pt;">B : BERSIHKAN</td>
  </tr>`);

  // Row 42: XF : PROBLEM SUDAH DIPERBAIKI, II, 31 cells, C : CHECK
  rows.push(`<tr style="height:22pt;">
    <td class="l" style="font-size:8pt;">${esc(sym[2])}</td>
    <td class="c b">II</td>
    ${kasubCells(2)}
    <td class="l" style="font-size:8pt;">C : CHECK</td>
  </tr>`);

  // Row 43: O : PENGGANTIAN PART, Ka.Sie (r:2), I, 31 cells, G : GANTI
  rows.push(`<tr style="height:22pt;">
    <td class="l" style="font-size:8pt;">${esc(sym[3])}</td>
    <td rowspan="2" class="hd" style="vertical-align:middle;">Ka.Sie</td>
    <td class="c b">I</td>
    ${kasieCells(1)}
    <td class="l" style="font-size:8pt;">G : GANTI</td>
  </tr>`);

  // Row 44: empty, II, 31 cells, K : KENCANGKAN
  rows.push(`<tr style="height:22pt;">
    <td class="l"></td>
    <td class="c b">II</td>
    ${kasieCells(2)}
    <td class="l" style="font-size:8pt;">K : KENCANGKAN</td>
  </tr>`);

  // Row 45: empty, empty (r:3), SIRKULASI PENYERAHAN DOKUMEN (c:33), T : TAMBAH
  rows.push(`<tr style="height:22pt;">
    <td class="l"></td>
    <td rowspan="3" class="c"></td>
    <td colspan="33" class="hd" style="font-size:10pt;">SIRKULASI PENYERAHAN DOKUMEN</td>
    <td class="l" style="font-size:8pt;">T : TAMBAH</td>
  </tr>`);

  // Row 46: empty, Approval Flow (c:33, r:2), U : UKUR
  rows.push(`<tr style="height:24pt;">
    <td class="l"></td>
    <td colspan="33" rowspan="2" class="c b" style="vertical-align:middle;background:#f8fafc;font-size:9.5pt;">
      PIC MTN ➔ Ka.Sub Sie ➔ Ka.Sie ➔ Ka.Dept
    </td>
    <td class="l" style="font-size:8pt;">U : UKUR</td>
  </tr>`);

  // Row 47: empty, S : SERVICE
  rows.push(`<tr style="height:22pt;">
    <td class="l"></td>
    <td class="l" style="font-size:8pt;">S : SERVICE</td>
  </tr>`);
}

function downloadHtmlTable(rows, colWidths, prefix, month, year) {
  const colTags = colWidths.map((w) => `<col width="${w}">`).join('');
  const monthName = MONTHS[(month || 1) - 1] || '';
  const title = `${prefix}_${monthName}_${year || ''}`;

  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <style>
    body { font-family: Calibri, Arial, sans-serif; font-size: 10pt; margin: 0; padding: 0; }
    table { border-collapse: collapse; table-layout: fixed; width: 100%; }
    td, th {
      border: 0.5pt solid #000000;
      padding: 3px 4px;
      vertical-align: middle;
      font-size: 9pt;
      mso-number-format: "\\@";
    }
    .num { mso-number-format: "General"; text-align: center; }
    .c { text-align: center; }
    .l { text-align: left; }
    .r { text-align: right; }
    .b { font-weight: bold; }
    .hd { background-color: #f1f5f9; font-weight: bold; text-align: center; font-size: 9pt; }
    .sect { background-color: #e2e8f0; font-weight: bold; font-size: 10pt; padding-left: 8px; }
    .redh { background-color: #ff0000; color: #ffffff; font-weight: bold; text-align: center; font-size: 10pt; }
  </style>
</head>
<body>
  <table>
    <colgroup>${colTags}</colgroup>
    <tbody>
      ${rows.join('\n')}
    </tbody>
  </table>
</body>
</html>`;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
