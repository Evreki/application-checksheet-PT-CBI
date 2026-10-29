<?php

namespace App\Models;

use CodeIgniter\Model;

class ReportModel extends Model
{
    protected $table         = 'cs_reports';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useTimestamps = true;
    protected $allowedFields = [
        'action_item_id', 'instance_code', 'report_date', 'shift',
        'pic_name', 'action_taken', 'conclusion', 'status',
        'leader_approval_by', 'leader_approval_at',
    ];
}
