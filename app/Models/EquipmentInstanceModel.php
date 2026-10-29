<?php

namespace App\Models;

use CodeIgniter\Model;

class EquipmentInstanceModel extends Model
{
    protected $table         = 'cs_equipment_instances';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useTimestamps = true;
    protected $allowedFields = [
        'equipment_group', 'template_code', 'instance_code', 'instance_name',
        'building', 'room_location', 'photo_url', 'is_active', 'sort_order',
    ];
}
