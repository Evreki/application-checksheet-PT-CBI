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
    }

    private function seedTemplate(array $tpl, array $rows): void
    {
        if ($this->db->table('cs_templates')->where('code', $tpl['code'])->countAllResults() > 0) {
            return;
        }
        $now = date('Y-m-d H:i:s');
        $this->db->table('cs_templates')->insert($tpl + ['is_active' => 1, 'created_at' => $now, 'updated_at' => $now]);
        $tid = (int) $this->db->insertID();

        foreach ($rows as $i => [$no, $part, $method, $std, $inst, $acc, $unit, $min, $max, $calc, $refs]) {
            $this->db->table('cs_template_items')->insert([
                'template_id' => $tid, 'item_no' => $no, 'equipment_part' => $part, 'inspection_method' => $method,
                'standard' => $std, 'period' => '1 x per Hari', 'instruction_codes' => $inst, 'inspection_mark' => 'I',
                'accepts_value' => $acc, 'value_unit' => $unit, 'limit_min' => $min, 'limit_max' => $max,
                'calc_type' => $calc, 'calc_refs' => $refs, 'sort_order' => $i + 1,
            ]);
        }
    }
}
