<?php

namespace App\Controllers\Api;

use App\Models\EquipmentInstanceModel;
use CodeIgniter\HTTP\ResponseInterface;

class EquipmentInstanceController extends BaseApiController
{
    protected EquipmentInstanceModel $instances;

    public function __construct()
    {
        $this->instances = new EquipmentInstanceModel();
    }

    public function index(): ResponseInterface
    {
        return $this->run(function () {
            $building = $this->request->getGet('building');
            $group    = $this->request->getGet('group');

            $q = $this->instances->where('is_active', 1)->orderBy('sort_order', 'ASC');
            if ($building && $building !== 'all') {
                $q->where('building', $building);
            }
            if ($group && $group !== 'all') {
                $q->where('equipment_group', $group);
            }

            return $q->findAll();
        });
    }
}
