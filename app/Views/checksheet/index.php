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

<script>
// Failsafe Watchdog: Jamin layar loading (splash) otomatis tertutup maksimal 1.8 detik
setTimeout(function() {
    var s = document.getElementById('splash');
    if (s && !s.classList.contains('done')) {
        s.classList.add('done');
        setTimeout(function() { try { s.remove(); } catch(e){} }, 400);
    }
}, 1800);
</script>

<!-- ========================================================================= -->
<!-- 0. INDUSTRIAL LOGIN SCREEN (AUTH SYSTEM)                                  -->
<!-- ========================================================================= -->
<div id="login-view">
    <div class="login-container">
        <!-- Left: Industrial Branding & Trial Info -->
        <div class="login-left-banner">
            <div class="login-brand-group">
                <div class="login-logo-circle">
                    <img src="<?= base_url('assets/img/logo.jpg') ?>" alt="CBI Logo">
                </div>
                <div>
                    <h2><?= esc($cfg->company) ?></h2>
                    <p>Plant Service &bull; Maintenance Utility</p>
                </div>
            </div>

            <div class="login-left-content">
                <div class="login-tagline-badge">
                    <span>⚡ Real-Time Maintenance Platform</span>
                </div>
                <h1>Central Inspection &amp; Action System</h1>
                <p>Portal terpadu pelaksanaan inspeksi checksheet berkala, manajemen temuan abnormalitas (NG), dan pelaporan tindakan perbaikan pemeliharaan pabrik.</p>
            </div>

            <div class="login-trial-guide">
                <h4>Akun Uji Coba (Trial Mode):</h4>
                <div class="login-trial-list">
                    <span>Leader: <strong>leader</strong> (Pass: 12345)</span>
                    <span>User 1: <strong>user1</strong> (Pass: 12345)</span>
                    <span>User 2: <strong>user2</strong> (Pass: 12345)</span>
                </div>
            </div>
        </div>

        <!-- Right: Login Form -->
        <div class="login-right-form">
            <div class="login-form-header">
                <h3>Masuk ke Sistem</h3>
                <p>Silakan masukkan kredensial akun maintenance Anda</p>
            </div>

            <div id="login-error" class="login-error-box"></div>

            <form id="form-login" onsubmit="return false;">
                <div class="login-input-group">
                    <label for="login-username">Username</label>
                    <input type="text" id="login-username" placeholder="Masukkan username" required autocomplete="username">
                </div>

                <div class="login-input-group">
                    <label for="login-password">Password</label>
                    <input type="password" id="login-password" placeholder="Masukkan password" required autocomplete="current-password">
                </div>

                <button type="submit" id="btn-submit-login" class="login-btn-submit">
                    <span>Masuk Portal</span>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </button>
            </form>

            <div class="quick-login-divider">
                <span>Atau Masuk Cepat (Trial)</span>
            </div>

            <div class="quick-login-grid">
                <button type="button" class="btn-quick-user" data-user="leader" title="Login sebagai Leader">
                    👑 Leader
                </button>
                <button type="button" class="btn-quick-user" data-user="user1" title="Login sebagai User 1">
                    👤 User 1
                </button>
                <button type="button" class="btn-quick-user" data-user="user2" title="Login sebagai User 2">
                    👤 User 2
                </button>
            </div>
        </div>
    </div>
</div>

