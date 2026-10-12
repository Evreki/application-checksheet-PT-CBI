<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/** Data transaksi: lembar bulanan, isian harian, approval, temuan. */
class CreateSheetTables extends Migration
{
    private function ts(): array
    {
        return [
            'created_at' => ['type' => 'DATETIME', 'null' => true],
            'updated_at' => ['type' => 'DATETIME', 'null' => true],
        ];
    }

    public function up(): void
    {
        $this->forge->addField([
            'id'           => ['type' => 'INT', 'constraint' => 11, 'auto_increment' => true],
            'template_id'  => ['type' => 'INT', 'constraint' => 11],
            'period_year'  => ['type' => 'INT'],
            'period_month' => ['type' => 'INT'],
            'equipment_no' => ['type' => 'NVARCHAR', 'constraint' => 100, 'null' => true],
            'form_date'    => ['type' => 'DATE', 'null' => true],
            'rev_no'       => ['type' => 'INT', 'default' => 0], // naik tiap perubahan → dasar sinkronisasi real-time
            'updated_by'   => ['type' => 'NVARCHAR', 'constraint' => 100, 'null' => true],
        ] + $this->ts());
        $this->forge->addKey('id', true);
        $this->forge->addUniqueKey(['template_id', 'period_year', 'period_month']);
        $this->forge->addForeignKey('template_id', 'cs_templates', 'id');
        $this->forge->createTable('cs_sheets', true);

        $this->forge->addField([
            'id'         => ['type' => 'INT', 'constraint' => 11, 'auto_increment' => true],
            'sheet_id'   => ['type' => 'INT', 'constraint' => 11],
            'item_id'    => ['type' => 'INT', 'constraint' => 11],
            'day_no'     => ['type' => 'INT'],
            'symbol'     => ['type' => 'NVARCHAR', 'constraint' => 3, 'null' => true],
            'value_num'  => ['type' => 'DECIMAL', 'constraint' => '14,3', 'null' => true],
            'note'       => ['type' => 'NVARCHAR', 'constraint' => 500, 'null' => true],
            'updated_by' => ['type' => 'NVARCHAR', 'constraint' => 100, 'null' => true],
        ] + $this->ts());
        $this->forge->addKey('id', true);
        $this->forge->addUniqueKey(['sheet_id', 'item_id', 'day_no']);
        $this->forge->addForeignKey('sheet_id', 'cs_sheets', 'id');
        $this->forge->addForeignKey('item_id', 'cs_template_items', 'id');
        $this->forge->createTable('cs_entries', true);

        $this->forge->addField([
            'id'       => ['type' => 'INT', 'constraint' => 11, 'auto_increment' => true],
            'sheet_id' => ['type' => 'INT', 'constraint' => 11],
            'item_id'  => ['type' => 'INT', 'constraint' => 11],
            'remark'   => ['type' => 'NVARCHAR', 'constraint' => 500],
        ] + $this->ts());
        $this->forge->addKey('id', true);
        $this->forge->addUniqueKey(['sheet_id', 'item_id']);
        $this->forge->addForeignKey('sheet_id', 'cs_sheets', 'id');
        $this->forge->addForeignKey('item_id', 'cs_template_items', 'id');
        $this->forge->createTable('cs_remarks', true);

        $this->forge->addField([
            'id'       => ['type' => 'INT', 'constraint' => 11, 'auto_increment' => true],
            'sheet_id' => ['type' => 'INT', 'constraint' => 11],
            'day_no'   => ['type' => 'INT'],
            'pic_name' => ['type' => 'NVARCHAR', 'constraint' => 100],
        ] + $this->ts());
        $this->forge->addKey('id', true);
        $this->forge->addUniqueKey(['sheet_id', 'day_no']);
        $this->forge->addForeignKey('sheet_id', 'cs_sheets', 'id');
        $this->forge->createTable('cs_day_pics', true);

        // Approval generik: DAY / WEEK / DOC (ref_no = hari | nomor blok | 0)
        $this->forge->addField([
            'id'         => ['type' => 'INT', 'constraint' => 11, 'auto_increment' => true],
            'sheet_id'   => ['type' => 'INT', 'constraint' => 11],
            'scope'      => ['type' => 'NVARCHAR', 'constraint' => 10],
            'ref_no'     => ['type' => 'INT', 'default' => 0],
            'role'       => ['type' => 'NVARCHAR', 'constraint' => 20],
            'status'     => ['type' => 'NVARCHAR', 'constraint' => 10],
            'actor_name' => ['type' => 'NVARCHAR', 'constraint' => 100],
            'note'       => ['type' => 'NVARCHAR', 'constraint' => 500, 'null' => true],
            'acted_at'   => ['type' => 'DATETIME', 'null' => true],
        ] + $this->ts());
        $this->forge->addKey('id', true);
        $this->forge->addUniqueKey(['sheet_id', 'scope', 'ref_no', 'role']);
        $this->forge->addForeignKey('sheet_id', 'cs_sheets', 'id');
        $this->forge->createTable('cs_approvals', true);

        $this->forge->addField([
            'id'              => ['type' => 'INT', 'constraint' => 11, 'auto_increment' => true],
            'sheet_id'        => ['type' => 'INT', 'constraint' => 11],
            'line_no'         => ['type' => 'INT'],
            'found_date'      => ['type' => 'DATE', 'null' => true],
            'problem'         => ['type' => 'NVARCHAR', 'constraint' => 500, 'null' => true],
            'root_cause'      => ['type' => 'NVARCHAR', 'constraint' => 500, 'null' => true],
            'counter_measure' => ['type' => 'NVARCHAR', 'constraint' => 500, 'null' => true],
            'due_date'        => ['type' => 'DATE', 'null' => true],
            'pic'             => ['type' => 'NVARCHAR', 'constraint' => 100, 'null' => true],
            'entry_id'        => ['type' => 'INT', 'constraint' => 11, 'null' => true], // cadangan: tautan ke sel pemicu
        ] + $this->ts());
        $this->forge->addKey('id', true);
        $this->forge->addUniqueKey(['sheet_id', 'line_no']);
        $this->forge->addForeignKey('sheet_id', 'cs_sheets', 'id');
        $this->forge->createTable('cs_findings', true);
    }

    public function down(): void
    {
        foreach (['cs_findings', 'cs_approvals', 'cs_day_pics', 'cs_remarks', 'cs_entries', 'cs_sheets'] as $t) {
            $this->forge->dropTable($t, true);
        }
    }
}
