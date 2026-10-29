<?php

namespace App\Controllers\Api;

use App\Exceptions\ChecksheetException;
use App\Models\UserModel;
use CodeIgniter\HTTP\ResponseInterface;

class AuthController extends BaseApiController
{
    protected UserModel $users;

    public function __construct()
    {
        $this->users = new UserModel();
    }

    public function login(): ResponseInterface
    {
        return $this->run(function () {
            $in = $this->payload([
                'username' => 'required',
                'password' => 'required',
            ]);

            $user = $this->users->findByUsername(trim($in['username']));
            if (! $user || ! password_verify($in['password'], $user['password_hash'])) {
                throw ChecksheetException::invalid('Username atau password salah.');
            }

            $userData = [
                'id'         => (int) $user['id'],
                'username'   => $user['username'],
                'full_name'  => $user['full_name'],
                'role'       => $user['role'],
                'department' => $user['department'],
                'section'    => $user['section'],
            ];

            session()->set('user', $userData);

            return [
                'user'    => $userData,
                'message' => 'Login berhasil.',
            ];
        });
    }

    public function me(): ResponseInterface
    {
        return $this->run(function () {
            $sessionUser = session()->get('user');
            if ($sessionUser) {
                return ['user' => $sessionUser, 'authenticated' => true];
            }
            return ['user' => null, 'authenticated' => false];
        });
    }

    public function logout(): ResponseInterface
    {
        return $this->run(function () {
            session()->remove('user');
            return ['message' => 'Logout berhasil.'];
        });
    }

    public function users(): ResponseInterface
    {
        return $this->run(function () {
            $list = $this->users->where('is_active', 1)
                ->select('id, username, full_name, role, department, section')
                ->findAll();
            return $list;
        });
    }
}
