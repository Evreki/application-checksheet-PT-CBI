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

  // --- Row 1: Kop 1 ---
  rows.push(`<tr style="height:24pt;">
    <td colspan="3" class="c b" style="font-size:11pt;background:#f8fafc;">PT. CENTURY BATTERIES INDONESIA</td>
    <td colspan="5" rowspan="4" class="c b" style="font-size:16pt;background:#ffffff;vertical-align:middle;">LEMBAR HASIL INSPEKSI HARIAN</td>
    <td colspan="10" class="l">Dept : <b>${esc(T.department)}</b></td>
    <td colspan="18" class="l">No. Form : <b>${esc(T.form_no)}</b></td>
    <td colspan="3" class="hd">Ka.Dept</td>
    <td class="hd">Ka.Sie</td>
    <td class="hd">Ka.Sub Sie</td>
  </tr>`);

  // --- Row 2: Kop 2 ---
  rows.push(`<tr style="height:22pt;">
    <td colspan="3" class="c" style="font-style:italic;background:#f8fafc;">Maintenance Department</td>
    <td colspan="10" class="l">Seksi : <b>${esc(T.section)}</b></td>
    <td colspan="18" class="l">Revisi : <b>${esc(T.revision)}</b></td>
    <td colspan="3" rowspan="3" class="c" style="vertical-align:middle;${clsBg(apKaDept)}">${signText(apKaDept)}</td>
    <td rowspan="3" class="c" style="vertical-align:middle;${clsBg(apKaSie)}">${signText(apKaSie)}</td>
    <td rowspan="3" class="c" style="vertical-align:middle;${clsBg(apKaSubSie)}">${signText(apKaSubSie)}</td>
  </tr>`);

  // --- Row 3: Kop 3 ---
  rows.push(`<tr style="height:22pt;">
    <td colspan="3" class="c b" style="background:#f8fafc;">${esc(T.machine_type)}</td>
    <td colspan="10" class="l">No. Alat : <b>${esc(sh.equipment_no || '-')}</b></td>
    <td colspan="18" class="l">Tgl. : <b>${esc(sh.form_date || '-')}</b></td>
  </tr>`);

  // --- Row 4: Kop 4 ---
  rows.push(`<tr style="height:22pt;">
    <td colspan="3" class="c" style="background:#f8fafc;"></td>
    <td colspan="10" class="l">M/C Type : <b>${esc(T.machine_type)}</b></td>
    <td colspan="18" class="l">Page : <b>${esc(T.page_info)}</b></td>
  </tr>`);

  // --- Row 5: Column Headers 1 ---
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

  // --- Row 6: Column Headers 2 (Bulan) ---
  rows.push(`<tr style="height:20pt;">
    <td colspan="32" class="hd" style="font-size:11pt;">BULAN : <b>${esc((MONTHS[sh.month - 1] || '').toUpperCase())}</b></td>
  </tr>`);

  // --- Row 7: Column Headers 3 (Shift & Days) ---
  const dayHeaderCells = days.map((d) => {
    const m = dayMeta(S, d);
    const bg = m.off ? 'background:#e2e8f0;' : m.sun ? 'background:#fee2e2;color:#991b1b;' : 'background:#f1f5f9;';
    return `<td class="c b" style="${bg}">${d}</td>`;
  }).join('');
  rows.push(`<tr style="height:22pt;"><td class="hd">Shift</td>${dayHeaderCells}</tr>`);

  // --- Row 8: Section Header ---
  rows.push(`<tr style="height:22pt;"><td colspan="41" class="sect">TABLE DAILY CHECK</td></tr>`);

  // --- Inspection Items ---
  items.forEach((it, idx) => {
    const itemCells = days.map((d) => {
      const m = dayMeta(S, d);
      if (m.off) return '<td style="background:#e5e7eb;"></td>';

      if (it.calc) {
        const v = S.derived[it.id]?.[d];
        return `<td class="num" style="background:#f9fafb;">${v === undefined ? '' : fmtNum(v)}</td>`;
      }

      const e = S.entries[it.id]?.[d];
      if (!e) {
        const bg = m.sun ? 'background:#fef2f2;' : '';
        return `<td class="c" style="${bg}"></td>`;
      }

      const bad = outOfLimit(it, e.value);
      let content = '';
      if (e.symbol && e.value !== null && e.value !== undefined) {
        content = `<b>${esc(e.symbol)}</b><br style="mso-data-placement:same-cell;"><span style="font-size:8.5pt;">${fmtNum(e.value)}</span>`;
      } else if (e.symbol) {
        content = `<b>${esc(e.symbol)}</b>`;
      } else if (e.value !== null && e.value !== undefined) {
        content = fmtNum(e.value);
      }

      let style = 'vertical-align:middle;';
      if (bad) style += 'background:#fee2e2;color:#991b1b;font-weight:bold;';
      else if (m.sun) style += 'background:#fef2f2;';

      return `<td class="c" style="${style}">${content}</td>`;
    }).join('');

    const rm = esc(S.remarks[it.id] || '');
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
      <td colspan="2" class="l">${rm}</td>
    </tr>`);
  });

  // --- Footer 1: Temuan Problem Header & Simbol ---
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

  // --- Footer 2: KaSubSie Approval Harian ---
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

  // --- Footer 3: Kasie Approval Mingguan ---
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

  // --- Footer 4: Sirkulasi Header ---
  rows.push(`<tr style="height:22pt;">
    <td class="l">XF : PROBLEM SUDAH DIPERBAIKI</td>
    <td rowspan="4" class="c"></td>
    <td colspan="33" class="hd" style="font-size:10pt;">SIRKULASI PENYERAHAN DOKUMEN</td>
    <td colspan="2" class="l">C : CHECK</td>
  </tr>`);

  // --- Footer 5: Sirkulasi Detail Flow ---
  rows.push(`<tr style="height:26pt;">
    <td class="l">O : PENGGANTIAN PART</td>
    <td colspan="33" rowspan="3" class="c b" style="vertical-align:middle;background:#f8fafc;color:#1e293b;font-size:9.5pt;">
      ${esc(flowSummary)}
    </td>
    <td colspan="2" class="l">T : TAMBAH</td>
  </tr>`);

  // --- Footer 6 ---
  rows.push(`<tr style="height:20pt;">
    <td class="l"></td>
    <td colspan="2" class="l">U : UKUR</td>
  </tr>`);

  // --- Footer 7 ---
  rows.push(`<tr style="height:20pt;">
    <td class="l"></td>
    <td colspan="2" class="l">S : SERVICE</td>
  </tr>`);

  // --- Temuan Problem Table ---
  rows.push(`<tr style="height:24pt;"><td colspan="41" class="sect">TEMUAN PROBLEM</td></tr>`);
  rows.push(`<tr style="height:22pt;">
    <td colspan="2" class="hd">No</td>
    <td class="hd">Tanggal</td>
    <td colspan="5" class="hd">Masalah</td>
    <td colspan="13" class="hd">Akar Masalah</td>
    <td colspan="13" class="hd">Counter Measure</td>
    <td colspan="5" class="hd">Due Date</td>
    <td colspan="2" class="hd">PIC</td>
  </tr>`);

  const byLine = Object.fromEntries((S.findings || []).map((f) => [f.line_no, f]));
  const maxLine = Math.max(S.config?.min_finding_rows || 5, ...S.findings.map((f) => f.line_no), 5);
  for (let n = 1; n <= maxLine; n++) {
    const f = byLine[n] || {};
    rows.push(`<tr style="height:22pt;">
      <td colspan="2" class="c">${n}</td>
      <td class="c">${esc(f.found_date || '')}</td>
      <td colspan="5" class="l">${esc(f.problem || '')}</td>
      <td colspan="13" class="l">${esc(f.root_cause || '')}</td>
      <td colspan="13" class="l">${esc(f.counter_measure || '')}</td>
      <td colspan="5" class="c">${esc(f.due_date || '')}</td>
      <td colspan="2" class="c">${esc(f.pic || '')}</td>
    </tr>`);
  }

  const colWidths = [
    45, 35, 200, 160, 160, 90, 80, 65,
    ...Array(31).fill(34),
    90, 80,
  ];

  const colTags = colWidths.map((w) => `<col width="${w}">`).join('');

  const tplName = (T.machine_type || 'Form').replace(/\s+/g, '_');
  const monthName = MONTHS[(sh.month || 1) - 1] || '';
  const title = `Checksheet_${tplName}_${monthName}_${sh.year || ''}`;

  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>${esc(tplName)}</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
            <x:Print>
              <x:Orientation>Landscape</x:Orientation>
              <x:PaperSizeIndex>9</x:PaperSizeIndex>
            </x:Print>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
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
