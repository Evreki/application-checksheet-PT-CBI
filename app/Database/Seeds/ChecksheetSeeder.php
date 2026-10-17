<?php

namespace App\Database\Seeds;

use CodeIgniter\Database\Seeder;

/** Master template persis seperti file Daily_Checksheet_Utility (CT & Scrubber). Idempotent. */
class ChecksheetSeeder extends Seeder
{
    public function run(): void
    {
        $common = ['department' => 'Maintenance', 'section' => 'Utility', 'form_no' => 'Form-PLS-MTC-D08', 'revision' => '0', 'page_info' => '1 dari 1'];

        // [no, bagian, metode, standar, instruksi, accepts_value, unit, min, max, calc, refs]
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

        // CHILLER LSBLG250 - Harian & Mingguan
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
            // Daily Check items (1-6)
            [1, 'High Press Indikator', 'Check', 'P STD < 150 PSI', 'C', 1, 'PSI', null, 150, null, null, '1x/day'],
            [2, 'Low press Indikator', 'Check', 'P STD 80 > 60 PSI', 'C', 1, 'PSI', 60, 80, null, null, '1x/day'],
            [3, 'Cooling Tower', 'Check', 'BERFUNGSI NORMAL', 'C', 0, null, null, null, null, null, '1x/day'],
            [4, 'Valve In Out Cooling', 'Check', 'TIDAK MAMAPET/KOTOR', 'C', 0, null, null, null, null, null, '1x/day'],
            [5, 'Running Hour', 'Check', 'CATAT DARI DIPSLAY', 'C', 1, 'Jam', null, null, null, null, '1x/day'],
            [6, '% Running', 'Check', 'CATAT DARI DISPLAY 50 %,75%,100%', 'C', 1, '%', null, null, null, null, '1x/day'],
            // Weekly Preventive items (7-11)
            [7, 'Emergency Stop', 'Check', 'Cek Kondisi Push Button', 'C', 0, null, null, null, null, null, '1x/Week'],
            [8, 'Kebocoran Freon', 'Check', 'Tidak ada Rembesan Oli /freon', 'C', 0, null, null, null, null, null, '1x/Week'],
            [9, 'Kebersihan Mesin', 'Bersihkan', 'Tidak ada korosi dan genangan Air', 'B', 0, null, null, null, null, null, '1x/Week'],
            [10, 'Check Ampere Motor', 'Ukur', 'Ampere STD Motor', 'U', 1, 'A', null, null, null, null, '1x/Week'],
            [11, 'Pompa Tranfer', 'Check', 'Tidak ada bocor & vibrasi', 'C', 0, null, null, null, null, null, '1x/Week'],
        ]);

        // CHILLER LSBLG250 - Bulanan & Berkala
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

        // CHILLER LSBLG250 - Standard Preventive Machine (STD)
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
