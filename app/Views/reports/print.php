<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Laporan Perbaikan Maintenance - <?= esc($report['instance_code']) ?> - PT. Century Batteries Indonesia</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/jpeg" href="<?= base_url('assets/img/logo.jpg') ?>">
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 15mm 20mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1e2530;
      background: #f4f3ef;
      margin: 0;
      padding: 24px;
      line-height: 1.5;
    }
    .print-actions {
      max-width: 800px;
      margin: 0 auto 20px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
      padding: 12px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      font-size: 13px;
      padding: 8px 16px;
      border-radius: 8px;
      text-decoration: none;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
    }
    .btn-print {
      background: #b91c1c;
      color: #ffffff;
    }
    .btn-print:hover {
      background: #991b1b;
    }
    .btn-back {
      background: #f1f5f9;
      color: #334155;
    }
    .btn-back:hover {
      background: #e2e8f0;
    }
    .sheet-paper {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 32px 36px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      border: 1px solid #cbd5e1;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      border-bottom: 2px solid #1e2530;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .header-table td {
      vertical-align: middle;
    }
    .logo-box {
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .logo-box img {
      width: 56px;
      height: 56px;
      object-fit: cover;
      border-radius: 50%;
    }
    .company-title {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 0.5px;
      margin: 0;
    }
    .company-sub {
      font-size: 12px;
      color: #64748b;
      margin: 2px 0 0 0;
      font-weight: 500;
    }
    .doc-meta {
      text-align: right;
      font-size: 11px;
      color: #475569;
    }
    .doc-meta strong {
      color: #0f172a;
    }
    .report-headline {
      text-align: center;
      margin: 15px 0 24px 0;
    }
    .report-headline h1 {
      font-size: 18px;
      font-weight: 800;
      color: #1e293b;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .report-headline p {
      font-size: 12px;
      color: #64748b;
      margin: 4px 0 0 0;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      background: #f8fafc;
      padding: 14px 18px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      margin-bottom: 24px;
      font-size: 12px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px dashed #e2e8f0;
      padding: 3px 0;
    }
    .meta-label {
      color: #64748b;
      font-weight: 500;
    }
    .meta-val {
      font-weight: 700;
      color: #1e293b;
    }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      margin: 20px 0 8px 0;
      padding-bottom: 4px;
      border-bottom: 1.5px solid #cbd5e1;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .box-content {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 14px;
      font-size: 12px;
      color: #334155;
      margin-bottom: 16px;
    }
    .table-data {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-bottom: 20px;
    }
    .table-data th {
      background: #f1f5f9;
      color: #1e293b;
      font-weight: 700;
      text-align: left;
      padding: 8px 10px;
      border: 1px solid #cbd5e1;
    }
    .table-data td {
      padding: 8px 10px;
      border: 1px solid #e2e8f0;
      color: #334155;
    }
    .table-data tr:nth-child(even) {
      background: #fafafa;
    }
    .badge-status {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-approved {
      background: #dcfce7;
      color: #15803d;
    }
    .badge-submitted {
      background: #fef3c7;
      color: #92400e;
    }
    .signature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px dashed #cbd5e1;
    }
    .sig-col {
      text-align: center;
      font-size: 11px;
      color: #475569;
    }
    .sig-space {
      height: 70px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .sig-stamp {
      border: 1.5px solid #16a34a;
      color: #16a34a;
      font-weight: 800;
      font-size: 10px;
      padding: 3px 10px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .sig-name {
      font-weight: 700;
      color: #0f172a;
      font-size: 12px;
      text-decoration: underline;
    }
    .sig-title {
      font-size: 10px;
      color: #64748b;
    }
    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .print-actions {
        display: none !important;
      }
      .sheet-paper {
        border: none;
        box-shadow: none;
        padding: 0;
        max-width: 100%;
      }
    }
  </style>
</head>
<body>

  <!-- Floating Print Controls -->
  <div class="print-actions">
    <div>
      <a href="<?= base_url() ?>" class="btn btn-back">← Kembali ke Portal</a>
    </div>
    <div style="display: flex; gap: 10px; align-items: center;">
      <span style="font-size: 12px; color: #64748b;">Standar A4 Corporate CBI</span>
      <button onclick="window.print()" class="btn btn-print">
        🖨️ Unduh PDF / Cetak Laporan
      </button>
    </div>
  </div>

  <!-- Sheet Paper ISO A4 Container -->
  <div class="sheet-paper">
    <table class="header-table">
      <tr>
        <td style="width: 70px;">
          <div class="logo-box">
            <img src="<?= base_url('assets/img/logo.jpg') ?>" alt="Logo CBI">
          </div>
        </td>
        <td>
          <h2 class="company-title">PT. CENTURY BATTERIES INDONESIA</h2>
          <p class="company-sub">PLANT SERVICE &amp; MAINTENANCE UTILITY &bull; ASTRA OTOPARTS GROUP</p>
        </td>
        <td class="doc-meta">
          <div><strong>No. Laporan:</strong> RPT-<?= str_pad((string)$report['id'], 5, '0', STR_PAD_LEFT) ?></div>
          <div><strong>Tanggal:</strong> <?= date('d/m/Y', strtotime($report['report_date'])) ?></div>
          <div><strong>Shift:</strong> <?= esc($report['shift']) ?></div>
          <div><strong>Status:</strong> 
            <?php if ($report['status'] === 'APPROVED'): ?>
              <span class="badge-status badge-approved">Approved</span>
            <?php else: ?>
              <span class="badge-status badge-submitted">Submitted</span>
            <?php endif; ?>
          </div>
        </td>
      </tr>
    </table>

    <div class="report-headline">
      <h1>Laporan Pemeliharaan &amp; Tindakan Perbaikan (Action Report)</h1>
      <p>Dokumentasi Tindak Lanjut Hasil Inspeksi Preventive Maintenance &amp; Penanganan Temuan NG</p>
    </div>

    <!-- Metadata Mesin & Lokasi -->
    <div class="meta-grid">
      <div>
        <div class="meta-row">
          <span class="meta-label">Kode Unit (ID Alat):</span>
          <span class="meta-val"><?= esc($report['instance_code']) ?></span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Nama Peralatan:</span>
          <span class="meta-val"><?= esc($instance['instance_name'] ?? '-') ?></span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Kelompok Alat:</span>
          <span class="meta-val"><?= esc(strtoupper($instance['equipment_group'] ?? '-')) ?></span>
        </div>
      </div>
      <div>
        <div class="meta-row">
          <span class="meta-label">Lokasi Gedung:</span>
          <span class="meta-val"><?= esc($instance['building'] ?? '-') ?></span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Area / Ruangan:</span>
          <span class="meta-val"><?= esc($instance['room_location'] ?? '-') ?></span>
        </div>
        <div class="meta-row">
          <span class="meta-label">PIC Pelaksana:</span>
          <span class="meta-val"><?= esc($report['pic_name']) ?></span>
        </div>
      </div>
    </div>

    <!-- Pemicu Permasalahan / Temuan NG -->
    <?php if ($action): ?>
    <div class="section-title">1. Riwayat Temuan Abnormal / Pemicu (NG Item)</div>
    <div class="box-content" style="background: #fffbeb; border-color: #fde68a;">
      <div style="font-weight: 700; color: #92400e; margin-bottom: 4px;">
        Poin Temuan: <?= esc($action['item_name']) ?> (Tipe: <?= esc($action['action_type']) ?>)
      </div>
      <div><strong>Deskripsi NG:</strong> <?= nl2br(esc($action['ng_description'])) ?></div>
      <div style="font-size: 11px; color: #b45309; margin-top: 4px;">
        Diputuskan oleh: <?= esc($action['decision_by'] ?? 'Leader Maintenance') ?> &bull; Tanggal: <?= esc($action['scheduled_date'] ?? '-') ?>
      </div>
    </div>
    <?php endif; ?>

    <!-- Tindakan yang Dilakukan (Action Taken) -->
    <div class="section-title"><?= $action ? '2' : '1' ?>. Uraian Tindakan Perbaikan (Action Taken)</div>
    <div class="box-content">
      <?= nl2br(esc($report['action_taken'])) ?>
    </div>

    <!-- Suku Cadang / Sparepart -->
    <div class="section-title"><?= $action ? '3' : '2' ?>. Penggantian Suku Cadang / Sparepart Material</div>
    <?php if (!empty($parts)): ?>
      <table class="table-data">
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">No</th>
            <th>Nama Sparepart / Material</th>
            <th>Part Number / Spesifikasi</th>
            <th style="width: 60px; text-align: center;">Qty</th>
            <th style="width: 70px; text-align: center;">Satuan</th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($parts as $idx => $p): ?>
          <tr>
            <td style="text-align: center;"><?= $idx + 1 ?></td>
            <td><strong><?= esc($p['part_name']) ?></strong></td>
            <td><?= esc($p['part_number'] ?: '-') ?></td>
            <td style="text-align: center;"><?= esc($p['qty']) ?></td>
            <td style="text-align: center;"><?= esc($p['unit']) ?></td>
          </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    <?php else: ?>
      <div class="box-content" style="color: #64748b; font-style: italic;">
        Tidak ada penggantian sparepart (tindakan pembersihan / penyetelan / kalibrasi mekanik).
      </div>
    <?php endif; ?>

    <!-- Kesimpulan -->
    <div class="section-title"><?= $action ? '4' : '3' ?>. Kesimpulan &amp; Status Akhir Peralatan</div>
    <div class="box-content" style="background: #f0fdf4; border-color: #bbf7d0; color: #166534;">
      <strong>Hasil Akhir:</strong> <?= nl2br(esc($report['conclusion'] ?: 'Peralatan siap dioperasikan kembali secara optimal.')) ?>
    </div>

    <!-- Tanda Tangan Resmi -->
    <div class="signature-grid">
      <div class="sig-col">
        <div>Dikerjakan &amp; Dilaporkan oleh:</div>
        <div class="sig-space">
          <div class="sig-stamp" style="border-color: #2563eb; color: #2563eb;">PIC VERIFIED</div>
        </div>
        <div class="sig-name"><?= esc($report['pic_name']) ?></div>
        <div class="sig-title">Teknisi Maintenance Utility</div>
      </div>
      <div class="sig-col">
        <div>Diketahui &amp; Disetujui oleh:</div>
        <div class="sig-space">
          <?php if ($report['status'] === 'APPROVED'): ?>
            <div class="sig-stamp">DIGITALLY APPROVED</div>
            <div style="font-size: 9px; color: #15803d; margin-top: 2px;">
              <?= esc($report['leader_approval_at'] ? date('d/m/Y H:i', strtotime($report['leader_approval_at'])) : date('d/m/Y')) ?> WIB
            </div>
          <?php else: ?>
            <div style="font-size: 11px; color: #94a3b8; font-style: italic;">(Menunggu Approval Leader)</div>
          <?php endif; ?>
        </div>
        <div class="sig-name"><?= esc($report['leader_approval_by'] ?: 'Bambang Sutrisno') ?></div>
        <div class="sig-title">Ka.Sie / Leader Maintenance</div>
      </div>
    </div>
  </div>

</body>
</html>

