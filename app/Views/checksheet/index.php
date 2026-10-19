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
        <p id="splash-msg">Menyiapkan Checksheet…</p>
        <div class="bar"><i></i></div>
    </div>
</div>

<!-- ========================================================================= -->
<!-- 1. PORTAL HUB / LANDING PAGE — DUAL-TONE INDUSTRIAL CATALOG                -->
<!-- ========================================================================= -->
<div id="portal-view">
    <!-- Top White Navigation Bar -->
    <header class="portal-nav-bar no-print">
        <div class="portal-nav-inner">
            <!-- Left: Brand Identity -->
            <div class="portal-brand-left">
                <!-- Logo Resmi CBI (Sama seperti Splash / Loading Screen) -->
                <div class="portal-logo-wrap">
                    <img src="<?= base_url('assets/img/logo.jpg') ?>" alt="<?= esc($cfg->company) ?> Logo" class="portal-logo-img">
                </div>
                <div class="portal-brand-text">
                    <div class="portal-brand-company"><?= esc($cfg->company) ?> -</div>
                    <div class="portal-brand-platform">Central Maintenance Inspection Platform</div>
                </div>
            </div>

            <!-- Right: Live Clock & User Profile -->
            <div class="portal-nav-right">
                <span id="portal-clock-txt" class="portal-clock-text">Memuat waktu…</span>
                <button id="portal-who" class="portal-user-btn" type="button" title="Klik untuk ganti nama pemeriksa">
                    <div class="portal-user-avatar">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </div>
                    <span class="portal-user-name actor-name">Belum diisi</span>
                </button>
            </div>
        </div>
    </header>

    <!-- Dark Industrial Hero Banner with Factory Silhouette -->
    <section class="hero-industrial-banner">
        <div class="hero-inner">
            <h1>Pusat Checksheet Perawatan Mesin</h1>
            <p>Pilih mesin atau peralatan pabrik di bawah untuk membuka lembar pemeriksaan</p>
        </div>
    </section>

    <!-- Floating KPI Summary Cards (Overlapping Banner & Body) -->
    <section class="portal-kpi-bar">
        <div class="kpi-grid">
            <div class="kpi-card">
                <span class="kpi-label">Total Mesin:</span>
                <span id="kpi-total-machines" class="kpi-val">3</span>
            </div>
            <div class="kpi-card">
                <span class="kpi-label">Form Aktif:</span>
                <span id="kpi-active-forms" class="kpi-val">5</span>
            </div>
            <div class="kpi-card">
                <span class="kpi-label">Sudah Diperiksa:</span>
                <span id="kpi-checked" class="kpi-val">-</span>
            </div>
            <div class="kpi-card">
                <span class="kpi-label">Belum Diperiksa:</span>
                <span id="kpi-unchecked" class="kpi-val">-</span>
            </div>
        </div>
    </section>

    <!-- Main Content Container: Filter & Equipment Catalog -->
    <main class="portal-main-wrap">
        <!-- Filter & Search Bar -->
        <div class="portal-filter-bar">
            <div class="portal-filter-left">
                <!-- Search Box -->
                <div class="portal-search-box">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input 
                        id="portal-search"
                        type="text" 
                        placeholder="Cari mesin atau seksi..." 
                        autocomplete="off"
                    >
                </div>

                <!-- Filter Pills -->
                <button class="filter-pill active" data-filter="all" type="button">Semua Seksi</button>
                <button class="filter-pill" data-filter="Utility" type="button">Seksi Utility</button>
                <button class="filter-pill" data-filter="Maintenance" type="button">Dept. Maintenance</button>
                <button class="filter-pill" data-filter="WET CHARGING" type="button">WET CHARGING</button>
                <button class="filter-pill" data-filter="PLANT SERVICE" type="button">PLANT SERVICE</button>
            </div>

            <!-- Status Select Dropdown -->
            <div class="portal-filter-right">
                <div class="portal-status-select-wrap">
                    <span>Status:</span>
                    <select id="portal-status-filter">
                        <option value="all">Semua</option>
                        <option value="active">Form Aktif</option>
                        <option value="checked">Sudah Diperiksa</option>
                        <option value="unchecked">Belum Diperiksa</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- 3-Column Machine Cards Grid (populated dynamically) -->
        <div class="portal-equip-grid" id="equip-grid">
            <!-- Cards rendered dynamically by app.js -->
        </div>

        <!-- Bottom Pagination Counter -->
        <div id="equip-count-msg" class="portal-count-msg">
            Menampilkan 3 dari 3 mesin
        </div>
    </main>
</div>

