<?php

namespace App\Services;

use App\Models\ApprovalModel;
use App\Models\DayPicModel;
use App\Models\EntryModel;
use App\Models\FindingModel;
use App\Models\RemarkModel;
use App\Models\TemplateItemModel;
use App\Models\TemplateModel;

/**
 * Merakit seluruh keadaan satu lembar menjadi satu payload JSON.
 * Klien hanya merender payload ini — logika (kalkulasi ΔT, lock, statistik) tetap di server.
 */
class SheetStateBuilder
{
    public function build(int $sheetId): array
    {
        $cfg   = config('Checksheet');
        $sheet = (new SheetService())->sheet($sheetId);
        $tpl   = (new TemplateModel())->find($sheet['template_id']);
        $items = (new TemplateItemModel())->where('template_id', $tpl['id'])->orderBy('sort_order')->findAll();
        $dim   = SheetService::daysInMonth((int) $sheet['period_year'], (int) $sheet['period_month']);

        // entries[itemId][day]
        $entries = [];
        foreach ((new EntryModel())->where('sheet_id', $sheetId)->findAll() as $e) {
            $entries[(int) $e['item_id']][(int) $e['day_no']] = [
                'symbol' => $e['symbol'],
                'value'  => $e['value_num'] === null ? null : (float) $e['value_num'],
                'note'   => $e['note'],
                'by'     => $e['updated_by'],
            ];
        }

        $derived = $this->derive($items, $entries, $dim);

        $approvals = array_map(fn ($a) => [
            'scope' => $a['scope'], 'ref' => (int) $a['ref_no'], 'role' => $a['role'], 'status' => $a['status'],
            'actor' => $a['actor_name'], 'note' => $a['note'], 'at' => $this->dt($a['acted_at']),
        ], (new ApprovalModel())->forSheet($sheetId));

        $lockedDays = [];
        $finalized  = false;
        foreach ($approvals as $a) {
            if ($a['scope'] === 'DAY' && $a['status'] === 'APPROVED') {
                $lockedDays[] = $a['ref'];
            }
            if ($a['scope'] === 'DOC' && $a['role'] === 'KADEPT' && $a['status'] === 'APPROVED') {
                $finalized = true;
            }
        }

        $pics = [];
        foreach ((new DayPicModel())->where('sheet_id', $sheetId)->findAll() as $p) {
            $pics[(int) $p['day_no']] = $p['pic_name'];
        }
        $remarks = [];
        foreach ((new RemarkModel())->where('sheet_id', $sheetId)->findAll() as $r) {
            $remarks[(int) $r['item_id']] = $r['remark'];
        }
        $findings = array_map(fn ($f) => [
            'line_no' => (int) $f['line_no'], 'found_date' => $this->d($f['found_date']), 'problem' => $f['problem'],
            'root_cause' => $f['root_cause'], 'counter_measure' => $f['counter_measure'],
            'due_date' => $this->d($f['due_date']), 'pic' => $f['pic'],
        ], (new FindingModel())->where('sheet_id', $sheetId)->orderBy('line_no')->findAll());

        // statistik "Jumlah Item Check"
        $perDay = [];
        $total  = 0;
        foreach ($entries as $days) {
            foreach ($days as $d => $cell) {
                if ($cell['symbol'] !== null || $cell['value'] !== null) {
                    $perDay[$d] = ($perDay[$d] ?? 0) + 1;
                    $total++;
                }
            }
        }
        $inputItems = count(array_filter($items, static fn ($i) => ! $i['calc_type']));

        return [
            'version' => (int) $sheet['rev_no'],
            'sheet'   => [
                'id' => (int) $sheet['id'], 'year' => (int) $sheet['period_year'], 'month' => (int) $sheet['period_month'],
                'days_in_month' => $dim, 'equipment_no' => $sheet['equipment_no'], 'form_date' => $this->d($sheet['form_date']),
                'finalized' => $finalized, 'locked_days' => $lockedDays, 'updated_by' => $sheet['updated_by'],
            ],
            'template' => [
                'code' => $tpl['code'], 'machine_type' => $tpl['machine_type'], 'department' => $tpl['department'],
                'section' => $tpl['section'], 'form_no' => $tpl['form_no'], 'revision' => $tpl['revision'],
                'page_info' => $tpl['page_info'], 'hints' => $tpl['hints'] ? json_decode($tpl['hints'], true) : [],
                'items' => array_map(static fn ($i) => [
                    'id' => (int) $i['id'], 'no' => (int) $i['item_no'], 'part' => $i['equipment_part'], 'method' => $i['inspection_method'],
                    'standard' => $i['standard'], 'period' => $i['period'], 'inst' => $i['instruction_codes'], 'mark' => $i['inspection_mark'],
                    'accepts_value' => (bool) $i['accepts_value'], 'unit' => $i['value_unit'],
                    'min' => $i['limit_min'] === null ? null : (float) $i['limit_min'],
                    'max' => $i['limit_max'] === null ? null : (float) $i['limit_max'],
                    'calc' => (bool) $i['calc_type'],
                ], $items),
            ],
            'entries'   => (object) $entries,
            'derived'   => (object) $derived,
            'remarks'   => (object) $remarks,
            'pics'      => (object) $pics,
            'approvals' => $approvals,
            'findings'  => $findings,
            'stats'     => ['checked_total' => $total, 'expected_total' => $inputItems * $dim, 'per_day' => (object) $perDay],
            'config'    => ['week_blocks' => $cfg->weekBlocks, 'doc_order' => $cfg->docApprovalOrder, 'min_finding_rows' => $cfg->minFindingRows, 'poll_ms' => $cfg->pollIntervalMs],
        ];
    }

    /** Item kalkulasi (DIFF = ref1 − ref2) dihitung per hari. */
    private function derive(array $items, array $entries, int $dim): array
    {
        $byNo = [];
        foreach ($items as $i) {
            $byNo[(int) $i['item_no']] = (int) $i['id'];
        }
        $out = [];
        foreach ($items as $i) {
            if ($i['calc_type'] !== 'DIFF') {
                continue;
            }
            [$a, $b] = array_map('intval', explode(',', (string) $i['calc_refs'])) + [0, 0];
            $ia = $byNo[$a] ?? null;
            $ib = $byNo[$b] ?? null;
            for ($d = 1; $d <= $dim; $d++) {
                $va = $entries[$ia][$d]['value'] ?? null;
                $vb = $entries[$ib][$d]['value'] ?? null;
                if ($va !== null && $vb !== null) {
                    $out[(int) $i['id']][$d] = round($va - $vb, 3);
                }
            }
        }
        return $out;
    }

    private function d(mixed $v): ?string
    {
        return $v ? ($v instanceof \DateTimeInterface ? $v->format('Y-m-d') : substr((string) $v, 0, 10)) : null;
    }

    private function dt(mixed $v): ?string
    {
        return $v ? ($v instanceof \DateTimeInterface ? $v->format('Y-m-d H:i:s') : substr((string) $v, 0, 19)) : null;
    }
}
