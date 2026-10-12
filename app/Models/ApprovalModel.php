<?php

namespace App\Models;

use CodeIgniter\Model;

class ApprovalModel extends Model
{
    protected $table         = 'cs_approvals';
    protected $primaryKey    = 'id';
    protected $returnType    = 'array';
    protected $useTimestamps = true;
    protected $allowedFields = ['sheet_id', 'scope', 'ref_no', 'role', 'status', 'actor_name', 'note', 'acted_at'];

    public function forSheet(int $sheetId): array
    {
        return $this->where('sheet_id', $sheetId)->findAll();
    }

    public function findOne(int $sheetId, string $scope, int $ref, string $role): ?array
    {
        return $this->where(['sheet_id' => $sheetId, 'scope' => $scope, 'ref_no' => $ref, 'role' => $role])->first();
    }
}