<!-- ========================================================================= -->
<!-- 1. PORTAL HUB / LANDING PAGE — DUAL-TONE INDUSTRIAL CATALOG                -->
<!-- ========================================================================= -->
<div id="portal-view" style="display:none;">
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
                    <div class="portal-brand-company"><?= esc($cfg->company) ?></div>
                    <div class="portal-brand-platform">Central Maintenance Inspection Platform</div>
                </div>
            </div>

            <!-- Right: Action Sidebars Triggers, User Tasks & User Profile -->
            <div class="portal-nav-right">
                <!-- Button Trigger: Action Sidebar (NG Items) -->
                <button id="btn-open-actions" class="nav-action-btn btn-nav-action" type="button" title="Buka Daftar Temuan NG &amp; Tindakan">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                    <span class="btn-text">Action (NG)</span>
                    <span id="action-badge-count" class="nav-badge-count">0</span>
                </button>

                <!-- Button Trigger: Reporting Sidebar -->
                <button id="btn-open-reporting" class="nav-action-btn btn-nav-report" type="button" title="Buka Formulir Laporan Pemeliharaan">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    <span class="btn-text">Reporting</span>
                </button>

                <!-- Button Trigger: User Inspection Tasks (Notification for Technician) -->
                <button id="btn-user-tasks" class="nav-action-btn btn-nav-tasks" type="button" title="Lihat Penugasan Inspeksi Hari Ini">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                    <span class="btn-text">Tugas Saya</span>
                    <span id="tasks-badge-count" class="nav-badge-count task-badge" style="display:none;">0</span>
                </button>

                <!-- Button Trigger: Assign Jobs (Leader Only) -->
                <button id="btn-open-assignment" class="nav-action-btn btn-nav-assign" type="button" title="Tugaskan Jadwal Inspeksi (Leader)" style="display:none;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    <span class="btn-text">Penugasan</span>
                </button>

                <!-- User Profile Pill -->
                <div class="portal-user-wrap">
                    <div class="portal-user-avatar">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </div>
                    <div class="portal-user-info">
                        <span id="active-user-name" class="portal-user-name">Pengguna</span>
                        <span id="active-user-role" class="user-role-badge role-user">User</span>
                    </div>
                    <button id="btn-logout" class="btn-logout" type="button" title="Keluar / Logout">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    </button>
                </div>
            </div>
        </div>
    </header>

    <!-- Dark Industrial Hero Banner with Factory Silhouette -->
    <section class="hero-industrial-banner">
        <div class="hero-inner">
            <h1>Pusat Checksheet Perawatan Mesin</h1>
            <p>Pilih unit mesin dan lokasi gedung di bawah untuk membuka lembar pemeriksaan lapangan</p>
        </div>
    </section>

    <!-- Floating KPI Summary Cards (Overlapping Banner & Body) -->
    <section class="portal-kpi-bar">
        <div class="kpi-grid">
            <div class="kpi-card">
                <span class="kpi-label">Total Unit Mesin</span>
                <span id="kpi-total-machines" class="kpi-val">8 Unit</span>
            </div>
            <div class="kpi-card">
                <span class="kpi-label">Kategori Mesin</span>
                <span id="kpi-active-forms" class="kpi-val">4 Tipe Mesin</span>
            </div>
            <div class="kpi-card">
                <span class="kpi-label">Action Today (NG)</span>
                <span id="kpi-action-today" class="kpi-val" style="color:#b91c1c;">0 Item</span>
            </div>
            <div class="kpi-card">
                <span class="kpi-label">Action Backlog</span>
                <span id="kpi-action-backlog" class="kpi-val" style="color:#d97706;">0 Item</span>
            </div>
        </div>
    </section>

    <!-- Main Content Container: Filter & Equipment Catalog -->
    <main class="portal-main-wrap">
        <!-- Filter Bar: Search + Gedung Pills + Status -->
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
                        placeholder="Cari jenis mesin, ID unit (AD-001, CH-001), atau gedung..." 
                        autocomplete="off"
                    >
                </div>

                <!-- Gedung Filter Pills -->
                <div class="building-filters">
                    <span class="building-label">Gedung:</span>
                    <button class="filter-pill filter-building active" data-building="all" type="button">Semua Gedung</button>
                    <button class="filter-pill filter-building" data-building="Gedung A" type="button">Gedung A</button>
                    <button class="filter-pill filter-building" data-building="Gedung B" type="button">Gedung B</button>
                    <button class="filter-pill filter-building" data-building="Gedung C" type="button">Gedung C</button>
                </div>
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

        <!-- Multi-Column Equipment Cards Grid (populated dynamically) -->
        <div class="portal-equip-grid" id="equip-grid">
            <!-- Cards rendered dynamically by app.js -->
        </div>

        <!-- Bottom Pagination Counter -->
        <div id="equip-count-msg" class="portal-count-msg">
            Menampilkan peralatan maintenance PT. CBI
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

    <!-- Active Task Banner when opened from Leader Assignment -->
    <div id="assignment-task-banner" class="assignment-task-banner no-print" style="display:none;">
        <div class="atb-left">
            <span class="atb-badge">Penugasan Leader Aktif</span>
            <span id="atb-info-text">Inspeksi Unit</span>
            <span id="atb-notes-text" class="atb-notes"></span>
        </div>
        <div class="atb-right">
            <button type="button" id="btn-complete-active-task" class="btn-complete-task">
                ✔ Selesaikan &amp; Konfirmasi Tugas
            </button>
        </div>
    </div>

    <main id="stage"><div id="sheet-wrap"><div id="sheet"></div></div></main>
