<?php

namespace App\Controllers\Api;

use App\Services\SheetService;
use CodeIgniter\HTTP\ResponseInterface;

class SheetController extends BaseApiController
{
    public function open(): ResponseInterface
    {
        return $this->run(function () {
            $in = $this->payload(['template' => 'required|max_length[30]', 'year' => 'required|is_natural_no_zero', 'month' => 'required|is_natural_no_zero']);
            $id = (new SheetService())->open($in['template'], (int) $in['year'], (int) $in['month']);
            return $this->state($id);
        });
    }

    /** ?since=<versi>  → bila tidak berubah cukup {changed:false} (polling murah). */
    public function show(int $id): ResponseInterface
    {
        return $this->run(function () use ($id) {
            $since = $this->request->getGet('since');
            if ($since !== null && $since !== '') {
                $cur = (int) (new SheetService())->sheet($id)['rev_no'];
                if ((int) $since === $cur) {
                    return ['changed' => false, 'version' => $cur];
                }
            }
            return $this->state($id);
        });
    }

    public function updateHeader(int $id): ResponseInterface
    {
        return $this->run(function () use ($id) {
            $in = $this->payload();
            (new SheetService())->updateHeader($id, $in, $this->actor());
            return $this->state($id);
        });
    }

    public function saveRemark(int $id): ResponseInterface
    {
        return $this->run(function () use ($id) {
            $in = $this->payload(['item_id' => 'required|is_natural_no_zero', 'remark' => 'permit_empty|max_length[500]']);
            (new SheetService())->saveRemark($id, (int) $in['item_id'], $in['remark'] ?? '', $this->actor());
            return $this->state($id);
        });
    }

    public function savePic(int $id, int $day): ResponseInterface
    {
        return $this->run(function () use ($id, $day) {
            $in = $this->payload(['name' => 'permit_empty|max_length[100]']);
            (new SheetService())->savePic($id, $day, $in['name'] ?? '', $this->actor());
            return $this->state($id);
        });
    }
}
