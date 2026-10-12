<?php

namespace App\Exceptions;

use RuntimeException;

/** Kesalahan domain yang aman ditampilkan ke pengguna (dipetakan ke status HTTP). */
class ChecksheetException extends RuntimeException
{
    public function __construct(string $message, public readonly int $status = 400, public readonly array $details = [])
    {
        parent::__construct($message);
    }

    public static function notFound(string $m): self { return new self($m, 404); }
    public static function invalid(string $m, array $details = []): self { return new self($m, 422, $details); }
    public static function locked(string $m): self { return new self($m, 423); }
    public static function conflict(string $m): self { return new self($m, 409); }
}
