<?php

namespace App\Models;

use CodeIgniter\Model;

class AssignmentModel extends Model
{
    protected $table         = 'cs_assignments';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useTimestamps = true;
    protected $allowedFields = [
        'instance_code', 'assigned_to_user_id', 'assigned_by_user_id',
        'schedule_date', 'inspection_type', 'status', 'notes',
    ];
}

