<?php

namespace App\Enums;

enum ApprovalScope: string
{
    case DAY  = 'DAY';  // per hari (baris KaSubSie MTN)
    case WEEK = 'WEEK'; // per blok mingguan (baris Kasie MTN)
    case DOC  = 'DOC';  // tanda tangan dokumen (Ka.Sub Sie / Ka.Sie / Ka.Dept)
}
