<?php

namespace App\Models;

use CodeIgniter\Model;

class EntryModel extends Model
{
    protected $table         = 'cs_entries';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useTimestamps = true;
    protected $allowedFields = ['sheet_id','item_id','day_no','symbol','value_num','note','updated_by'];
}
