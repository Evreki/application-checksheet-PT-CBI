<?php

namespace App\Controllers\Api;

use App\Services\ApprovalService;
use CodeIgniter\HTTP\ResponseInterface;

class ApprovalController extends BaseApiController
{
    private const RULES = [
        'scope' => 'required|in_list[DAY,WEEK,DOC]',
        'ref'   => 'permit_empty|is_natural',
        'role'  => 'required|in_list[KASUBSIE,KASIE,KADEPT]',
    ];

    public function act(int $id): ResponseInterface
    {
        return $this->run(function () use ($id) {
            $in = $this->payload(self::RULES + ['status' => 'required|in_list[APPROVED,REJECTED]', 'note' => 'permit_empty|max_length[500]']);
            (new ApprovalService())->act($id, $in['scope'], (int) ($in['ref'] ?? 0), $in['role'], $in['status'], $in['note'] ?? null, $this->actor());
            return $this->state($id);
        });
    }

    public function revoke(int $id): ResponseInterface
    {
        return $this->run(function () use ($id) {
            $in = $this->payload(self::RULES);
            (new ApprovalService())->revoke($id, $in['scope'], (int) ($in['ref'] ?? 0), $in['role'], $this->actor());
            return $this->state($id);
        });
    }
}
