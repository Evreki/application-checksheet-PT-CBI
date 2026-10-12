<?php

namespace App\Services;

use App\Enums\ApprovalRole;
use App\Enums\ApprovalScope;
use App\Enums\ApprovalStatus;
use App\Exceptions\ChecksheetException;
use App\Models\ApprovalModel;
use App\Models\EntryModel;
use App\Models\SheetModel;
use App\Models\TemplateItemModel;
use Config\Checksheet as Cfg;

/**
 * Aturan approval:
 *  DAY  : KaSubSie meng-approve/reject satu hari. Approved = hari terkunci.
 *  WEEK : Kasie meng-approve satu blok minggu (semua hari berisi harus sudah DAY-approved).
 *         Reject minggu → semua hari approved di blok itu otomatis ikut Rejected.
 *  DOC  : berurutan Ka.Sub Sie → Ka.Sie → Ka.Dept. Ka.Dept approve = lembar final (terkunci).
 *         Reject di satu level membatalkan level sesudahnya.
 */
class ApprovalService
{
    private ApprovalModel $approvals;
    private EntryModel $entries;
    private SheetModel $sheets;
    private SheetService $sheetSvc;
    private Cfg $cfg;

    public function __construct()
    {
        $this->approvals = new ApprovalModel();
        $this->entries   = new EntryModel();
        $this->sheets    = new SheetModel();
        $this->sheetSvc  = new SheetService();
        $this->cfg       = config('Checksheet');
    }

    public function act(int $sheetId, string $scope, int $ref, string $role, string $status, ?string $note, string $actor): void
    {
        $sheet  = $this->sheetSvc->sheet($sheetId);
        $scopeE = ApprovalScope::tryFrom($scope) ?? throw ChecksheetException::invalid('Scope approval tidak valid.');
        $roleE  = ApprovalRole::tryFrom($role) ?? throw ChecksheetException::invalid('Role tidak valid.');
        $statE  = ApprovalStatus::tryFrom($status) ?? throw ChecksheetException::invalid('Status harus APPROVED atau REJECTED.');
        $note   = ($n = trim((string) $note)) === '' ? null : mb_substr($n, 0, 500);

        if ($statE === ApprovalStatus::REJECTED && $note === null) {
            throw ChecksheetException::invalid('Catatan wajib diisi saat Reject.');
        }

        $db = db_connect();
        $db->transStart();
        match ($scopeE) {
            ApprovalScope::DAY  => $this->day($sheet, $ref, $roleE, $statE, $note, $actor),
            ApprovalScope::WEEK => $this->week($sheet, $ref, $roleE, $statE, $note, $actor),
            ApprovalScope::DOC  => $this->doc($sheet, $roleE, $statE, $note, $actor),
        };
        $db->transComplete();
        if (! $db->transStatus()) {
            throw new \RuntimeException('Gagal menyimpan approval.');
        }
        $this->sheets->bump($sheetId, $actor);
    }

    /** Batalkan keputusan (kembali ke "menunggu"). */
    public function revoke(int $sheetId, string $scope, int $ref, string $role, string $actor): void
    {
        $sheet = $this->sheetSvc->sheet($sheetId);
        $sid   = (int) $sheet['id'];
        $db    = db_connect();
        $db->transStart();

        if ($scope === 'DAY') {
            $this->assertNoDoc($sid);
            $this->dropWeekOf($sid, $ref);
        } elseif ($scope === 'WEEK') {
            $this->assertNoDoc($sid);
        } elseif ($scope === 'DOC') {
            $this->dropDocFrom($sid, $role); // batalkan level ini + level sesudahnya
        } else {
            throw ChecksheetException::invalid('Scope approval tidak valid.');
        }
        if ($scope !== 'DOC') {
            $this->approvals->where(['sheet_id' => $sid, 'scope' => $scope, 'ref_no' => $ref, 'role' => $role])->delete();
        }
        $db->transComplete();
        $this->sheets->bump($sid, $actor);
    }

    // ------------------------------------------------------------------ scopes

    private function day(array $sheet, int $day, ApprovalRole $role, ApprovalStatus $st, ?string $note, string $actor): void
    {
        $sid = (int) $sheet['id'];
        $this->sheetSvc->assertDay($sheet, $day);
        if ($role !== ApprovalRole::KASUBSIE) {
            throw ChecksheetException::invalid('Approval harian dilakukan oleh KaSubSie.');
        }
        $this->assertNoDoc($sid);

        if ($st === ApprovalStatus::APPROVED) {
            $count = $this->entries->where(['sheet_id' => $sid, 'day_no' => $day])->countAllResults();
            if ($count < $this->cfg->minEntriesForDayApproval) {
                throw ChecksheetException::conflict("Hari ke-{$day} belum diisi, tidak bisa di-approve.");
            }
            if ($this->cfg->requireCompleteDay && $count < $this->inputItemCount($sheet)) {
                throw ChecksheetException::conflict("Semua item hari ke-{$day} harus terisi sebelum di-approve.");
            }
        } else {
            $this->dropWeekOf($sid, $day); // hari dibuka lagi → persetujuan minggunya gugur
        }
        $this->put($sid, ApprovalScope::DAY, $day, $role, $st, $note, $actor);
    }