</div>

<!-- ========================================================================= -->
<!-- 3. SIDEBAR 1: ACTION (PENGELOLAAN TEMUAN ABNORMAL / NG)                  -->
<!-- ========================================================================= -->
<div id="sidebar-action-backdrop" class="sidebar-backdrop"></div>
<aside id="sidebar-action" class="sidebar-drawer">
    <div class="sidebar-header">
        <div class="sidebar-header-left">
            <div class="sidebar-icon-wrap" style="color:#ef4444;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            </div>
            <div>
                <h3>Daftar Tindakan (Action Items)</h3>
                <p>Temuan kondisi Not Good (NG) hasil inspeksi checksheet</p>
            </div>
        </div>
        <button id="sidebar-action-close" class="sidebar-close-btn" type="button" title="Tutup">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
    </div>

    <div class="sidebar-nav-tabs">
        <button id="tab-action-today" class="sidebar-tab-btn active" type="button" data-type="TODAY">
            🔴 Action Today <span id="count-action-today" style="background:#fee2e2;color:#991b1b;padding:1px 6px;border-radius:999px;font-size:10px;">0</span>
        </button>
        <button id="tab-action-backlog" class="sidebar-tab-btn" type="button" data-type="BACKLOG">
            🟡 Action Backlog <span id="count-action-backlog" style="background:#fef3c7;color:#92400e;padding:1px 6px;border-radius:999px;font-size:10px;">0</span>
        </button>
    </div>

    <div class="sidebar-body">
        <div id="action-items-list">
            <!-- Populated dynamically via JS -->
            <div style="text-align:center;padding:40px 20px;color:#94a3b8;font-size:12.5px;">
                Memuat daftar tindakan...
            </div>
        </div>
    </div>
</aside>

