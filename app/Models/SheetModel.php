<?php

namespace App\Models;

use CodeIgniter\Model;

class SheetModel extends Model
{
    protected $table         = 'cs_sheets';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useTimestamps = true;
    protected $allowedFields = ['template_id', 'period_year', 'period_month', 'equipment_no', 'form_date', 'rev_no', 'updated_by'];

    /** Naikkan nomor revisi — klien lain mendeteksi perubahan lewat angka ini. */
    public function bump(int $id, string $actor): void
    {
        $this->db->table($this->table)
            ->set('rev_no', 'rev_no + 1', false)
            ->set('updated_by', $actor)
            ->set('updated_at', date('Y-m-d H:i:s'))
            ->where('id', $id)
            ->update();
    }
}
