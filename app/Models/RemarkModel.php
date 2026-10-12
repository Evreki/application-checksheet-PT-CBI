<?php

namespace App\Models;

use CodeIgniter\Model;

class RemarkModel extends Model
{
    protected $table         = 'cs_remarks';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useTimestamps = true;
    protected $allowedFields = ['sheet_id','item_id','remark'];
}
