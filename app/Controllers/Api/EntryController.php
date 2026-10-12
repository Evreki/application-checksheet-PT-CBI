<?php

namespace App\Controllers\Api;

use App\Services\EntryService;
use CodeIgniter\HTTP\ResponseInterface;

class EntryController extends BaseApiController
{
    public function save(int $id): ResponseInterface
    {
        return $this->run(function () use ($id) {
            $in = $this->payload([
                'item_id' => 'required|is_natural_no_zero',
                'day'     => 'required|is_natural_no_zero|less_than_equal_to[31]',
                'symbol'  => 'permit_empty|in_list[V,X,XF,O]',
                'note'    => 'permit_empty|max_length[500]',
            ]);
            (new EntryService())->save($id, (int) $in['item_id'], (int) $in['day'], $in['symbol'] ?? null, $in['value'] ?? null, $in['note'] ?? null, $this->actor());
            return $this->state($id);
        });
    }

    public function fillDay(int $id, int $day): ResponseInterface
    {
        return $this->run(function () use ($id, $day) {
            $in = $this->payload(['symbol' => 'required|in_list[V,X,XF,O]']);
            (new EntryService())->fillDay($id, $day, $in['symbol'], $this->actor());
            return $this->state($id);
        });
    }
}
