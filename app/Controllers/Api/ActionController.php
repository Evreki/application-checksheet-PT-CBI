<?php

namespace App\Controllers\Api;

use App\Exceptions\ChecksheetException;
use App\Models\ActionItemModel;
use CodeIgniter\HTTP\ResponseInterface;

class ActionController extends BaseApiController
{
    protected ActionItemModel $actions;

    public function __construct()
    {
        $this->actions = new ActionItemModel();
    }

    public function index(): ResponseInterface
    {
        return $this->run(function () {
            $type   = $this->request->getGet('type'); // 'TODAY' or 'BACKLOG'
            $status = $this->request->getGet('status'); // 'OPEN', 'IN_PROGRESS', 'RESOLVED'

            $db = \Config\Database::connect();
            $b  = $db->table('cs_action_items a')
                ->select('a.*, u.full_name as assigned_user_name, eq.instance_name, eq.building, eq.room_location')
                ->join('cs_users u', 'u.id = a.assigned_user_id', 'left')
                ->join('cs_equipment_instances eq', 'eq.instance_code = a.instance_code', 'left')
                ->orderBy('a.id', 'DESC');

            if ($type && in_array(strtoupper($type), ['TODAY', 'BACKLOG'], true)) {
                $b->where('a.action_type', strtoupper($type));
            }
            if ($status) {
                $b->where('a.status', strtoupper($status));
            }

            return $b->get()->getResultArray();
        });
    }

    public function create(): ResponseInterface
    {
        return $this->run(function () {
            $in = $this->payload([
                'instance_code'  => 'required',
                'item_name'      => 'required',
                'ng_description' => 'required',
            ]);

            $sessionUser = session()->get('user');
            $actor       = $sessionUser['full_name'] ?? $this->actor();

            $data = [
                'sheet_id'         => ! empty($in['sheet_id']) ? (int) $in['sheet_id'] : null,
                'instance_code'    => trim($in['instance_code']),
                'item_name'        => trim($in['item_name']),
                'action_type'      => ! empty($in['action_type']) ? strtoupper($in['action_type']) : 'TODAY',
                'ng_description'   => trim($in['ng_description']),
                'scheduled_date'   => ! empty($in['scheduled_date']) ? $in['scheduled_date'] : date('Y-m-d'),
                'assigned_user_id' => ! empty($in['assigned_user_id']) ? (int) $in['assigned_user_id'] : null,
                'decision_by'      => $actor,
                'status'           => 'OPEN',
                'created_at'       => date('Y-m-d H:i:s'),
                'updated_at'       => date('Y-m-d H:i:s'),
            ];

            $id = $this->actions->insert($data, true);
            return ['id' => $id, 'message' => 'Temuan NG berhasil didaftarkan ke daftar Action.'];
        });
    }

    public function decision(int $id): ResponseInterface
    {
        return $this->run(function () use ($id) {
            $in = $this->payload([
                'action_type' => 'required|in_list[TODAY,BACKLOG]',
            ]);

            $sessionUser = session()->get('user');
            $actor       = $sessionUser['full_name'] ?? $this->actor();

            $update = [
                'action_type'    => strtoupper($in['action_type']),
                'decision_by'    => $actor,
                'scheduled_date' => $in['scheduled_date'] ?? date('Y-m-d'),
                'updated_at'     => date('Y-m-d H:i:s'),
            ];

            if (isset($in['assigned_user_id'])) {
                $update['assigned_user_id'] = (int) $in['assigned_user_id'];
            }

            $this->actions->update($id, $update);
            return ['message' => 'Keputusan Leader berhasil disimpan.'];
        });
    }

    public function updateStatus(int $id): ResponseInterface
    {
        return $this->run(function () use ($id) {
            $in = $this->payload([
                'status' => 'required|in_list[OPEN,IN_PROGRESS,RESOLVED]',
            ]);

            $this->actions->update($id, [
                'status'     => strtoupper($in['status']),
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

            return ['message' => 'Status action item berhasil diperbarui.'];
        });
    }
}

