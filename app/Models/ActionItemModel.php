<?php

namespace App\Models;

use CodeIgniter\Model;

class ActionItemModel extends Model
{
    protected $table         = 'cs_action_items';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useTimestamps = true;
    protected $allowedFields = [
        'sheet_id', 'instance_code', 'item_name', 'action_type',
        'ng_description', 'scheduled_date', 'assigned_user_id',
        'decision_by', 'status',
    ];
}