    private function week(array $sheet, int $block, ApprovalRole $role, ApprovalStatus $st, ?string $note, string $actor): void
    {
        $sid = (int) $sheet['id'];
        if ($role !== ApprovalRole::KASIE) {
            throw ChecksheetException::invalid('Approval mingguan dilakukan oleh Kasie.');
        }
        $this->assertNoDoc($sid);
        [$from, $to] = $this->cfg->weekBlocks[$block - 1] ?? throw ChecksheetException::invalid('Blok minggu tidak valid.');
        $to = min($to, SheetService::daysInMonth((int) $sheet['period_year'], (int) $sheet['period_month']));

        $days = $this->daysWithEntries($sid, $from, $to);
        $apr  = $this->approvedDays($sid);

        if ($st === ApprovalStatus::APPROVED) {
            if (! $days) {
                throw ChecksheetException::conflict('Belum ada isian pada minggu ini.');
            }
            $pending = array_values(array_diff($days, $apr));
            if ($pending) {
                throw ChecksheetException::conflict('Hari berikut belum di-approve KaSubSie: ' . implode(', ', $pending) . '.');
            }
        } else {
            foreach (array_intersect($days, $apr) as $d) { // cascade: buka kembali hari-hari tsb
                $this->put($sid, ApprovalScope::DAY, $d, ApprovalRole::KASUBSIE, ApprovalStatus::REJECTED, $note, $actor);
            }
        }
        $this->put($sid, ApprovalScope::WEEK, $block, $role, $st, $note, $actor);
    }

    private function doc(array $sheet, ApprovalRole $role, ApprovalStatus $st, ?string $note, string $actor): void
    {
        $sid   = (int) $sheet['id'];
        $order = $this->cfg->docApprovalOrder;
        $idx   = array_search($role->value, $order, true);
        if ($idx === false) {
            throw ChecksheetException::invalid('Role tidak termasuk alur tanda tangan dokumen.');
        }

        if ($st === ApprovalStatus::APPROVED) {
            if ($idx > 0) {
                $prev = $this->approvals->findOne($sid, 'DOC', 0, $order[$idx - 1]);
                if (($prev['status'] ?? null) !== 'APPROVED') {
                    throw ChecksheetException::conflict('Tanda tangan sebelumnya (' . $order[$idx - 1] . ') belum disetujui.');
                }
            }
            $days    = $this->daysWithEntries($sid, 1, 31);
            $pending = array_values(array_diff($days, $this->approvedDays($sid)));
            if (! $days || $pending) {
                throw ChecksheetException::conflict($days ? 'Masih ada hari yang belum di-approve: ' . implode(', ', $pending) . '.' : 'Lembar belum berisi data.');
            }
        } else {
            $this->dropDocFrom($sid, $role->value, false); // gugurkan level sesudahnya
        }
        $this->put($sid, ApprovalScope::DOC, 0, $role, $st, $note, $actor);
    }

    // ----------------------------------------------------------------- helpers

    private function put(int $sid, ApprovalScope $s, int $ref, ApprovalRole $r, ApprovalStatus $st, ?string $note, string $actor): void
    {
        $data = ['status' => $st->value, 'actor_name' => $actor, 'note' => $note, 'acted_at' => date('Y-m-d H:i:s')];
        $row  = $this->approvals->findOne($sid, $s->value, $ref, $r->value);
        $row
            ? $this->approvals->update($row['id'], $data)
            : $this->approvals->insert($data + ['sheet_id' => $sid, 'scope' => $s->value, 'ref_no' => $ref, 'role' => $r->value]);
    }

    private function assertNoDoc(int $sid): void
    {
        if ($this->approvals->where(['sheet_id' => $sid, 'scope' => 'DOC'])->countAllResults() > 0) {
            throw ChecksheetException::conflict('Tanda tangan dokumen sudah ada. Batalkan/Reject tanda tangan dokumen terlebih dahulu.');
        }
    }

    private function dropDocFrom(int $sid, string $role, bool $includeSelf = true): void
    {
        $order = $this->cfg->docApprovalOrder;
        $idx   = array_search($role, $order, true);
        if ($idx === false) {
            throw ChecksheetException::invalid('Role tidak valid.');
        }
        $drop = array_slice($order, $includeSelf ? $idx : $idx + 1);
        if ($drop) {
            $this->approvals->where(['sheet_id' => $sid, 'scope' => 'DOC'])->whereIn('role', $drop)->delete();
        }
    }

    private function dropWeekOf(int $sid, int $day): void
    {
        foreach ($this->cfg->weekBlocks as $i => [$from, $to]) {
            if ($day >= $from && $day <= $to) {
                $this->approvals->where(['sheet_id' => $sid, 'scope' => 'WEEK', 'ref_no' => $i + 1])->delete();
            }
        }
    }

    private function daysWithEntries(int $sid, int $from, int $to): array
    {
        $rows = $this->entries->select('day_no')->distinct()->where('sheet_id', $sid)->where('day_no >=', $from)->where('day_no <=', $to)->findAll();
        return array_map('intval', array_column($rows, 'day_no'));
    }

    private function approvedDays(int $sid): array
    {
        $rows = $this->approvals->where(['sheet_id' => $sid, 'scope' => 'DAY', 'status' => 'APPROVED'])->findAll();
        return array_map('intval', array_column($rows, 'ref_no'));
    }

    private function inputItemCount(array $sheet): int
    {
        return (new TemplateItemModel())->where('template_id', $sheet['template_id'])->where('calc_type IS NULL', null, false)->countAllResults();
    }
}