<!-- ========================================================================= -->
<!-- 2. CHECKSHEET WORKSTATION (WORKSPACE LEMBAR FORM)                        -->
<!-- ========================================================================= -->
<div id="workstation-view" hidden style="display:none">
    <header id="toolbar" class="no-print">
        <!-- 1. Left Group: Hub Nav, Brand, & Machine Switcher -->
        <div class="tb-group tb-left">
            <button id="btn-back-hub" class="btn-back-hub" type="button" title="Kembali ke Menu Utama">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                <span>Menu Utama</span>
            </button>

            <div class="action-divider"></div>

            <div class="brand">
                <img src="<?= base_url('assets/img/logo.jpg') ?>" alt="CBI Logo">
                <b>Daily Checksheet</b>
            </div>

            <div class="equip-switcher" title="Ganti Peralatan">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                <span class="equip-label">Mesin:</span>
                <select id="switch-tpl" aria-label="Pilih Peralatan"></select>
            </div>
        </div>

        <!-- 2. Center Group: Month & Year Selector -->
        <div class="tb-group tb-center">
            <div class="period">
                <button id="period-prev" class="period-btn" type="button" title="Bulan sebelumnya (Ctrl+←)">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <svg class="period-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <select id="month" aria-label="Bulan"></select>
                <span class="period-sep">/</span>
                <input id="year" type="number" min="2000" max="2100" aria-label="Tahun">
                <button id="period-next" class="period-btn" type="button" title="Bulan berikutnya (Ctrl+→)">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
            </div>
        </div>

        <!-- 3. Right Group: Zoom, Equal PDF/Excel, Sync & Actor -->
        <div class="tb-group tb-right">
            <div class="zoom-controls">
                <button id="zoom-out" type="button" title="Perkecil (−)">−</button>
                <button id="zoom-fit" type="button" title="Muat Layar / 100% (Ctrl+0)">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
                    <span id="zoom-val">100%</span>
                </button>
                <button id="zoom-in" type="button" title="Perbesar (+)">+</button>
            </div>

            <div class="action-divider"></div>

            <div class="export-actions">
                <button id="btn-print" class="btn-action btn-pdf" type="button" title="Cetak lembar A4 landscape (Ctrl+P)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                    <span>Cetak PDF</span>
                </button>
                <button id="btn-excel" class="btn-action btn-excel" type="button" title="Download spreadsheet Excel (Ctrl+E)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line><line x1="10" y1="9" x2="10" y2="9"></line></svg>
                    <span>Cetak Excel</span>
                </button>
            </div>

            <div class="action-divider"></div>

            <button id="sync" class="sync" type="button" title="Status Sinkronisasi Realtime"><i></i><span>Live</span></button>

            <button id="who" class="who" type="button" title="Klik untuk ganti nama pemeriksa">
                <i class="who-ico"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></i>
                <span class="actor-name"></span>
            </button>
        </div>
    </header>

    <main id="stage"><div id="sheet-wrap"><div id="sheet"></div></div></main>
</div>

<!-- ========================================================================= -->
<!-- 3. FORM SELECTOR DIALOG (for equipment with multiple forms like Chiller)  -->
<!-- ========================================================================= -->
<dialog id="dlg-form-select" class="form-select-dlg">
    <div class="fsd-card">
        <div class="fsd-header">
            <div class="fsd-icon" id="fsd-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
            </div>
            <div>
                <h3 id="fsd-title">Pilih Formulir Pemeriksaan</h3>
                <p class="fsd-sub" id="fsd-sub">Pilih jenis lembar kerja yang ingin dibuka</p>
            </div>
            <button id="fsd-close" class="fsd-close-btn" type="button" title="Tutup">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>
        <div class="fsd-options" id="fsd-options">
            <!-- Options are rendered dynamically -->
        </div>
    </div>
</dialog>

<div id="pop" class="pop no-print" hidden></div>
<dialog id="dlg"></dialog>
<div id="toasts" class="no-print"></div>

<!-- Lightbox Modal Zoom Foto Komponen -->
<dialog id="dlg-photo-zoom" class="no-print" style="border:none;background:rgba(15,23,42,0.8);backdrop-filter:blur(4px);padding:0;max-width:95vw;max-height:95vh;border-radius:12px;outline:none;box-shadow:0 25px 50px -12px rgba(0,0,0,0.7);">
    <div style="background:#fff;border-radius:12px;overflow:hidden;display:flex;flex-direction:column;max-width:92vw;max-height:92vh;">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 18px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
            <div style="font-weight:700;font-size:14px;color:#1e293b;display:flex;align-items:center;gap:8px;">
                <span>🔍</span> <span id="photo-zoom-title">Layout & Foto Komponen Chiller LSBLG250</span>
            </div>
            <button id="photo-zoom-close" type="button" style="border:none;background:#e2e8f0;color:#334155;border-radius:50%;width:30px;height:30px;cursor:pointer;font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:center;transition:background .15s;">✕</button>
        </div>
        <div style="overflow:auto;padding:16px;background:#0f172a;display:flex;justify-content:center;align-items:center;">
            <img id="photo-zoom-img" src="" alt="Preview" style="max-width:100%;height:auto;max-height:78vh;object-fit:contain;border-radius:6px;box-shadow:0 8px 30px rgba(0,0,0,0.5);">
        </div>
    </div>
</dialog>

<script>window.CS = { 
    pollMs: <?= (int) $cfg->pollIntervalMs ?>, 
    company: <?= json_encode($cfg->company) ?>, 
    logo: <?= json_encode(base_url('assets/img/logo.jpg')) ?>,
    baseUrl: <?= json_encode(base_url()) ?>,
    chillerPhoto: <?= json_encode(base_url('assets/img/chiller/std_photos.png')) ?>
};</script>
<?= $this->endSection() ?>
