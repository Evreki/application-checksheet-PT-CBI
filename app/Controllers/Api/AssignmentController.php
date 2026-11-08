<?php

namespace App\Controllers\Api;

use App\Exceptions\ChecksheetException;
use App\Models\AssignmentModel;
use App\Models\UserModel;
use CodeIgniter\HTTP\ResponseInterface;

class AssignmentController extends BaseApiController
{
    protected AssignmentModel $assignments;
    protected UserModel $users;

    public function __construct()
    {
        $this->assignments = new AssignmentModel();
        $this->users       = new UserModel();
    }

    public function index(): ResponseInterface
    {
        return $this->run(function () {
            try {
                $date   = $this->request->getGet('date') ?? date('Y-m-d');
                $userId = $this->request->getGet('user_id');

                $db = \Config\Database::connect();
                $b  = $db->table('cs_assignments a')
                    ->select('a.*, u.full_name as assigned_to_name, l.full_name as assigned_by_name, eq.instance_name, eq.building, eq.room_location')
                    ->join('cs_users u', 'u.id = a.assigned_to_user_id', 'left')
                    ->join('cs_users l', 'l.id = a.assigned_by_user_id', 'left')
                    ->join('cs_equipment_instances eq', 'eq.instance_code = a.instance_code', 'left')
                    ->orderBy('a.id', 'DESC');

                if ($date && $date !== 'all') {
                    $b->where('a.schedule_date', $date);
                }
                if ($userId) {
                    $b->where('a.assigned_to_user_id', (int) $userId);
                }

                return $b->get()->getResultArray();
            } catch (\Throwable $e) {
                log_message('warning', 'DB assignments error: ' . $e->getMessage());
                return [];
            }
        });
    }

    public function create(): ResponseInterface
    {
        return $this->run(function () {
            $in = $this->payload([
                'instance_code'       => 'required',
                'assigned_to_user_id' => 'required|is_natural_no_zero',
                'schedule_date'       => 'required|valid_date',
                'inspection_type'     => 'required|in_list[DAILY,MONTHLY]',
                'room_location'       => 'permit_empty',
            ]);

            $sessionUser  = session()->get('user');
            $leaderId     = $sessionUser['id'] ?? null;
            $targetUserId = (int) $in['assigned_to_user_id'];

            if ($leaderId && $targetUserId === (int) $leaderId) {
                throw ChecksheetException::invalid('Leader tidak dapat menugaskan pekerjaan kepada dirinya sendiri.');
            }

            $targetUser = $this->users->find($targetUserId);
            if (! $targetUser || ! $targetUser['is_active']) {
                throw ChecksheetException::notFound('Teknisi tidak ditemukan atau statusnya non-aktif.');
            }

            if ($targetUser['role'] === 'leader') {
                throw ChecksheetException::invalid('Penugasan inspeksi hanya dapat diberikan kepada Teknisi (User), bukan sesama Leader.');
            }

            $instanceCode = trim($in['instance_code']);
            $roomLocation = trim((string) ($in['room_location'] ?? ''));

            // Bila Leader mengisi nama ruangan/area, perbarui langsung pada master unit alat
            if ($roomLocation !== '') {
                $db = \Config\Database::connect();
                $db->table('cs_equipment_instances')
                    ->where('instance_code', $instanceCode)
                    ->update(['room_location' => $roomLocation, 'updated_at' => date('Y-m-d H:i:s')]);
            }

            $data = [
                'instance_code'       => $instanceCode,
                'assigned_to_user_id' => $targetUserId,
                'assigned_by_user_id' => (int) ($leaderId ?? 1),
                'schedule_date'       => $in['schedule_date'],
                'inspection_type'     => $in['inspection_type'],
                'status'              => 'PENDING',
                'notes'               => $in['notes'] ?? '',
                'created_at'          => date('Y-m-d H:i:s'),
                'updated_at'          => date('Y-m-d H:i:s'),
            ];

            $id = $this->assignments->insert($data, true);
            return [
                'id'            => $id,
                'room_location' => $roomLocation,
                'message'       => 'Penugasan berhasil disimpan.',
            ];
        });
    }

    public function updateStatus(int $id): ResponseInterface
    {
        return $this->run(function () use ($id) {
            $in = $this->payload([
                'status' => 'required|in_list[PENDING,IN_PROGRESS,COMPLETED]',
            ]);

            $this->assignments->update($id, [
                'status'     => $in['status'],
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

            return ['message' => 'Status penugasan diperbarui.'];
        });
    }
}
