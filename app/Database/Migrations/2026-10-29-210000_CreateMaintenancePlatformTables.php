<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateMaintenancePlatformTables extends Migration
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
        // 1. cs_users: Tabel Pengguna (Leader & User/Teknisi)
        $this->forge->addField([
            'id'            => ['type' => 'INT', 'constraint' => 11, 'auto_increment' => true],
            'username'      => ['type' => 'NVARCHAR', 'constraint' => 50],
            'password_hash' => ['type' => 'NVARCHAR', 'constraint' => 255],
            'full_name'     => ['type' => 'NVARCHAR', 'constraint' => 100],
            'role'          => ['type' => 'NVARCHAR', 'constraint' => 20], // 'leader' | 'user'
            'department'    => ['type' => 'NVARCHAR', 'constraint' => 100, 'default' => 'Maintenance'],
            'section'       => ['type' => 'NVARCHAR', 'constraint' => 100, 'default' => 'Utility'],
            'is_active'     => ['type' => 'TINYINT', 'default' => 1],
        ] + $this->ts());
        $this->forge->addKey('id', true);
        $this->forge->addUniqueKey('username');
        $this->forge->createTable('cs_users', true);

        // 2. cs_equipment_instances: Unit fisik alat per Gedung & ID unik
        $this->forge->addField([
            'id'              => ['type' => 'INT', 'constraint' => 11, 'auto_increment' => true],
            'equipment_group' => ['type' => 'NVARCHAR', 'constraint' => 50], // 'air-dryer', 'chiller', 'cooling-tower', 'scrubber'
            'template_code'   => ['type' => 'NVARCHAR', 'constraint' => 30], // 'AD_D', 'CHILLER_D', 'CT', 'SCR'
            'instance_code'   => ['type' => 'NVARCHAR', 'constraint' => 50], // 'AD-001', 'AD-002', 'CH-001', dst.
            'instance_name'   => ['type' => 'NVARCHAR', 'constraint' => 100],
            'building'        => ['type' => 'NVARCHAR', 'constraint' => 50], // 'Gedung A', 'Gedung B', 'Gedung C'
            'room_location'   => ['type' => 'NVARCHAR', 'constraint' => 150, 'null' => true],
            'photo_url'       => ['type' => 'NVARCHAR', 'constraint' => 255, 'null' => true],
            'is_active'       => ['type' => 'TINYINT', 'default' => 1],
            'sort_order'      => ['type' => 'INT', 'default' => 0],
        ] + $this->ts());
        $this->forge->addKey('id', true);
        $this->forge->addUniqueKey('instance_code');
        $this->forge->createTable('cs_equipment_instances', true);

        // 3. cs_assignments: Penugasan inspeksi harian/bulanan dari Leader ke User
        $this->forge->addField([
            'id'                  => ['type' => 'INT', 'constraint' => 11, 'auto_increment' => true],
            'instance_code'       => ['type' => 'NVARCHAR', 'constraint' => 50],
            'assigned_to_user_id' => ['type' => 'INT', 'constraint' => 11],
            'assigned_by_user_id' => ['type' => 'INT', 'constraint' => 11],
            'schedule_date'       => ['type' => 'DATE'],
            'inspection_type'     => ['type' => 'NVARCHAR', 'constraint' => 20, 'default' => 'DAILY'], // 'DAILY', 'MONTHLY'
            'status'              => ['type' => 'NVARCHAR', 'constraint' => 20, 'default' => 'PENDING'], // 'PENDING', 'IN_PROGRESS', 'COMPLETED'
            'notes'               => ['type' => 'NVARCHAR', 'constraint' => 500, 'null' => true],
        ] + $this->ts());
        $this->forge->addKey('id', true);
        $this->forge->createTable('cs_assignments', true);

        // 4. cs_action_items: Temuan NG (Action Today vs Action Backlog)
        $this->forge->addField([
            'id'               => ['type' => 'INT', 'constraint' => 11, 'auto_increment' => true],
            'sheet_id'         => ['type' => 'INT', 'constraint' => 11, 'null' => true],
            'instance_code'    => ['type' => 'NVARCHAR', 'constraint' => 50],
            'item_name'        => ['type' => 'NVARCHAR', 'constraint' => 200],
            'action_type'      => ['type' => 'NVARCHAR', 'constraint' => 20, 'default' => 'TODAY'], // 'TODAY', 'BACKLOG'
            'ng_description'   => ['type' => 'NVARCHAR', 'constraint' => 1000],
            'scheduled_date'   => ['type' => 'DATE', 'null' => true],
            'assigned_user_id' => ['type' => 'INT', 'constraint' => 11, 'null' => true],
            'decision_by'      => ['type' => 'NVARCHAR', 'constraint' => 100, 'null' => true],
            'status'           => ['type' => 'NVARCHAR', 'constraint' => 20, 'default' => 'OPEN'], // 'OPEN', 'IN_PROGRESS', 'RESOLVED'
        ] + $this->ts());
        $this->forge->addKey('id', true);
        $this->forge->createTable('cs_action_items', true);

        // 5. cs_reports: Laporan Tindakan & Perbaikan Maintenance
        $this->forge->addField([
            'id'                 => ['type' => 'INT', 'constraint' => 11, 'auto_increment' => true],
            'action_item_id'     => ['type' => 'INT', 'constraint' => 11, 'null' => true],
            'instance_code'      => ['type' => 'NVARCHAR', 'constraint' => 50],
            'report_date'        => ['type' => 'DATE'],
            'shift'              => ['type' => 'NVARCHAR', 'constraint' => 20, 'default' => 'Shift 1'],
            'pic_name'           => ['type' => 'NVARCHAR', 'constraint' => 100],
            'action_taken'       => ['type' => 'NVARCHAR', 'constraint' => 2000],
            'conclusion'         => ['type' => 'NVARCHAR', 'constraint' => 500, 'null' => true],
            'status'             => ['type' => 'NVARCHAR', 'constraint' => 20, 'default' => 'SUBMITTED'], // 'SUBMITTED', 'APPROVED'
            'leader_approval_by' => ['type' => 'NVARCHAR', 'constraint' => 100, 'null' => true],
            'leader_approval_at' => ['type' => 'DATETIME', 'null' => true],
        ] + $this->ts());
        $this->forge->addKey('id', true);
        $this->forge->createTable('cs_reports', true);

        // 6. cs_report_parts: Log Penggantian Sparepart
        $this->forge->addField([
            'id'          => ['type' => 'INT', 'constraint' => 11, 'auto_increment' => true],
            'report_id'   => ['type' => 'INT', 'constraint' => 11],
            'part_name'   => ['type' => 'NVARCHAR', 'constraint' => 200],
            'part_number' => ['type' => 'NVARCHAR', 'constraint' => 100, 'null' => true],
            'qty'         => ['type' => 'INT', 'default' => 1],
            'unit'        => ['type' => 'NVARCHAR', 'constraint' => 50, 'default' => 'Pcs'],
        ] + $this->ts());
        $this->forge->addKey('id', true);
        $this->forge->createTable('cs_report_parts', true);
    }

    public function down(): void
    {
        foreach (['cs_report_parts', 'cs_reports', 'cs_action_items', 'cs_assignments', 'cs_equipment_instances', 'cs_users'] as $t) {
            $this->forge->dropTable($t, true);
        }
    }
}
