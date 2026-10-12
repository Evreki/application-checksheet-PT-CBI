<?php

namespace App\Models;

use CodeIgniter\Model;

class DayPicModel extends Model
{
    protected $table         = 'cs_day_pics';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useTimestamps = true;
    protected $allowedFields = ['sheet_id','day_no','pic_name'];
}
