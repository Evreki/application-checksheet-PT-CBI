<?php

namespace App\Enums;

enum CheckSymbol: string
{
    case OK       = 'V';  // Tidak ada problem
    case NG       = 'X';  // Belum OK / perlu dicek
    case FIXED    = 'XF'; // Problem sudah diperbaiki (X dilingkari)
    case REPLACED = 'O';  // Penggantian part

    public static function values(): array
    {
        return array_map(static fn (self $c) => $c->value, self::cases());
    }
}
