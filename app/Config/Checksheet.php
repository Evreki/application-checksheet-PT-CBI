<?php

namespace Config;

use CodeIgniter\Config\BaseConfig;

/** Aturan bisnis yang bisa berubah ditaruh di sini, bukan tersebar di kode. */
class Checksheet extends BaseConfig
{
    public string $company = 'PT. Century Batteries Indonesia';

    /** Interval polling sinkronisasi antar-pengguna (ms). */
    public int $pollIntervalMs = 4000;

    /** Blok mingguan untuk approval Kasie (rentang hari, inklusif). */
    public array $weekBlocks = [[1, 8], [9, 15], [16, 22], [23, 31]];

    /** Urutan tanda tangan dokumen. */
    public array $docApprovalOrder = ['KASUBSIE', 'KASIE', 'KADEPT'];

    /** Minimal item terisi agar sebuah hari boleh di-approve. */
    public int $minEntriesForDayApproval = 1;

    /** true = semua item non-kalkulasi wajib terisi sebelum hari di-approve. */
    public bool $requireCompleteDay = false;

    /** Jumlah baris minimal tabel Temuan Problem (sesuai form: 14). */
    public int $minFindingRows = 14;
}
