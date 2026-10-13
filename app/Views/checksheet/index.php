<?= $this->extend('layouts/main') ?>
<?= $this->section('content') ?>

<!-- Loading screen -->
<div id="splash" role="status" aria-live="polite">
    <div class="splash-card">
        <div class="splash-logo">
            <span class="ring"></span><span class="ring r2"></span>
            <img src="<?= base_url('assets/img/logo.jpg') ?>" alt="CBI">
        </div>
        <h1><?= esc($cfg->company) ?></h1>
        <p id="splash-msg">Menyiapkan Daily Checksheet…</p>
        <div class="bar"><i></i></div>
    </div>
</div>

<header id="toolbar" class="no-print">
    <div class="brand">
        <img src="<?= base_url('assets/img/logo.jpg') ?>" alt="CBI Logo">
        <div>
            <b>Daily Checksheet Utility</b>
            <small><?= esc($cfg->company) ?></small>
        </div>
    </div>

    <nav id="tabs" aria-label="Jenis mesin"></nav>

    <div class="period">
        <button id="period-prev" class="period-btn" type="button" title="Bulan sebelumnya (Ctrl+←)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <svg class="period-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        <select id="month" aria-label="Bulan"></select>
        <span class="period-sep">/</span>
        <input id="year" type="number" min="2000" max="2100" aria-label="Tahun">
        <button id="period-next" class="period-btn" type="button" title="Bulan berikutnya (Ctrl+→)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
    </div>

    <div class="tools">
        <div class="zoom-controls">
            <button id="zoom-out" type="button" title="Perkecil (−)">−</button>
            <button id="zoom-fit" type="button" title="Muat layar / Reset (Ctrl+0)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
                <span id="zoom-val">100%</span>
            </button>
            <button id="zoom-in" type="button" title="Perbesar (+)">+</button>
        </div>

        <div class="action-divider"></div>

        <div class="export-actions">
            <button id="btn-print" class="btn-action btn-pdf" type="button" title="Cetak lembar A4 landscape (Ctrl+P)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                <span>Cetak PDF</span>
            </button>
            <button id="btn-excel" class="btn-action btn-excel" type="button" title="Download spreadsheet Excel (Ctrl+E)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line><line x1="10" y1="9" x2="10" y2="9"></line></svg>
                <span>Cetak Excel</span>
            </button>
        </div>

        <div class="action-divider"></div>

        <button id="sync" class="sync" type="button" title="Klik untuk refresh / sinkronkan data (Live)"><i></i><span>Live</span></button>

        <button id="who" class="who" type="button" title="Klik untuk ganti nama pemeriksa">
            <i class="who-ico"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></i>
            <span></span>
        </button>
    </div>
</header>

<main id="stage"><div id="sheet-wrap"><div id="sheet"></div></div></main>

<div id="pop" class="pop no-print" hidden></div>
<dialog id="dlg"></dialog>
<div id="toasts" class="no-print"></div>

<script>window.CS = { pollMs: <?= (int) $cfg->pollIntervalMs ?>, company: <?= json_encode($cfg->company) ?>, logo: <?= json_encode(base_url('assets/img/logo.jpg')) ?> };</script>
<?= $this->endSection() ?>
