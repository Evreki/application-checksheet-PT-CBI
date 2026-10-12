<?php

namespace App\Models;

use CodeIgniter\Model;

class FindingModel extends Model
{
    protected $table         = 'cs_findings';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useTimestamps = true;
    protected $allowedFields = ['sheet_id','line_no','found_date','problem','root_cause','counter_measure','due_date','pic','entry_id'];
}
