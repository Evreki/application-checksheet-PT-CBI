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

        return view('reports/print', [
            'report'   => $report,
            'parts'    => $parts,
            'instance' => $instance,
            'action'   => $action,
        ]);
    }
}
