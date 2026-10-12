<?php

namespace App\Controllers\Api;

use App\Models\TemplateModel;
use CodeIgniter\HTTP\ResponseInterface;

class TemplateController extends BaseApiController
{
    public function index(): ResponseInterface
    {
        return $this->run(static fn () => array_map(
            static fn ($t) => ['code' => $t['code'], 'machine_type' => $t['machine_type']],
            (new TemplateModel())->where('is_active', 1)->orderBy('sort_order')->findAll()
        ));
    }
}
