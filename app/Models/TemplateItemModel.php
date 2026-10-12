<?php

namespace App\Models;

use CodeIgniter\Model;

class TemplateItemModel extends Model
{
    protected $table         = 'cs_template_items';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useTimestamps = false;
    protected $allowedFields = ['template_id','item_no','equipment_part','inspection_method','standard','period','instruction_codes','inspection_mark','accepts_value','value_unit','limit_min','limit_max','calc_type','calc_refs','sort_order'];
}