<!-- ========================================================================= -->
<!-- 4. SIDEBAR 2: REPORTING (PELAPORAN TINDAKAN & SPfeedbackREPART)               -->
<!-- ========================================================================= -->
<div id="sidebar-reporting-backdrop" class="sidebar-backdrop"></div>
<aside id="sidebar-reporting" class="sidebar-drawer">
    <div class="sidebar-header">
        <div class="sidebar-header-left">
            <div class="sidebar-icon-wrap" style="color:#22c55e;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
            </div>
            <div>
                <h3>Laporan Pemeliharaan</h3>
                <p>Dokumentasi tindakan teknisi, sparepart &amp; unduh PDF</p>
            </div>
        </div>
        <button id="sidebar-reporting-close" class="sidebar-close-btn" type="button" title="Tutup">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
    </div>

    <div class="sidebar-nav-tabs">
        <button id="tab-report-new" class="sidebar-tab-btn active" type="button">
            ✍️ Input Laporan Baru
        </button>
        <button id="tab-report-history" class="sidebar-tab-btn" type="button">
            📄 Riwayat &amp; Unduh PDF
        </button>
    </div>

    <div class="sidebar-body">
        <!-- Panel 1: Input Laporan -->
        <div id="panel-report-new">
            <form id="form-report" onsubmit="return false;">
                <div class="report-form-group">
                    <label for="rep-instance">Pilih Unit Mesin / ID Alat:</label>
                    <select id="rep-instance" required></select>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                    <div class="report-form-group">
                        <label for="rep-date">Tanggal Pengerjaan:</label>
                        <input type="date" id="rep-date" required>
                    </div>
                    <div class="report-form-group">
                        <label for="rep-shift">Shift Kerja:</label>
                        <select id="rep-shift">
                            <option value="Shift 1">Shift 1 (Pagi)</option>
                            <option value="Shift 2">Shift 2 (Siang)</option>
                            <option value="Shift 3">Shift 3 (Malam)</option>
                        </select>
                    </div>
                </div>

                <div class="report-form-group">
                    <label for="rep-pic">Nama PIC Pelaksana:</label>
                    <input type="text" id="rep-pic" placeholder="Nama teknisi" required>
                </div>

                <div class="report-form-group">
                    <label for="rep-action">Uraian Tindakan Perbaikan (Action Taken):</label>
                    <textarea id="rep-action" rows="3" placeholder="Jelaskan secara teknis perbaikan yang sudah dilakukan..." required></textarea>
                </div>

                <!-- Log Sparepart Dinamis -->
                <div class="report-form-group">
                    <label>Penggantian Sparepart / Material (Jika Ada):</label>
                    <table class="parts-table" id="table-parts">
                        <thead>
                            <tr>
                                <th>Nama Part</th>
                                <th>Part No / Spek</th>
                                <th style="width:50px;">Qty</th>
                                <th style="width:65px;">Satuan</th>
                                <th style="width:30px;"></th>
                            </tr>
                        </thead>
                        <tbody id="tbody-parts">
                            <!-- Populated dynamically via JS -->
                        </tbody>
                    </table>
                    <button type="button" id="btn-add-part-row" class="btn-add-part">+ Tambah Baris Sparepart</button>
                </div>

                <div class="report-form-group">
                    <label for="rep-conclusion">Kesimpulan / Status Akhir:</label>
                    <input type="text" id="rep-conclusion" value="Selesai dikerjakan dan kondisi mesin kembali normal.">
                </div>

                <div class="sidebar-footer" style="padding:0;background:transparent;border:none;">
                    <button type="submit" id="btn-submit-report" class="btn-submit-report">
                        💾 Simpan &amp; Buka Laporan PDF
                    </button>
                </div>
            </form>
        </div>

        <!-- Panel 2: Riwayat Laporan -->
        <div id="panel-report-history" style="display:none;">
            <div id="report-history-container">
                <!-- Populated via JS -->
            </div>
        </div>
    </div>
</aside>

