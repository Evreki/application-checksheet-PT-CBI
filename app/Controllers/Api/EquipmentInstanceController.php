<?php

namespace App\Controllers\Api;

use App\Exceptions\ChecksheetException;
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
            try {
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
            } catch (\Throwable $e) {
                log_message('warning', 'DB instances error: ' . $e->getMessage());
                return [];
            }
        });
    }

    public function updateLocation(): ResponseInterface
    {
        return $this->run(function () {
            $in = $this->payload([
                'instance_code' => 'required',
                'room_location' => 'permit_empty',
                'building'      => 'permit_empty',
            ]);

            $code = trim($in['instance_code']);
            $instance = $this->instances->where('instance_code', $code)->first();
            if (! $instance) {
                throw ChecksheetException::notFound("Unit alat {$code} tidak ditemukan.");
            }

            $update = [
                'room_location' => trim((string) ($in['room_location'] ?? '')),
                'updated_at'    => date('Y-m-d H:i:s'),
            ];
            if (! empty($in['building'])) {
                $update['building'] = trim($in['building']);
            }

            $this->instances->update($instance['id'], $update);

            return [
                'message'  => "Lokasi area untuk {$code} berhasil disimpan.",
                'instance' => $this->instances->find($instance['id']),
            ];
        });
    }
}
