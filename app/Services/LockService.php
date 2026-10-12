<?php

namespace App\Services;

use App\Exceptions\ChecksheetException;
use App\Models\ApprovalModel;

/** Satu-satunya tempat yang menentukan apakah sebuah hari / lembar boleh diubah. */
class LockService
{
    public function __construct(private ?ApprovalModel $approvals = null)
    {
        $this->approvals ??= new ApprovalModel();
    }

    public function isFinalized(int $sheetId): bool
    {
        return (($this->approvals->findOne($sheetId, 'DOC', 0, 'KADEPT')['status'] ?? null) === 'APPROVED');
    }

    public function isDayLocked(int $sheetId, int $day): bool
    {
        return (($this->approvals->findOne($sheetId, 'DAY', $day, 'KASUBSIE')['status'] ?? null) === 'APPROVED');
    }

    public function assertSheetEditable(int $sheetId): void
    {
        if ($this->isFinalized($sheetId)) {
            throw ChecksheetException::locked('Lembar sudah disetujui Ka.Dept dan dikunci.');
        }
    }

    public function assertDayEditable(int $sheetId, int $day): void
    {
        $this->assertSheetEditable($sheetId);
        if ($this->isDayLocked($sheetId, $day)) {
            throw ChecksheetException::locked("Hari ke-{$day} sudah di-approve dan dikunci. Reject terlebih dahulu untuk mengubah.");
        }
    }
}
