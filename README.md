# CBI Daily Checksheet Utility (CodeIgniter 4 + SQL Server)

Replika digital form **Lembar Hasil Inspeksi Harian** (Form-PLS-MTC-D08): Cooling Tower & Scrubber.
Tanpa login, ada loading screen, isian real-time, approve/reject per hari / minggu / dokumen.

## 1. Pasang (di atas CI4 baru)

Proyek ini adalah **overlay** — hanya berisi file aplikasi, bukan framework.

```bash
composer create-project codeigniter4/appstarter cbi-checksheet
# salin isi folder ini ke dalamnya (timpa app/Config/Routes.php), termasuk public/assets
cd cbi-checksheet
copy .env.example .env      # lalu isi koneksi SQL Server
```

Kebutuhan: **PHP ≥ 8.1**, ekstensi **sqlsrv** (Microsoft Drivers for PHP for SQL Server) dan **ODBC Driver 17/18 for SQL Server**.

## 2. Hubungkan SQL Server

1. Di SSMS buat database kosong: `CREATE DATABASE CBI_Checksheet;`
2. Isi `.env` (`hostname`, `database`, `username`, `password`). Named instance: `NAMA-PC\SQLEXPRESS` tanpa port.
3. Pastikan TCP/IP aktif di SQL Server Configuration Manager bila server remote.
4. Bila memakai **ODBC Driver 18** dan muncul error sertifikat/SSL, di `app/Config/Database.php` pada grup `$default` pastikan
   `'encrypt' => false,` (dan `'trustServerCertificate' => true,` bila versi CI4 Anda mendukungnya), atau pakai ODBC Driver 17.

```bash
php spark migrate                   # membuat 12 tabel cs_*
php spark db:seed ChecksheetSeeder  # isi master CT & Scrubber persis seperti xlsx
php spark serve                     # http://localhost:8080
```

Produksi di IIS: arahkan root situs ke folder `public/`.

## 3. Cara pakai

| Aksi | Cara |
|---|---|
| Isi sel | Klik sel → pilih simbol **V / X / Ⓧ / O** + nilai ukur + catatan. Atau fokus sel lalu tekan `V` `X` `F`(Ⓧ) `O`, `Del` hapus, panah untuk pindah |
| ΔT (Delta temperature) | Otomatis = Inlet − Outlet (read-only) |
| Nilai di luar batas | Sel berwarna kuning + simbol otomatis X (mis. getaran > 5 mm/s, pH < 6) |
| Review harian | Klik **angka tanggal** (1–31) / baris PIC / baris KaSubSie → isi PIC, "isi semua V", Approve / Reject / Reset |
| Approve mingguan | Klik blok di baris **Kasie MTN** |
| Tanda tangan dokumen | Klik kotak **Ka.Sub Sie → Ka.Sie → Ka.Dept** (berurutan; Ka.Dept = lembar final & terkunci) |
| Temuan Problem | Isi langsung pada tabel bawah (auto-simpan), tombol "+ Tambah baris" |
| Cetak | Tombol **Cetak** (A4 landscape) |

Aturan approval (di `ApprovalService`, parameter di `Config\Checksheet`):
hari **Approved = terkunci**; Reject wajib catatan & membuka kunci; Kasie hanya bisa approve minggu yang semua hari berisinya sudah
di-approve; Reject minggu membuka kembali hari-harinya; Reject di satu level dokumen menggugurkan level sesudahnya.

## 4. Arsitektur (untuk jangka panjang)

```
Controllers/Api/*  → tipis: validasi input, panggil service, kembalikan state
Services/          → seluruh logika bisnis (Entry, Approval, Lock, Finding, Sheet, SheetStateBuilder)
Models/            → akses data per tabel     Enums/ → simbol, role, status, scope
Config/Checksheet  → aturan bisnis yang bisa diubah (blok minggu, urutan TTD, syarat approve)
Database/          → migrasi + seeder (master form)
public/assets/js   → api.js (HTTP) · render.js (state→HTML, murni) · app.js (interaksi)
```

* **Data-driven**: form = baris di `cs_templates` + `cs_template_items`. Mesin/form baru (Chiller, Boiler, dst.) cukup *insert data*, tanpa ubah kode.
* **Semua mutasi mengembalikan state terbaru** → UI tidak pernah menebak. Server memegang aturan (lock, ΔT, statistik).
* **Real-time**: setiap perubahan menaikkan `cs_sheets.rev_no`; klien polling `GET /sheets/{id}?since=rev` tiap 4 dtk (murah, tanpa websocket,
  aman di IIS). Bisa diganti SSE/WebSocket kelak tanpa mengubah kontrak state.
* **Semua mutasi POST** (hindari masalah PUT/DELETE di IIS/WebDAV). API berversi `/api/v1`.
* **Jejak audit**: tiap isian/approval menyimpan nama pelaku (header `X-Actor-Name`).

## 5. Titik sambung berikutnya

* **Login/role**: ganti `BaseApiController::actor()` dengan identitas dari sesi/SSO, dan tambahkan pengecekan role di `ApprovalService::act()`.
  Saat ini (sesuai permintaan, tanpa login) siapa pun bisa menekan Approve — nama hanya dicatat.
* Integrasi lain (ERP/CMMS/notifikasi): daftarkan Event CI4 di akhir `ApprovalService::act()` / `EntryService::save()`.
* Export Excel/PDF: gunakan `SheetStateBuilder::build()` sebagai satu-satunya sumber data.
* CSRF: aktifkan filter `csrf` dan kirim token di `api.js` bila aplikasi dibuka ke jaringan yang lebih luas.
