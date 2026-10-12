<?php

namespace App\Services;

use App\Exceptions\ChecksheetException;
use App\Models\DayPicModel;
use App\Models\RemarkModel;
use App\Models\SheetModel;
use App\Models\TemplateItemModel;
use App\Models\TemplateModel;

class SheetService
{
    private SheetModel $sheets;
    private TemplateModel $templates;
    private TemplateItemModel $items;
    private LockService $locks;

    public function __construct()
    {
        $this->sheets    = new SheetModel();
        $this->templates = new TemplateModel();
        $this->items     = new TemplateItemModel();
        $this->locks     = new LockService();
    }

    public static function daysInMonth(int $year, int $month): int
    {
        return (int) date('t', mktime(0, 0, 0, $month, 1, $year));
    }

    public function sheet(int $id): array
    {
        return $this->sheets->find($id) ?? throw ChecksheetException::notFound('Lembar tidak ditemukan.');
    }

    /** Ambil lembar bulan tsb; buat bila belum ada (idempotent). */
    public function open(string $templateCode, int $year, int $month): int
    {
        if ($year < 2000 || $year > 2100 || $month < 1 || $month > 12) {
            throw ChecksheetException::invalid('Tahun/bulan tidak valid.');
        }
        $tpl = $this->templates->where(['code' => $templateCode, 'is_active' => 1])->first()
            ?? throw ChecksheetException::notFound('Template form tidak ditemukan.');

        $where = ['template_id' => $tpl['id'], 'period_year' => $year, 'period_month' => $month];
        $row   = $this->sheets->where($where)->first();
        if ($row) {
            return (int) $row['id'];
        }
        try {
            return (int) $this->sheets->insert($where + ['rev_no' => 1], true);
        } catch (\Throwable $e) { // balapan: pengguna lain membuat bersamaan (unique index)
            $row = $this->sheets->where($where)->first();
            if ($row) {
                return (int) $row['id'];
            }
            throw $e;
        }
    }

    public function updateHeader(int $sheetId, array $in, string $actor): void
    {
        $this->sheet($sheetId);
        $this->locks->assertSheetEditable($sheetId);
        $data = [];
        if (array_key_exists('equipment_no', $in)) {
            $data['equipment_no'] = ($v = trim((string) $in['equipment_no'])) === '' ? null : mb_substr($v, 0, 100);
        }
        if (array_key_exists('form_date', $in)) {
            $data['form_date'] = $this->date($in['form_date']);
        }
        if ($data) {
            $this->sheets->update($sheetId, $data);
            $this->sheets->bump($sheetId, $actor);
        }
    }

    public function saveRemark(int $sheetId, int $itemId, ?string $text, string $actor): void
    {
        $sheet = $this->sheet($sheetId);
        $this->locks->assertSheetEditable($sheetId);
        $this->itemOf($sheet, $itemId);

        $remarks = new RemarkModel();
        $row     = $remarks->where(['sheet_id' => $sheetId, 'item_id' => $itemId])->first();
        $text    = trim((string) $text);

        if ($text === '') {
            $row && $remarks->delete($row['id']);
        } elseif ($row) {
            $remarks->update($row['id'], ['remark' => mb_substr($text, 0, 500)]);
        } else {
            $remarks->insert(['sheet_id' => $sheetId, 'item_id' => $itemId, 'remark' => mb_substr($text, 0, 500)]);
        }
        $this->sheets->bump($sheetId, $actor);
    }

    public function savePic(int $sheetId, int $day, ?string $name, string $actor): void
    {
        $sheet = $this->sheet($sheetId);
        $this->assertDay($sheet, $day);
        $this->locks->assertDayEditable($sheetId, $day);

        $pics = new DayPicModel();
        $row  = $pics->where(['sheet_id' => $sheetId, 'day_no' => $day])->first();
        $name = trim((string) $name);

        if ($name === '') {
            $row && $pics->delete($row['id']);
        } elseif ($row) {
            $pics->update($row['id'], ['pic_name' => mb_substr($name, 0, 100)]);
        } else {
            $pics->insert(['sheet_id' => $sheetId, 'day_no' => $day, 'pic_name' => mb_substr($name, 0, 100)]);
        }
        $this->sheets->bump($sheetId, $actor);
    }

    /** @return array item (pastikan item milik template lembar ini) */
    public function itemOf(array $sheet, int $itemId): array
    {
        return $this->items->where(['id' => $itemId, 'template_id' => $sheet['template_id']])->first()
            ?? throw ChecksheetException::notFound('Item inspeksi tidak ditemukan pada form ini.');
    }

    public function assertDay(array $sheet, int $day): void
    {
        if ($day < 1 || $day > self::daysInMonth((int) $sheet['period_year'], (int) $sheet['period_month'])) {
            throw ChecksheetException::invalid("Hari ke-{$day} tidak ada pada bulan ini.");
        }
    }

    public function date(mixed $v): ?string
    {
        $v = trim((string) $v);
        if ($v === '') {
            return null;
        }
        $d = \DateTime::createFromFormat('Y-m-d', $v);
        if (! $d || $d->format('Y-m-d') !== $v) {
            throw ChecksheetException::invalid('Format tanggal harus YYYY-MM-DD.');
        }
        return $v;
    }
}
