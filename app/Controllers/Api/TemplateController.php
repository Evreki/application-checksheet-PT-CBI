<?php

namespace App\Controllers\Api;

use App\Models\TemplateModel;
use CodeIgniter\HTTP\ResponseInterface;

class TemplateController extends BaseApiController
{
    public function index(): ResponseInterface
    {
        return $this->run(static fn () => array_map(
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
        ));
    }
}