<!-- ========================================================================= -->
<!-- 5. MODAL DIALOG: PENUGASAN JADWAL (LEADER ONLY)                           -->
<!-- ========================================================================= -->
<dialog id="dlg-assignment" class="modal-dlg">
    <div class="modal-card modal-card-lg">
        <div class="modal-header">
            <div style="display:flex;align-items:center;gap:10px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <h3>Manajemen Penugasan Inspeksi (Leader)</h3>
            </div>
            <button id="dlg-assignment-close" type="button" style="border:none;background:transparent;color:#94a3b8;cursor:pointer;font-size:18px;display:flex;align-items:center;padding:4px;">✕</button>
        </div>

        <div class="sidebar-nav-tabs" style="border-bottom:1px solid #e2e8f0;background:#f8fafc;padding:0 16px;">
            <button id="tab-assign-form" class="sidebar-tab-btn active" type="button">
                ✍️ Beri Tugas Baru
            </button>
            <button id="tab-assign-history" class="sidebar-tab-btn" type="button">
                📋 Monitoring Status Teknisi
            </button>
        </div>

        <div class="modal-body">
            <!-- Panel 1: Form Penugasan -->
            <div id="panel-assign-form">
                <form id="form-assignment" onsubmit="return false;">
                    <div class="report-form-group">
                        <label for="assign-instance">Pilih Alat &amp; Lokasi Gedung:</label>
                        <select id="assign-instance" required></select>
                    </div>

                    <div class="modal-grid-2">
                        <div class="report-form-group">
                            <label for="assign-date">Tanggal Jadwal Inspeksi:</label>
                            <input type="date" id="assign-date" required>
                        </div>
                        <div class="report-form-group">
                            <label for="assign-type">Periode Inspeksi:</label>
                            <select id="assign-type">
                                <option value="DAILY">Harian (Daily)</option>
                                <option value="MONTHLY">Bulanan (Monthly)</option>
                            </select>
                        </div>
                    </div>

                    <div class="report-form-group">
                        <label for="assign-user">Tugaskan ke Teknisi (User):</label>
                        <select id="assign-user" required></select>
                    </div>

                    <div class="report-form-group">
                        <label for="assign-notes">Instruksi / Catatan Tambahan untuk Teknisi:</label>
                        <input type="text" id="assign-notes" placeholder="Misal: Periksa getaran fan &amp; suhu kerja teliti">
                    </div>

                    <button type="submit" id="btn-save-assignment" class="btn-submit-report" style="margin-top:10px;">
                        Simpan Penugasan
                    </button>
                </form>
            </div>

            <!-- Panel 2: Monitoring Penugasan Leader -->
            <div id="panel-assign-history" style="display:none;">
                <div id="assignment-monitoring-list">
                    <div style="text-align:center;padding:24px;color:#94a3b8;">Memuat data status penugasan...</div>
                </div>
            </div>
        </div>
    </div>
</dialog>

<!-- ========================================================================= -->
<!-- 5B. MODAL DIALOG: TUGAS INSPEKSI SAYA (TECHNICIAN NOTIFICATION)            -->
<!-- ========================================================================= -->
<dialog id="dlg-user-tasks" class="modal-dlg">
    <div class="modal-card modal-card-lg">
        <div class="modal-header" style="background:#1e3a8a;">
            <div style="display:flex;align-items:center;gap:10px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                <h3>Jadwal Tugas Inspeksi Saya (Hari Ini)</h3>
            </div>
            <button id="dlg-user-tasks-close" type="button" style="border:none;background:transparent;color:#93c5fd;cursor:pointer;font-size:18px;display:flex;align-items:center;padding:4px;">✕</button>
        </div>

        <div class="sidebar-nav-tabs" style="border-bottom:1px solid #e2e8f0;background:#f8fafc;padding:0 16px;">
            <button id="tab-tasks-pending" class="sidebar-tab-btn active" type="button">
                ⏳ Belum Dikerjakan <span id="count-pending-tasks" style="background:#fee2e2;color:#991b1b;padding:1px 6px;border-radius:999px;font-size:10px;margin-left:4px;">0</span>
            </button>
            <button id="tab-tasks-done" class="sidebar-tab-btn" type="button">
                ✔ Riwayat Selesai
            </button>
        </div>

        <div class="modal-body" id="user-tasks-body">
            <!-- Populated dynamically via JS -->
        </div>
    </div>
</dialog>

