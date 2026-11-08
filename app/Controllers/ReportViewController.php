<?php

namespace App\Controllers;

use App\Models\ActionItemModel;
use App\Models\EquipmentInstanceModel;
use App\Models\ReportModel;
use App\Models\ReportPartModel;
use CodeIgniter\Exceptions\PageNotFoundException;

class ReportViewController extends BaseController
{
    public function print(int $id): string
    {
        $reportModel   = new ReportModel();
        $partModel     = new ReportPartModel();
        $instanceModel = new EquipmentInstanceModel();
        $actionModel   = new ActionItemModel();

        $report = $reportModel->find($id);
        if (! $report) {
            throw PageNotFoundException::forPageNotFound('Laporan tidak ditemukan.');
        }

        $parts    = $partModel->where('report_id', $id)->findAll();
        $instance = $instanceModel->where('instance_code', $report['instance_code'])->first();
        $action   = ! empty($report['action_item_id']) ? $actionModel->find($report['action_item_id']) : null;

        $db = \Config\Database::connect();
        $assignment = $db->table('cs_assignments a')
            ->select('a.*, l.full_name as leader_name')
            ->join('cs_users l', 'l.id = a.assigned_by_user_id', 'left')
            ->where('a.instance_code', $report['instance_code'])
            ->where('a.schedule_date <=', $report['report_date'])
            ->orderBy('a.id', 'DESC')
            ->get()
            ->getRowArray();

        return view('reports/print', [
            'report'     => $report,
            'parts'      => $parts,
            'instance'   => $instance,
            'action'     => $action,
            'assignment' => $assignment,
        ]);
    }
}
