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

<!-- ========================================================================= -->
<!-- 1. PORTAL HUB / LANDING PAGE                                              -->
<!-- ========================================================================= --><div id="portal-view">
    <!-- Portal Header (White Clean Theme with Loading Screen DNA) -->
    <header class="portal-header no-print">
        <div class="portal-brand">
            <div class="brand-avatar-wrapper">
                <span class="portal-ring p-ring-red"></span>
                <span class="portal-ring p-ring-dark"></span>
                <img src="<?= base_url('assets/img/logo.jpg') ?>" alt="CBI Logo">
            </div>
            <div class="brand-info">
                <div class="brand-title-row">
                    <b><?= esc($cfg->company) ?></b>
                </div>
                <span class="portal-tag">CENTRAL MAINTENANCE INSPECTION PLATFORM</span>
            </div>
        </div>
        <div class="portal-header-right">
            <div id="portal-clock" class="portal-clock">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <span id="clock-txt">Memuat waktu…</span>
            </div>
            <button class="who portal-who" id="portal-who" title="Klik untuk ganti nama pemeriksa">
                <i class="who-ico"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></i>
                <span class="actor-name"></span>
            </button>
        </div>
    </header>

    <main class="portal-container">
        <!-- Compact Hero Section (Clean single-line heading) -->
        <section class="portal-hero">
            <h1 class="hero-title">Pusat Checksheet Perawatan Mesin</h1>
            <p class="hero-sub">Pilih periode pemeriksaan di bawah untuk membuka lembar kontrol operasional peralatan pabrik</p>
        </section>

        <!-- 3 Pillars Grid -->
        <div class="pillars-grid">
            <!-- 1. Laporan Harian (Aktif - Black & Red Kinetic DNA) -->
            <div class="pillar-card active" id="card-daily" data-freq="daily" tabindex="0" role="button" aria-label="Buka Laporan Harian">
                <!-- Kinetic Moving Beam Track (from loading screen progress bar) -->
                <div class="card-scanner-track">
                    <i class="scanner-beam"></i>
                </div>

                <div class="pillar-header">
                    <!-- Kinetic Dual Spinning Orbit (from loading screen rings) -->
                    <div class="pillar-orbit-wrap">
                        <span class="orbit-ring o-red"></span>
                        <span class="orbit-ring o-dark"></span>
                        <div class="orbit-core icon-daily">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                                <polyline points="9 16 11 18 15 14"></polyline>
                            </svg>
                        </div>
                    </div>

                    <span class="pillar-badge badge-active">
                        <span class="live-pulse"></span> SIAP DIGUNAKAN
                    </span>
                </div>

                <div class="pillar-body">
                    <div class="pillar-cycle"><i class="cycle-pulse-dot"></i> SIKLUS HARIAN (PER SHIFT)</div>
                    <h2 class="pillar-title">Laporan Harian (Daily)</h2>
                    <p class="pillar-desc">Pemeriksaan operasional shift mesin (Cooling Tower, Scrubber, dll) dengan perhitungan otomatis ΔT, log temuan masalah, serta persetujuan Kasubsie & Ka.Dept.</p>

                    <div class="pillar-highlights">
                        <span class="hl-tag">⚙️ Multi-Mesin Dropdown</span>
                        <span class="hl-tag">⚡ Live Realtime</span>
                        <span class="hl-tag">📄 Cetak PDF & Excel</span>
                    </div>
                </div>

                <div class="pillar-action">
                    <button class="btn-pillar-cta primary" id="btn-open-daily" type="button">
                        <span>Buka Lembar Kerja Harian</span>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                </div>
            </div>

            <!-- 2. Laporan Mingguan (Coming Soon) -->
            <div class="pillar-card coming-soon" data-freq="weekly" tabindex="0" role="button" aria-label="Laporan Mingguan Sedang Dipersiapkan">
                <div class="card-scanner-track standby"></div>

                <div class="pillar-header">
                    <div class="pillar-orbit-wrap">
                        <span class="orbit-ring o-dark-subtle"></span>
                        <div class="orbit-core icon-weekly">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path>
                                <path d="M8 14h.01"></path><path d="M12 14h.01"></path><path d="M16 14h.01"></path><path d="M8 18h.01"></path><path d="M12 18h.01"></path><path d="M16 18h.01"></path>
                            </svg>
                        </div>
                    </div>
                    <span class="pillar-badge badge-soon">⏳ COMING SOON</span>
                </div>

                <div class="pillar-body">
                    <div class="pillar-cycle">SIKLUS MINGGUAN (7 HARI)</div>
                    <h2 class="pillar-title">Laporan Mingguan (Weekly)</h2>
                    <p class="pillar-desc">Rekapitulasi 7-harian: greasing bearing komponen berputar, pembersihan saringan udara/air, cek beban listrik motor, dan evaluasi perawatan preventif.</p>

                    <div class="pillar-highlights">
                        <span class="hl-tag muted">Greasing Bearing</span>
                        <span class="hl-tag muted">Pembersihan Filter</span>
                        <span class="hl-tag muted">Tahap Formulasi</span>
                    </div>
                </div>

                <div class="pillar-action">
                    <button class="btn-pillar-cta ghost" type="button">
                        <span>Info Modul Mingguan</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    </button>
                </div>
            </div>

            <!-- 3. Laporan Tahunan (Coming Soon) -->
            <div class="pillar-card coming-soon" data-freq="yearly" tabindex="0" role="button" aria-label="Laporan Tahunan Sedang Dipersiapkan">
                <div class="card-scanner-track standby"></div>

                <div class="pillar-header">
                    <div class="pillar-orbit-wrap">
                        <span class="orbit-ring o-dark-subtle"></span>
                        <div class="orbit-core icon-yearly">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                                <path d="M12 11h4"></path><path d="M12 16h4"></path><path d="M8 11h.01"></path><path d="M8 16h.01"></path>
                            </svg>
                        </div>
                    </div>
                    <span class="pillar-badge badge-soon">⏳ COMING SOON</span>
                </div>

                <div class="pillar-body">
                    <div class="pillar-cycle">SIKLUS TAHUNAN / OVERHAUL</div>
                    <h2 class="pillar-title">Laporan Tahunan (Overhaul)</h2>
                    <p class="pillar-desc">Audit komprehensif tahunan: evaluasi umur pakai spare part kritis, overhaul besar mesin pabrik, kalibrasi sensor, dan sertifikasi kelayakan peralatan.</p>

                    <div class="pillar-highlights">
                        <span class="hl-tag muted">Audit Tahunan</span>
                        <span class="hl-tag muted">Overhaul Mesin</span>
                        <span class="hl-tag muted">Tahap Standardisasi</span>
                    </div>
                </div>

                <div class="pillar-action">
                    <button class="btn-pillar-cta ghost" type="button">
                        <span>Info Modul Tahunan</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    </button>
                </div>
            </div>
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
<!-- 3. COMING SOON MODAL (INTERAKTIF UNTUK MINGGUAN & TAHUNAN)                -->
<!-- ========================================================================= -->
<dialog id="dlg-coming-soon" class="cs-dlg">
    <div class="cs-dlg-card">
        <div class="cs-dlg-icon">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        </div>
        <div class="cs-dlg-badge" id="cs-dlg-badge">MODUL MINGGUAN</div>
        <h3 id="cs-dlg-title">Sedang Dalam Tahap Digitalisasi</h3>
        <p id="cs-dlg-desc">Format formulir untuk periode ini sedang distandarisasi bersama tim Maintenance PT. Century Batteries Indonesia. Sistem akan membuka modul ini begitu format tabel form telah disahkan.</p>
        <div class="cs-dlg-note">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <span>Modul <b>Laporan Harian (Daily Checksheet)</b> saat ini sudah aktif 100% dan siap digunakan operasional.</span>
        </div>
        <button id="cs-dlg-close" class="btn pri cs-dlg-btn" type="button">Saya Mengerti, Kembali</button>
    </div>
</dialog>

<div id="pop" class="pop no-print" hidden></div>
<dialog id="dlg"></dialog>
<div id="toasts" class="no-print"></div>

<script>window.CS = { pollMs: <?= (int) $cfg->pollIntervalMs ?>, company: <?= json_encode($cfg->company) ?>, logo: <?= json_encode(base_url('assets/img/logo.jpg')) ?> };</script>
<?= $this->endSection() ?>
