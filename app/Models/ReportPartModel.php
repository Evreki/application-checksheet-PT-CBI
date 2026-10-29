<?php

namespace App\Models;

use CodeIgniter\Model;

class ReportPartModel extends Model
{
    protected $table         = 'cs_report_parts';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useTimestamps = true;
    protected $allowedFields = [
        'report_id', 'part_name', 'part_number', 'qty', 'unit',
    ];
}
