<?php

namespace App\Controllers\Api;

use App\Exceptions\ChecksheetException;
use App\Models\ActionItemModel;
use App\Models\ReportModel;
use App\Models\ReportPartModel;
use CodeIgniter\HTTP\ResponseInterface;

class ReportController extends BaseApiController
{
    protected ReportModel $reports;
    protected ReportPartModel $parts;

    public function __construct()
    {
        $this->reports = new ReportModel();
        $this->parts   = new ReportPartModel();
    }

    public function index(): ResponseInterface
    {
        return $this->run(function () {
            $instance = $this->request->getGet('instance');
            $date     = $this->request->getGet('date');

            $db = \Config\Database::connect();
            $b  = $db->table('cs_reports r')
                ->select('r.*, eq.instance_name, eq.building, eq.room_location, act.item_name as action_item_name')
                ->join('cs_equipment_instances eq', 'eq.instance_code = r.instance_code', 'left')
                ->join('cs_action_items act', 'act.id = r.action_item_id', 'left')
                ->orderBy('r.id', 'DESC');

            if ($instance) {
                $b->where('r.instance_code', $instance);
            }
            if ($date) {
                $b->where('r.report_date', $date);
            }

            $list = $b->get()->getResultArray();
            foreach ($list as &$item) {
                $item['parts'] = $this->parts->where('report_id', $item['id'])->findAll();
            }

            return $list;
        });
    }

    public function create(): ResponseInterface
    {
        return $this->run(function () {
            $in = $this->payload([
                'instance_code' => 'required',
                'report_date'   => 'required|valid_date',
                'pic_name'      => 'required',
                'action_taken'  => 'required',
            ]);

            $sessionUser = session()->get('user');

            $reportData = [
                'action_item_id'     => ! empty($in['action_item_id']) ? (int) $in['action_item_id'] : null,
                'instance_code'      => trim($in['instance_code']),
                'report_date'        => $in['report_date'],
                'shift'              => $in['shift'] ?? 'Shift 1',
                'pic_name'           => trim($in['pic_name']),
                'action_taken'       => trim($in['action_taken']),
                'conclusion'         => $in['conclusion'] ?? 'Selesai dikerjakan dan kondisi mesin kembali normal.',
                'status'             => 'SUBMITTED',
                'created_at'         => date('Y-m-d H:i:s'),
                'updated_at'         => date('Y-m-d H:i:s'),
            ];

            $reportId = $this->reports->insert($reportData, true);

            // Jika ada sparepart yang diganti
            if (! empty($in['parts']) && is_array($in['parts'])) {
                foreach ($in['parts'] as $p) {
                    if (! empty($p['part_name'])) {
                        $this->parts->insert([
                            'report_id'   => $reportId,
                            'part_name'   => trim($p['part_name']),
                            'part_number' => trim($p['part_number'] ?? ''),
                            'qty'         => ! empty($p['qty']) ? (int) $p['qty'] : 1,
                            'unit'        => ! empty($p['unit']) ? trim($p['unit']) : 'Pcs',
                            'created_at'  => date('Y-m-d H:i:s'),
                            'updated_at'  => date('Y-m-d H:i:s'),
                        ]);
                    }
                }
            }

            // Jika laporan ini terkait action item, update action item menjadi RESOLVED
            if (! empty($in['action_item_id'])) {
                (new ActionItemModel())->update((int) $in['action_item_id'], [
                    'status'     => 'RESOLVED',
                    'updated_at' => date('Y-m-d H:i:s'),
                ]);
            }

            return [
                'id'         => $reportId,
                'print_url'  => site_url("reports/{$reportId}/print"),
                'message'    => 'Laporan maintenance berhasil disimpan.',
            ];
        });
    }

    public function approve(int $id): ResponseInterface
    {
        return $this->run(function () use ($id) {
            $sessionUser = session()->get('user');
            $leaderName  = $sessionUser['full_name'] ?? $this->actor();

            $this->reports->update($id, [
                'status'             => 'APPROVED',
                'leader_approval_by' => $leaderName,
                'leader_approval_at' => date('Y-m-d H:i:s'),
                'updated_at'         => date('Y-m-d H:i:s'),
            ]);

            return ['message' => 'Laporan telah disetujui oleh Leader.'];
        });
    }
}
