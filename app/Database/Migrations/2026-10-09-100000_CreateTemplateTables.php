<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/** Master template form. Satu template = satu jenis mesin; mesin baru cukup tambah data. */
class CreateTemplateTables extends Migration
{
    public function up(): void
    {
        $this->forge->addField([
            'id'           => ['type' => 'INT', 'constraint' => 11, 'auto_increment' => true],
            'code'         => ['type' => 'NVARCHAR', 'constraint' => 30],
            'machine_type' => ['type' => 'NVARCHAR', 'constraint' => 100],
            'department'   => ['type' => 'NVARCHAR', 'constraint' => 100],
            'section'      => ['type' => 'NVARCHAR', 'constraint' => 100],
            'form_no'      => ['type' => 'NVARCHAR', 'constraint' => 50],
            'revision'     => ['type' => 'NVARCHAR', 'constraint' => 10, 'default' => '0'],
            'page_info'    => ['type' => 'NVARCHAR', 'constraint' => 30, 'default' => '1 dari 1'],
            'hints'        => ['type' => 'NVARCHAR', 'constraint' => 2000, 'null' => true],
            'is_active'    => ['type' => 'TINYINT', 'default' => 1],
            'sort_order'   => ['type' => 'INT', 'default' => 0],
            'created_at'   => ['type' => 'DATETIME', 'null' => true],
            'updated_at'   => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addUniqueKey('code');
        $this->forge->createTable('cs_templates', true);

        $this->forge->addField([
            'id'                => ['type' => 'INT', 'constraint' => 11, 'auto_increment' => true],
            'template_id'       => ['type' => 'INT', 'constraint' => 11],
            'item_no'           => ['type' => 'INT'],
            'equipment_part'    => ['type' => 'NVARCHAR', 'constraint' => 150],
            'inspection_method' => ['type' => 'NVARCHAR', 'constraint' => 50],
            'standard'          => ['type' => 'NVARCHAR', 'constraint' => 150, 'null' => true],
            'period'            => ['type' => 'NVARCHAR', 'constraint' => 50, 'default' => '1 x per Hari'],
            'instruction_codes' => ['type' => 'NVARCHAR', 'constraint' => 30, 'null' => true],
            'inspection_mark'   => ['type' => 'NVARCHAR', 'constraint' => 5, 'default' => 'I'],
            'accepts_value'     => ['type' => 'TINYINT', 'default' => 0],
            'value_unit'        => ['type' => 'NVARCHAR', 'constraint' => 20, 'null' => true],
            'limit_min'         => ['type' => 'DECIMAL', 'constraint' => '12,3', 'null' => true],
            'limit_max'         => ['type' => 'DECIMAL', 'constraint' => '12,3', 'null' => true],
            'calc_type'         => ['type' => 'NVARCHAR', 'constraint' => 20, 'null' => true],  // mis. DIFF
            'calc_refs'         => ['type' => 'NVARCHAR', 'constraint' => 100, 'null' => true], // mis. 1,2 (item_no)
            'sort_order'        => ['type' => 'INT', 'default' => 0],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addUniqueKey(['template_id', 'item_no']);
        $this->forge->addForeignKey('template_id', 'cs_templates', 'id');
        $this->forge->createTable('cs_template_items', true);
    }

    public function down(): void
    {
        $this->forge->dropTable('cs_template_items', true);
        $this->forge->dropTable('cs_templates', true);
    }
}
