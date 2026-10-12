<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Exceptions\ChecksheetException;
use App\Services\SheetStateBuilder;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\HTTP\ResponseInterface;

/** Dasar semua endpoint JSON: format respons seragam, penanganan error, identitas pelaku. */
abstract class BaseApiController extends BaseController
{
    use ResponseTrait;

    protected $format = 'json';

    /** Nama pelaku (tanpa login) dikirim klien lewat header; dipakai untuk jejak audit. */
    protected function actor(): string
    {
        $name = trim(rawurldecode($this->request->getHeaderLine('X-Actor-Name')));
        return $name !== '' ? mb_substr($name, 0, 100) : 'Anonim';
    }

    protected function payload(array $rules = []): array
    {
        $data = $this->request->getJSON(true) ?? [];
        if ($rules && ! $this->validateData($data, $rules)) {
            throw ChecksheetException::invalid('Data tidak valid.', $this->validator->getErrors());
        }
        return $data;
    }

    /** Jalankan aksi; sukses → {data}, gagal → {error:{message}} dengan status HTTP yang sesuai. */
    protected function run(callable $action): ResponseInterface
    {
        try {
            return $this->respond(['data' => $action()]);
        } catch (ChecksheetException $e) {
            return $this->respond(['error' => ['message' => $e->getMessage(), 'details' => $e->details]], $e->status);
        } catch (\Throwable $e) {
            log_message('error', '{class}: {message} @ {file}:{line}', ['class' => $e::class, 'message' => $e->getMessage(), 'file' => $e->getFile(), 'line' => $e->getLine()]);
            return $this->respond(['error' => ['message' => 'Terjadi kesalahan pada server. Coba lagi atau hubungi admin.']], 500);
        }
    }

    protected function state(int $sheetId): array
    {
        return (new SheetStateBuilder())->build($sheetId);
    }
}
