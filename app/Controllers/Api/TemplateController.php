<?php

namespace App\Controllers\Api;

use App\Models\TemplateModel;
use CodeIgniter\HTTP\ResponseInterface;

class TemplateController extends BaseApiController
{
    public function index(): ResponseInterface
    {
        return $this->run(static function () {
            try {
                return array_map(
                    static fn ($t) => [
                        'code'         => $t['code'],
                        'machine_type' => $t['machine_type'],
                        'department'   => $t['department'],
                        'section'      => $t['section'],
                        'form_no'      => $t['form_no'],
                        'revision'     => $t['revision'],
                        'hints'        => $t['hints'] ? json_decode($t['hints'], true) : [],
                    ],
                    (new TemplateModel())->where('is_active', 1)->orderBy('sort_order')->findAll()
                );
            } catch (\Throwable $e) {
                log_message('warning', 'DB templates error: ' . $e->getMessage());
                return [
                    ['code' => 'AD_D', 'machine_type' => 'Air Dryer ACT80', 'department' => 'Maintenance', 'section' => 'Utility', 'form_no' => 'Form-PLS-MTC-D08', 'revision' => '0', 'hints' => []],
                    ['code' => 'CHILLER_D', 'machine_type' => 'CHILLER LSBLG250', 'department' => 'Maintenance', 'section' => 'WET CHARGING', 'form_no' => 'Form-PLS-MTC-D08', 'revision' => '0', 'hints' => []],
                    ['code' => 'CT', 'machine_type' => 'Cooling Tower', 'department' => 'Maintenance', 'section' => 'Utility', 'form_no' => 'Form-PLS-MTC-D08', 'revision' => '0', 'hints' => []],
                    ['code' => 'SCR', 'machine_type' => 'Scrubber', 'department' => 'Maintenance', 'section' => 'Utility', 'form_no' => 'Form-PLS-MTC-D08', 'revision' => '0', 'hints' => []],
                ];
            }
        });
    }
}
