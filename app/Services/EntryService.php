<?php

namespace App\Services;

use App\Enums\CheckSymbol;
use App\Exceptions\ChecksheetException;
use App\Models\EntryModel;
use App\Models\SheetModel;
use App\Models\TemplateItemModel;

class EntryService
{
    private EntryModel $entries;
    private SheetModel $sheets;
    private SheetService $sheetSvc;
    private LockService $locks;

    public function __construct()
    {
        $this->entries  = new EntryModel();
        $this->sheets   = new SheetModel();
        $this->sheetSvc = new SheetService();
        $this->locks    = new LockService();
    }

    /** Simpan / ubah / hapus satu sel. Semua kosong = hapus. */
    public function save(int $sheetId, int $itemId, int $day, ?string $symbol, mixed $value, ?string $note, string $actor): void
    {
        $sheet = $this->sheetSvc->sheet($sheetId);
        $item  = $this->sheetSvc->itemOf($sheet, $itemId);
        $this->sheetSvc->assertDay($sheet, $day);
        $this->locks->assertDayEditable($sheetId, $day);

        if ($item['calc_type']) {
            throw ChecksheetException::invalid('Item ini dihitung otomatis dan tidak bisa diisi manual.');
        }

        $symbol = ($symbol === null || $symbol === '') ? null : $symbol;
        if ($symbol !== null && CheckSymbol::tryFrom($symbol) === null) {
            throw ChecksheetException::invalid('Simbol tidak valid.');
        }

        $num = null;
        if ($value !== null && $value !== '') {
            if (! (int) $item['accepts_value']) {
                throw ChecksheetException::invalid('Item ini tidak menerima nilai ukur.');
            }
            $num = is_numeric($value) ? (float) $value : throw ChecksheetException::invalid('Nilai ukur harus berupa angka.');
        }
        $note = ($n = trim((string) $note)) === '' ? null : mb_substr($n, 0, 500);

        $key = ['sheet_id' => $sheetId, 'item_id' => $itemId, 'day_no' => $day];
        $row = $this->entries->where($key)->first();

        if ($symbol === null && $num === null && $note === null) {
            $row && $this->entries->delete($row['id']);
        } else {
            $data = ['symbol' => $symbol, 'value_num' => $num, 'note' => $note, 'updated_by' => $actor];
            $row ? $this->entries->update($row['id'], $data) : $this->entries->insert($key + $data);
        }
        $this->sheets->bump($sheetId, $actor);
    }

    /** Isi semua sel kosong pada satu hari dengan satu simbol (mis. semua V). */
    public function fillDay(int $sheetId, int $day, string $symbol, string $actor): int
    {
        $sheet = $this->sheetSvc->sheet($sheetId);
        $this->sheetSvc->assertDay($sheet, $day);
        $this->locks->assertDayEditable($sheetId, $day);
        if (CheckSymbol::tryFrom($symbol) === null) {
            throw ChecksheetException::invalid('Simbol tidak valid.');
        }

        $items = (new TemplateItemModel())->where('template_id', $sheet['template_id'])->findAll();
        $db    = db_connect();
        $db->transStart();
        $added = 0;
        foreach ($items as $it) {
            if ($it['calc_type']) {
                continue;
            }
            $key = ['sheet_id' => $sheetId, 'item_id' => $it['id'], 'day_no' => $day];
            if ($this->entries->where($key)->first()) {
                continue;
            }
            $this->entries->insert($key + ['symbol' => $symbol, 'updated_by' => $actor]);
            $added++;
        }
        $db->transComplete();
        if (! $db->transStatus()) {
            throw new \RuntimeException('Gagal menyimpan isian massal.');
        }
        $added && $this->sheets->bump($sheetId, $actor);
        return $added;
    }
}