<!-- ========================================================================= -->
<!-- 5C. MODAL DIALOG: JADWALKAN ACTION BACKLOG (REPLACES NATIVE PROMPT)        -->
<!-- ========================================================================= -->
<dialog id="dlg-backlog-schedule" class="modal-dlg">
    <div class="modal-card">
        <div class="modal-header" style="background:#b45309;">
            <div style="display:flex;align-items:center;gap:10px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <h3>Jadwalkan ke Action Backlog</h3>
            </div>
            <button id="dlg-backlog-close" type="button" style="border:none;background:transparent;color:#fde68a;cursor:pointer;font-size:18px;display:flex;align-items:center;padding:4px;">✕</button>
        </div>
        <div class="modal-body">
            <form id="form-backlog-schedule" onsubmit="return false;">
                <input type="hidden" id="backlog-action-id" value="">
                
                <div class="report-form-group">
                    <label>Item Temuan NG:</label>
                    <div id="backlog-item-preview" style="padding:10px 14px;background:#f8fafc;border-radius:8px;font-size:12.5px;font-weight:600;color:#1e293b;border:1px solid #e2e8f0;">-</div>
                </div>

                <div class="report-form-group">
                    <label for="backlog-target-date">Tanggal Target Pengerjaan (Backlog):</label>
                    <input type="date" id="backlog-target-date" required>
                </div>

                <div class="report-form-group">
                    <label for="backlog-notes">Catatan Tambahan / Alasan Penundaan:</label>
                    <input type="text" id="backlog-notes" placeholder="Misal: Menunggu sparepart pengganti datang...">
                </div>

                <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:20px;">
                    <button type="button" id="btn-cancel-backlog" class="filter-pill" style="padding:8px 16px;cursor:pointer;">Batal</button>
                    <button type="submit" id="btn-submit-backlog" class="btn-submit-report" style="width:auto;padding:8px 20px;margin:0;background:#d97706;">
                        ✅ Simpan Jadwal Backlog
                    </button>
                </div>
            </form>
        </div>
    </div>
</dialog>

<!-- ========================================================================= -->
<!-- 5D. MODAL DIALOG: KONFIRMASI LOGOUT (REPLACES NATIVE CONFIRM)              -->
<!-- ========================================================================= -->
<dialog id="dlg-confirm-logout" class="modal-dlg">
    <div class="modal-card" style="width:430px;">
        <div class="modal-header" style="background:#b91c1c;">
            <div style="display:flex;align-items:center;gap:10px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                <h3>Konfirmasi Keluar (Logout)</h3>
            </div>
            <button id="dlg-logout-close" type="button" style="border:none;background:transparent;color:#fecaca;cursor:pointer;font-size:18px;display:flex;align-items:center;padding:4px;">✕</button>
        </div>
        <div class="modal-body" style="padding:26px 22px;text-align:center;">
            <p style="font-size:13.5px;color:#334155;margin:0 0 22px;line-height:1.5;">
                Apakah Anda yakin ingin keluar dari Central Maintenance Platform PT. CBI?
            </p>
            <div style="display:flex;justify-content:center;gap:12px;">
                <button type="button" id="btn-cancel-logout" class="filter-pill" style="padding:8px 22px;font-size:13px;cursor:pointer;">Batal</button>
                <button type="button" id="btn-confirm-logout-yes" class="btn-submit-report" style="width:auto;padding:8px 24px;margin:0;background:#b91c1c;box-shadow:none;">
                    Ya, Keluar
                </button>
            </div>
        </div>
    </div>
</dialog>

<!-- ========================================================================= -->
<!-- 6. FORM SELECTOR DIALOG (Consolidated Multi-Unit & Multi-Form)           -->
<!-- ========================================================================= -->
<dialog id="dlg-form-select" class="form-select-dlg">
    <div class="fsd-card">
        <div class="fsd-header">
            <div class="fsd-icon" id="fsd-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
            </div>
            <div>
                <h3 id="fsd-title">Pilih Unit &amp; Formulir Pemeriksaan</h3>
                <p class="fsd-sub" id="fsd-sub">Pilih ID unit terpasang dan jenis lembar kerja</p>
            </div>
            <button id="fsd-close" class="fsd-close-btn" type="button" title="Tutup">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>
        <div style="padding: 16px 20px 0;">
            <div id="fsd-unit-selector-wrap" style="margin-bottom:12px;">
                <label style="font-size:11.5px;font-weight:700;color:#475569;display:block;margin-bottom:6px;">1. Pilih Unit Mesin &amp; Lokasi Gedung:</label>
                <div class="fsd-units-grid" id="fsd-units-grid"></div>
            </div>
            <label style="font-size:11.5px;font-weight:700;color:#475569;display:block;margin-bottom:6px;">2. Pilih Formulir Pemeriksaan:</label>
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
                <span>🔍</span> <span id="photo-zoom-title">Layout &amp; Foto Komponen Mesin</span>
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
