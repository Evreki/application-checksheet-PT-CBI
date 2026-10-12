<?php

namespace App\Controllers\Api;

use App\Services\FindingService;
use CodeIgniter\HTTP\ResponseInterface;

class FindingController extends BaseApiController
{
    public function save(int $id): ResponseInterface
    {
        return $this->run(function () use ($id) {
            $in = $this->payload(['line_no' => 'required|is_natural_no_zero']);
            (new FindingService())->save($id, $in, $this->actor());
            return $this->state($id);
        });
    }

    public function delete(int $id, int $line): ResponseInterface
    {
        return $this->run(function () use ($id, $line) {
            (new FindingService())->delete($id, $line, $this->actor());
            return $this->state($id);
        });
    }
}
