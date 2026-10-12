<?php

namespace App\Services;

use App\Exceptions\ChecksheetException;
use App\Models\FindingModel;
use App\Models\SheetModel;

class FindingService
{
    private FindingModel $findings;
    private SheetModel $sheets;
    private SheetService $sheetSvc;

    public function __construct()
    {
        $this->findings = new FindingModel();
        $this->sheets   = new SheetModel();
        $this->sheetSvc = new SheetService();
    }

    /** Upsert berdasarkan line_no; baris kosong semua = hapus. */
    public function save(int $sheetId, array $in, string $actor): void
    {
        $this->sheetSvc->sheet($sheetId);
        $line = (int) ($in['line_no'] ?? 0);
        if ($line < 1 || $line > 500) {
            throw ChecksheetException::invalid('Nomor baris tidak valid.');
        }
        $cut  = static fn ($v, int $n) => ($v = trim((string) $v)) === '' ? null : mb_substr($v, 0, $n);
        $data = [
            'found_date'      => $this->sheetSvc->date($in['found_date'] ?? ''),
            'problem'         => $cut($in['problem'] ?? '', 500),
            'root_cause'      => $cut($in['root_cause'] ?? '', 500),
            'counter_measure' => $cut($in['counter_measure'] ?? '', 500),
            'due_date'        => $this->sheetSvc->date($in['due_date'] ?? ''),
            'pic'             => $cut($in['pic'] ?? '', 100),
        ];
        $row = $this->findings->where(['sheet_id' => $sheetId, 'line_no' => $line])->first();

        if (! array_filter($data, static fn ($v) => $v !== null)) {
            $row && $this->findings->delete($row['id']);
        } elseif ($row) {
            $this->findings->update($row['id'], $data);
        } else {
            $this->findings->insert($data + ['sheet_id' => $sheetId, 'line_no' => $line]);
        }
        $this->sheets->bump($sheetId, $actor);
    }

    public function delete(int $sheetId, int $line, string $actor): void
    {
        $this->sheetSvc->sheet($sheetId);
        $row = $this->findings->where(['sheet_id' => $sheetId, 'line_no' => $line])->first();
        $row && $this->findings->delete($row['id']);
        $this->sheets->bump($sheetId, $actor);
    }
}
