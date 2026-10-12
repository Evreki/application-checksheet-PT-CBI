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
    <div class="brand"><img src="<?= base_url('assets/img/logo.jpg') ?>" alt=""><div><b>Daily Checksheet Utility</b><small><?= esc($cfg->company) ?></small></div></div>
    <nav id="tabs" aria-label="Jenis mesin"></nav>
    <div class="period">
        <select id="month" aria-label="Bulan"></select>
        <input id="year" type="number" min="2000" max="2100" aria-label="Tahun">
    </div>
    <div class="tools">
        <button id="zoom-out" title="Perkecil">−</button>
        <button id="zoom-fit" title="Muat layar">Fit</button>
        <button id="zoom-in" title="Perbesar">+</button>
        <button id="btn-print" title="Cetak (A4 landscape)">Cetak</button>
        <span id="sync" class="sync" title="Status sinkronisasi"><i></i><span>Live</span></span>
        <button id="who" class="who" title="Ganti nama pengguna">👤 <span></span></button>
    </div>
</header>

<main id="stage"><div id="sheet-wrap"><div id="sheet"></div></div></main>

<div id="pop" class="pop no-print" hidden></div>
<dialog id="dlg"></dialog>
<div id="toasts" class="no-print"></div>

<script>window.CS = { pollMs: <?= (int) $cfg->pollIntervalMs ?>, company: <?= json_encode($cfg->company) ?>, logo: <?= json_encode(base_url('assets/img/logo.jpg')) ?> };</script>
<?= $this->endSection() ?>
