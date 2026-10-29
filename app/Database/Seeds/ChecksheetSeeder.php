<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

/** Master template dan seed data PT. Century Batteries Indonesia. Idempotent. */
class ChecksheetSeeder extends Seeder
{
    public function run(): void
    {
        $common = ['department' => 'Maintenance', 'section' => 'Utility', 'form_no' => 'Form-PLS-MTC-D08', 'revision' => '0', 'page_info' => '1 dari 1'];

        // =========================================================================
        // 1. COOLING TOWER
        // =========================================================================
        $this->seedTemplate($common + [
            'code' => 'CT', 'machine_type' => 'Cooling Tower', 'sort_order' => 1,
            'hints' => json_encode(['Inlet Temp (°C)', 'Outlet Temp (°C)', 'ΔT (°C)', 'Level Basin', 'Make-up Valve', 'Fan & Motor', 'Getaran Fan', 'Distribusi Air', 'Kualitas Air', 'Kebocoran / Overflow', 'Catatan'], JSON_UNESCAPED_UNICODE),
        ], [
            [1, 'Inlet temperature', 'Cek Ukur', '(tergantung mesin)', 'C / T', 1, '°C', null, null, null, null],
            [2, 'Outlet temperature', 'Cek Ukur', '(tergantung mesin)', 'C', 1, '°C', null, null, null, null],
            [3, 'Delta temperature', 'Cek Ukur', '(tergantung mesin)', 'C', 1, '°C', null, null, 'DIFF', '1,2'],
            [4, 'Level Basin', 'Cek Visual', 'tidak luber/tekor', 'C', 0, null, null, null, null, null],
            [5, 'Make Up Valve', 'Cek Visual', 'berfungsi', 'C', 0, null, null, null, null, null],
            [6, 'Fan & Motor', 'Cek Ukur', 'Std ampere', 'C', 1, 'A', null, null, null, null],
            [7, 'Getaran Fan', 'Cek Ukur', 'Max 5 mm/s', 'C', 1, 'mm/s', null, 5, null, null],
            [8, 'Demister', 'Cek Visual', 'Bersih dan lancar', 'C', 0, null, null, null, null, null],
            [9, 'pH Air', 'Cek Ukur', 'minimum 6', 'C', 1, 'pH', 6, null, null, null],
            [10, 'Kebocoran/overflow', 'Cek Visual', 'tidak ada', 'C', 0, null, null, null, null, null],
        ]);

        // =========================================================================
        // 2. SCRUBBER
        // =========================================================================
        $this->seedTemplate($common + [
            'code' => 'SCR', 'machine_type' => 'Scrubber', 'sort_order' => 2,
            'hints' => json_encode(['pH', 'Flow (m3/h)', 'Pressure Drop', 'Level Tank (%)', 'Suhu (°C)', 'Pompa', 'Nozzle', 'Packing', 'Fan/Blower', 'Ducting', 'Kebocoran', 'Dosing Chemical', 'Sludge'], JSON_UNESCAPED_UNICODE),
        ], [
            [1, 'pH Air', 'Cek Ukur', '(tergantung mesin)', 'C / U', 1, 'pH', null, null, null, null],
            [2, 'Flow Pompa', 'Cek Visual', '(tergantung pompa)', 'C', 0, null, null, null, null, null],
            [3, 'Tekanan hisap', 'Cek Ukur', '20 m/s', 'C / U', 1, 'm/s', null, null, null, null],
            [4, 'Level tanki', 'Cek Visual', 'tidak luber/tekor', 'C / T', 0, null, null, null, null, null],
            [5, 'Kondisi pompa spray', 'Cek Visual', 'tidak mampet, tidak bocor', 'C', 0, null, null, null, null, null],
            [6, 'Nozzle spray', 'Cek Ukur', 'tidak mampet, tidak bocor', 'C', 0, null, null, null, null, null],
            [7, 'Getaran Fan', 'Cek Ukur', 'Max 5 mm/s', 'C / U', 1, 'mm/s', null, 5, null, null],
            [8, 'Demister', 'Cek Visual', 'Bersih dan lancar', 'C', 0, null, null, null, null, null],
            [9, 'Kebocoran/overflow', 'Cek Ukur', 'tidak ada', 'C', 0, null, null, null, null, null],
            [10, 'Kondisi lumpur tanki', 'Cek Visual', 'max 10%', 'C', 1, '%', null, 10, null, null],
        ]);

        // =========================================================================
        // 3. CHILLER LSBLG250 - Harian & Mingguan
        // =========================================================================
        $this->seedTemplate([
            'department'   => 'Maintenance',
            'section'      => 'WET CHARGING',
            'form_no'      => 'Form-PLS-MTC-D08',
            'revision'     => '0',
            'page_info'    => '1 dari 1',
            'code'         => 'CHILLER_D',
            'machine_type' => 'CHILLER LSBLG250',
            'sort_order'   => 3,
            'hints'        => json_encode(['High Press Indikator', 'Low press Indikator', 'Cooling Tower', 'Valve In Out Cooling', 'Running Hour', '% Running', 'Emergency Stop', 'Kebocoran Freon', 'Kebersihan Mesin', 'Check Ampere Motor', 'Pompa Tranfer'], JSON_UNESCAPED_UNICODE),
        ], [
            [1, 'High Press Indikator', 'Check', 'P STD < 150 PSI', 'C', 1, 'PSI', null, 150, null, null, '1x/day'],
            [2, 'Low press Indikator', 'Check', 'P STD 80 > 60 PSI', 'C', 1, 'PSI', 60, 80, null, null, '1x/day'],
            [3, 'Cooling Tower', 'Check', 'BERFUNGSI NORMAL', 'C', 0, null, null, null, null, null, '1x/day'],
            [4, 'Valve In Out Cooling', 'Check', 'TIDAK MAMAPET/KOTOR', 'C', 0, null, null, null, null, null, '1x/day'],
            [5, 'Running Hour', 'Check', 'CATAT DARI DIPSLAY', 'C', 1, 'Jam', null, null, null, null, '1x/day'],
            [6, '% Running', 'Check', 'CATAT DARI DISPLAY 50 %,75%,100%', 'C', 1, '%', null, null, null, null, '1x/day'],
            [7, 'Emergency Stop', 'Check', 'Cek Kondisi Push Button', 'C', 0, null, null, null, null, null, '1x/Week'],
            [8, 'Kebocoran Freon', 'Check', 'Tidak ada Rembesan Oli /freon', 'C', 0, null, null, null, null, null, '1x/Week'],
            [9, 'Kebersihan Mesin', 'Bersihkan', 'Tidak ada korosi dan genangan Air', 'B', 0, null, null, null, null, null, '1x/Week'],
            [10, 'Check Ampere Motor', 'Ukur', 'Ampere STD Motor', 'U', 1, 'A', null, null, null, null, '1x/Week'],
            [11, 'Pompa Tranfer', 'Check', 'Tidak ada bocor & vibrasi', 'C', 0, null, null, null, null, null, '1x/Week'],
        ]);

        // =========================================================================
        // 4. CHILLER LSBLG250 - Bulanan & Berkala
        // =========================================================================
        $this->seedTemplate([
            'department'   => 'Maintenance',
            'section'      => 'Utility',
            'form_no'      => 'Form-PLS-MTC-D09',
            'revision'     => '0',
            'page_info'    => '1 dari 1',
            'code'         => 'CHILLER_M',
            'machine_type' => 'CHILLER LSBLG250',
            'sort_order'   => 4,
            'hints'        => json_encode(['Panel Kontrol', 'Filter Core Dryer', 'Selenoid Valve', 'Expansion Valve', 'Motor Pump', 'Kondesnser', 'Evaporator', 'Colling Tower & Water Strainer', 'Tekanan Freon', 'Flow Switch Kontrol', 'Kebocoran Freon', 'Screw Kompresor Level Oil', 'Oil', 'Oil Filter Catride', 'Temperature Screw Kompresor', 'Vibrasi Mesin'], JSON_UNESCAPED_UNICODE),
        ], [
            [1, 'Panel Kontrol', 'Kondisi', null, 'B', 0, null, null, null, null, null, '1/ 4 Bln'],
            [2, 'Filter Core Dryer', 'Pergantian', 'Over Houl Nov 16', 'G', 0, null, null, null, null, null, '1/1 Thn'],
            [3, 'Selenoid Valve', 'Cek', null, 'C', 0, null, null, null, null, null, '1/4 Bln'],
            [4, 'Selenoid Valve', 'Pergantian', null, 'G', 0, null, null, null, null, null, '1/1 Thn'],
            [5, 'Expansion Valve', 'Cek', null, 'C', 0, null, null, null, null, null, '1/4 Bln'],
            [6, 'Motor Pump', 'Kondisi', null, 'C', 0, null, null, null, null, null, '1/4 Bln'],
            [7, 'Kondesnser', 'Kebersihan', null, 'B', 0, null, null, null, null, null, '1/6 Bln'],
            [8, 'Evaporator', 'Kebersihan', null, 'B', 0, null, null, null, null, null, '1/6 Bln'],
            [9, 'Colling Tower & Water Strainer', 'Kebersihan', null, 'B', 0, null, null, null, null, null, '1/4 Bln'],
            [10, 'Tekanan Freon', 'Cek', null, 'C', 1, 'bar', null, null, null, null, '1/4 Bln'],
            [11, 'Tekanan Freon', 'Penambahan', null, 'T', 0, null, null, null, null, null, '1/1 Thn'],
            [12, 'Flow Switch Kontrol', 'Cek', null, 'C', 0, null, null, null, null, null, '1/4 Bln'],
            [13, 'Kebocoran Freon', 'Cek', null, 'C', 0, null, null, null, null, null, '1/4 Bln'],
            [14, 'Screw Kompresor Level Oil', 'Cek', null, 'C', 0, null, null, null, null, null, '1/4 Bln'],
            [15, 'Oil', 'Pergantian', null, 'G', 0, null, null, null, null, null, '1/1 Thn'],
            [16, 'Oil Filter Catride', 'Pergantian', null, 'G', 0, null, null, null, null, null, '1/1 Thn'],
            [17, 'Temperature Screw Kompresor', 'Cek', null, 'C', 1, '°C', null, 85, null, null, '1/4 Bln'],
            [18, 'Vibrasi Mesin', 'Cek', null, 'C', 1, 'mm/s', null, 4.5, null, null, '1/4 Bln'],
        ]);

        // =========================================================================
        // 5. CHILLER LSBLG250 - Standard Preventive Machine (STD)
        // =========================================================================
        $this->seedTemplate([
            'department'   => 'PLANT SERVICE',
            'section'      => 'WET CHARGING',
            'form_no'      => 'Form-PLS-MTC-D04',
            'revision'     => '0',
            'page_info'    => '1 dari 1',
            'code'         => 'CHILLER_S',
            'machine_type' => 'CHILLER LSBLG250',
            'sort_order'   => 5,
            'hints'        => json_encode(['Panel Kontrol', 'Filter Core Dryer', 'Selenoid Valve', 'Expansion Valve', 'Motor Pump', 'Valve In Out Cooling', 'Kondesnser', 'Evaporator', 'Colling Tower & Water Stariner', 'Tekanan Freon', 'Flow Switch Kontrol', 'Kebocoran Freon', 'Screw Kompresor Level Oil', 'Oil Filter Catride', 'Temperature Screw Kompresor', 'Vibrasi Mesin'], JSON_UNESCAPED_UNICODE),
        ], [
            [1, 'Panel Kontrol', 'Kondisi', 'Pengecekan Power Supply dan Ampere', 'B', 0, null, null, null, null, null, '1/ 4 Bln'],
            [2, 'Filter Core Dryer', 'Pergantian', 'Pergantian Core Dryer H 48', 'G', 0, null, null, null, null, null, '1/1 Thn'],
            [3, 'Selenoid Valve', 'Cek', 'Cek Fungsi Coil Selenoid', 'C', 0, null, null, null, null, null, '1/4 Bln'],
            [4, 'Selenoid Valve', 'Pergantian', 'Pergantian Coil Selenoid', 'G', 0, null, null, null, null, null, '1/1 Thn'],
            [5, 'Expansion Valve', 'Cek', 'Cek/Periksa Fungsi Expansion Valve', 'C', 0, null, null, null, null, null, '1/4 Bln'],
            [6, 'Motor Pump', 'Kondisi', 'Cek/Periksa Motor Pump', 'C', 0, null, null, null, null, null, '1/4 Bln'],
            [7, 'Valve In Out Cooling', 'Kondisi', 'Valve harus terbuka', 'C', 0, null, null, null, null, null, '1/ Day'],
            [8, 'Kondesnser', 'Kebersihan', 'Dibersihkan dari kerak/korosif', 'B', 0, null, null, null, null, null, '1/6 Bln'],
            [9, 'Evaporator', 'Kebersihan', 'Dibersihkan dari kerak/korosif', 'B', 0, null, null, null, null, null, '1/6 Bln'],
            [10, 'Colling Tower & Water Stariner', 'Kebersihan', 'Dibersihkan dari kerak/korosif', 'B', 0, null, null, null, null, null, '1/4 Bln'],
            [11, 'Tekanan Freon', 'Cek', 'Pengecekan Tekanan Freon', 'C', 0, null, null, null, null, null, '1/ Day'],
            [12, 'Tekanan Freon', 'Penambahan', 'Penambahan Freon R22', 'T', 0, null, null, null, null, null, '1/1 Thn'],
            [13, 'Flow Switch Kontrol', 'Cek', 'Pengecekan Water Flow', 'C', 0, null, null, null, null, null, '1/4 Bln'],
            [14, 'Kebocoran Freon', 'Cek', 'Pengecekan Kebocoran', 'C', 0, null, null, null, null, null, '1/4 Bln'],
            [15, 'Screw Kompresor Level Oil', 'Cek', 'Pengecekan Level Oli', 'C', 0, null, null, null, null, null, '1/4 Bln'],
            [16, 'Screw Kompresor Level Oil', 'Pergantian', 'Penggantian Oli (12.000 jam)', 'G', 0, null, null, null, null, null, '1/1 Thn'],
            [17, 'Oil Filter Catride', 'Pergantian', 'Penggantian Oli (12.000 jam)', 'G', 0, null, null, null, null, null, '1/1 Thn'],
            [18, 'Temperature Screw Kompresor', 'Cek', 'Pengecekan Temp Kompresor', 'C', 0, null, null, null, null, null, '1/4 Bln'],
            [19, 'Vibrasi Mesin', 'Cek', 'Pengecekan Mounting dan vibrasi', 'C', 0, null, null, null, null, null, '1/4 Bln'],
        ]);

        // =========================================================================
        // 6. AIR DRYER ACT80 - Harian & Mingguan (Daily & Weekly)
        // =========================================================================
        $this->seedTemplate([
            'department'   => 'PLANT SERVICE',
            'section'      => 'MAINTENANCE UTILITY',
            'form_no'      => 'Form-PLS-MTC-D08',
            'revision'     => '0',
            'page_info'    => '1 dari 1',
            'code'         => 'AD_D',
            'machine_type' => 'AIR DRYER FRIULAIR ACT80',
            'sort_order'   => 6,
            'hints'        => json_encode(['Indikator Power', 'Due point Indikator', 'Temperature Kerja', 'Kompresor', 'Fan Kondenser', 'Auto Drain', 'EMERGENCY STOP', 'BODY MESIN', 'FILTER KONDENSOR', 'CHECK KEBOCORAN ANGIN', 'PRE FILTER DRYER FTX', 'AFTER FILTER DRYER FTS'], JSON_UNESCAPED_UNICODE),
        ], [
            // Daily Check (1 - 6)
            [1, 'Indikator Power', 'Cek', 'Lampu menyala', 'C', 0, null, null, null, null, null, '1x/Day'],
            [2, 'Due point Indikator', 'Cek', 'Tidak ada indikator alarm menyala', 'C', 0, null, null, null, null, null, '1x/Day'],
            [3, 'Temperature Kerja', 'Cek', '70 s/d 100 °C', 'C', 1, '°C', 70, 100, null, null, '1x/Day'],
            [4, 'Kompresor', 'Fungsi', 'Running tanpa vibrasi berlebih', 'C', 0, null, null, null, null, null, '1x/Day'],
            [5, 'Fan Kondenser', 'Fungsi', 'Running tanpa vibrasi', 'C', 0, null, null, null, null, null, '1x/Day'],
            [6, 'Auto Drain', 'Fungsi', 'Membuang air kondensasi secara normal', 'C', 0, null, null, null, null, null, '1x/Day'],
            // Weekly Preventive (7 - 13)
            [7, 'Emergency Stop', 'Fungsi', 'Emergency berfungsi baik saat ditekan', 'C', 0, null, null, null, null, null, '1x/Week'],
            [8, 'Body Mesin', 'Kebersihan', 'Body mesin bersih dari debu/oli', 'B', 0, null, null, null, null, null, '1x/Week'],
            [9, 'Filter Kondensor', 'Kebersihan', 'Tidak kotor / berdebu', 'B', 0, null, null, null, null, null, '1x/Week'],
            [10, 'Check Kebocoran Angin', 'Kondisi', 'Tidak ada udara bocor pada pipa koneksi', 'C', 0, null, null, null, null, null, '1x/Week'],
            [11, 'Pre Filter Dryer FTX', 'Kebersihan', 'Bersihkan filter cartridge', 'B', 0, null, null, null, null, null, '1x/Week'],
            [12, 'After Filter Dryer FTS', 'Kebersihan', 'Bersihkan filter cartridge', 'B', 0, null, null, null, null, null, '1x/Week'],
            [13, 'Auto Drain Weekly', 'Kebersihan', 'Bersihkan saringan dan discharge pipa', 'B', 0, null, null, null, null, null, '1x/Week'],
        ]);

        // =========================================================================
        // 7. AIR DRYER ACT80 - Overhaul & Berkala (Form-PLS-MTC-D09)
        // =========================================================================
        $this->seedTemplate([
            'department'   => 'Maintenance',
            'section'      => 'Utility',
            'form_no'      => 'Form-PLS-MTC-D09',
            'revision'     => '0',
            'page_info'    => '1 dari 1',
            'code'         => 'AD_M',
            'machine_type' => 'AIR DRYER FRIULAIR ACT80',
            'sort_order'   => 7,
            'hints'        => json_encode(['Pre Filter Dryer FTX', 'After Filter Dryer FTS', 'Tekanan Freon', 'Kondenser Dry Cleaning', 'Kondenser Wet Cleaning'], JSON_UNESCAPED_UNICODE),
        ], [
            [1, 'Pre Filter Dryer FTX', 'Pergantian', 'Ganti filter cartridge element', 'G', 0, null, null, null, null, null, '1x/6 bln'],
            [2, 'After Filter Dryer FTS', 'Pergantian', 'Ganti filter cartridge element', 'G', 0, null, null, null, null, null, '1x/6 bln'],
            [3, 'Tekanan Freon', 'Cek', 'Tekanan freon dalam batas aman operasi', 'U', 1, 'bar', null, null, null, null, '1x/3 bln'],
            [4, 'Kondenser', 'Dry Cleaning', 'Pembersihan kisi kondenser kering', 'B', 0, null, null, null, null, null, '1x/bln'],
            [5, 'Kondenser', 'Wet Cleaning', 'Pembersihan basah chemical', 'B', 0, null, null, null, null, null, '1x/6 bln'],
        ]);

        // =========================================================================
        // 8. AIR DRYER ACT80 - Standard Preventive Machine (STD)
        // =========================================================================
        $this->seedTemplate([
            'department'   => 'PLANT SERVICE',
            'section'      => 'MAINTENANCE',
            'form_no'      => 'Form-PLS-MTC-D04',
            'revision'     => '0',
            'page_info'    => '1 dari 1',
            'code'         => 'AD_S',
            'machine_type' => 'AIR DRYER FRIULAIR ACT55/80',
            'sort_order'   => 8,
            'hints'        => json_encode(['Indikator Power', 'Due point Indikator', 'Emergency Stop', 'Body Mesin', 'Temperatur Kerja', 'Kebocoran Angin', 'Filter Kondensor', 'Kompresor', 'Fan Kondensor', 'Pre Filter Dryer', 'After Filter Dryer', 'Auto Drain'], JSON_UNESCAPED_UNICODE),
        ], [
            [1, 'Indikator Power', 'Kondisi', 'Lampu Menyala', 'C', 0, null, null, null, null, null, '1x/Day'],
            [2, 'Due point Indikator', 'Kondisi', 'Tidak Ada Indikator Alarm Menyala', 'C', 0, null, null, null, null, null, '1x/Day'],
            [3, 'Emergency Stop', 'Fungsi', 'Emergency Berfungsi', 'C', 0, null, null, null, null, null, '1x/Week'],
            [4, 'Body Mesin', 'Kebersihan', 'Body Mesin Bersih', 'B', 0, null, null, null, null, null, '1x/Week'],
            [5, 'Temperatur Kerja', 'Kondisi', '70 s/d 100 °C', 'C', 1, '°C', 70, 100, null, null, '1x/Day'],
            [6, 'Check Kebocoran Angin', 'Kondisi', 'Tidak Ada Udara Bocor Pada Pipa', 'C', 0, null, null, null, null, null, '1x/Week'],
            [7, 'Filter Kondensor', 'Kebersihan', 'Tidak Kotor / Berdebu', 'B', 0, null, null, null, null, null, '1x/Week'],
            [8, 'Kompresor', 'Fungsi', 'Running Tanpa Vibrasi', 'C', 0, null, null, null, null, null, '1x/Day'],
            [9, 'Fan Kondensor', 'Fungsi', 'Running Tanpa Vibrasi', 'C', 0, null, null, null, null, null, '1x/Day'],
            [10, 'Pre Filter Dryer', 'Kebersihan', 'Bersihkan Filter Cartridge', 'B', 0, null, null, null, null, null, '1x/Week'],
            [11, 'Pre Filter Dryer', 'Pergantian', 'Ganti Filter Cartridge Element', 'G', 0, null, null, null, null, null, '1x/6 bulan'],
            [12, 'After Filter Dryer', 'Kebersihan', 'Bersihkan Filter Cartridge', 'B', 0, null, null, null, null, null, '1x/Week'],
            [13, 'After Filter Dryer', 'Pergantian', 'Ganti Filter Cartridge Element', 'G', 0, null, null, null, null, null, '1x/6 bulan'],
            [14, 'Auto Drain', 'Fungsi', 'Bersihkan & Berfungsi Normal', 'C', 0, null, null, null, null, null, '1x/Day'],
        ]);

        // =========================================================================
        // 9. SEED PENGGUNA (TRIAL: 1 LEADER + 2 USER) - PASSWORD: 12345
        // =========================================================================
        $now = date('Y-m-d H:i:s');
        $pwd = password_hash('12345', PASSWORD_DEFAULT);

        $users = [
            ['username' => 'leader', 'password_hash' => $pwd, 'full_name' => 'Bambang Sutrisno', 'role' => 'leader', 'department' => 'Maintenance', 'section' => 'Utility', 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['username' => 'user1',  'password_hash' => $pwd, 'full_name' => 'Ahmad Subarjo',   'role' => 'user',   'department' => 'Maintenance', 'section' => 'Utility', 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['username' => 'user2',  'password_hash' => $pwd, 'full_name' => 'Budi Triawan',    'role' => 'user',   'department' => 'Maintenance', 'section' => 'Electrical', 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],
        ];

        foreach ($users as $u) {
            $exist = $this->db->table('cs_users')->where('username', $u['username'])->get()->getRowArray();
            if ($exist) {
                $this->db->table('cs_users')->where('id', $exist['id'])->update($u);
            } else {
                $this->db->table('cs_users')->insert($u);
            }
        }

        // =========================================================================
        // 10. SEED MULTI-INSTANCE EQUIPMENT (GEDUNG A, GEDUNG B, GEDUNG C)
        // =========================================================================
        $instances = [
            // Air Dryer ACT80 Instances
            ['equipment_group' => 'air-dryer', 'template_code' => 'AD_D', 'instance_code' => 'AD-001', 'instance_name' => 'Air Dryer Friulair #1', 'building' => 'Gedung A', 'room_location' => 'Ruang Kompresor Utama Gedung A', 'sort_order' => 1, 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['equipment_group' => 'air-dryer', 'template_code' => 'AD_D', 'instance_code' => 'AD-002', 'instance_name' => 'Air Dryer Friulair #2', 'building' => 'Gedung B', 'room_location' => 'Sub-Station Assembly Gedung B', 'sort_order' => 2, 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['equipment_group' => 'air-dryer', 'template_code' => 'AD_D', 'instance_code' => 'AD-003', 'instance_name' => 'Air Dryer Friulair #3', 'building' => 'Gedung C', 'room_location' => 'Area Wet Charging Gedung C', 'sort_order' => 3, 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],
            
            // Chiller LSBLG250 Instances
            ['equipment_group' => 'chiller',   'template_code' => 'CHILLER_D', 'instance_code' => 'CH-001', 'instance_name' => 'Chiller Sentral #1', 'building' => 'Gedung A', 'room_location' => 'Chiller Plant Ruang Utama A', 'sort_order' => 4, 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['equipment_group' => 'chiller',   'template_code' => 'CHILLER_D', 'instance_code' => 'CH-002', 'instance_name' => 'Chiller Sentral #2', 'building' => 'Gedung B', 'room_location' => 'Sub Chiller Plant Gedung B', 'sort_order' => 5, 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['equipment_group' => 'chiller',   'template_code' => 'CHILLER_D', 'instance_code' => 'CH-003', 'instance_name' => 'Chiller Sentral #3', 'building' => 'Gedung C', 'room_location' => 'Ruang Chiller Standby Gedung C', 'sort_order' => 6, 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],

            // Cooling Tower & Scrubber
            ['equipment_group' => 'cooling-tower', 'template_code' => 'CT', 'instance_code' => 'CT-001', 'instance_name' => 'Cooling Tower Utama #1', 'building' => 'Gedung A', 'room_location' => 'Rooftop Utility Gedung A', 'sort_order' => 7, 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['equipment_group' => 'scrubber',      'template_code' => 'SCR', 'instance_code' => 'SCR-001', 'instance_name' => 'Scrubber Kimia #1', 'building' => 'Gedung A', 'room_location' => 'Exhaust Area Outdoor Gedung A', 'sort_order' => 8, 'is_active' => 1, 'created_at' => $now, 'updated_at' => $now],
        ];

        foreach ($instances as $ins) {
            $exist = $this->db->table('cs_equipment_instances')->where('instance_code', $ins['instance_code'])->get()->getRowArray();
            if ($exist) {
                $this->db->table('cs_equipment_instances')->where('id', $exist['id'])->update($ins);
            } else {
                $this->db->table('cs_equipment_instances')->insert($ins);
            }
        }
    }

    private function seedTemplate(array $tpl, array $rows): void
    {
        $existing = $this->db->table('cs_templates')->where('code', $tpl['code'])->get()->getRowArray();
        $now = date('Y-m-d H:i:s');
        
        if ($existing) {
            $tid = (int) $existing['id'];
            $this->db->table('cs_templates')->where('id', $tid)->update($tpl + ['updated_at' => $now]);
        } else {
            $this->db->table('cs_templates')->insert($tpl + ['is_active' => 1, 'created_at' => $now, 'updated_at' => $now]);
            $tid = (int) $this->db->insertID();
        }

        foreach ($rows as $i => $r) {
            $period = $r[11] ?? '1 x per Hari';
            [$no, $part, $method, $std, $inst, $acc, $unit, $min, $max, $calc, $refs] = $r;
            $itemData = [
                'template_id' => $tid, 'item_no' => $no, 'equipment_part' => $part, 'inspection_method' => $method,
                'standard' => $std, 'period' => $period, 'instruction_codes' => $inst, 'inspection_mark' => 'I',
                'accepts_value' => $acc, 'value_unit' => $unit, 'limit_min' => $min, 'limit_max' => $max,
                'calc_type' => $calc, 'calc_refs' => $refs, 'sort_order' => $i + 1,
            ];

            $itemExist = $this->db->table('cs_template_items')->where(['template_id' => $tid, 'item_no' => $no])->get()->getRowArray();
            if ($itemExist) {
                $this->db->table('cs_template_items')->where('id', $itemExist['id'])->update($itemData);
            } else {
                $this->db->table('cs_template_items')->insert($itemData);
            }
        }
    }
}
