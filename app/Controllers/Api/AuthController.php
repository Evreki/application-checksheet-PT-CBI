<?php

namespace App\Controllers\Api;

use App\Exceptions\ChecksheetException;
use App\Models\UserModel;
use CodeIgniter\HTTP\ResponseInterface;

class AuthController extends BaseApiController
{
    protected ?UserModel $users = null;

    private function getUsersModel(): UserModel
    {
        if ($this->users === null) {
            $this->users = new UserModel();
        }
        return $this->users;
    }

    private function trialUsers(): array
    {
        return [
            'leader' => [
                'id'         => 1,
                'username'   => 'leader',
                'full_name'  => 'Bambang Sutrisno',
                'role'       => 'leader',
                'department' => 'Maintenance',
                'section'    => 'Utility',
                'password'   => '12345',
            ],
            'user1' => [
                'id'         => 2,
                'username'   => 'user1',
                'full_name'  => 'Ahmad Subarjo',
                'role'       => 'user',
                'department' => 'Maintenance',
                'section'    => 'Utility',
                'password'   => '12345',
            ],
            'user2' => [
                'id'         => 3,
                'username'   => 'user2',
                'full_name'  => 'Budi Triawan',
                'role'       => 'user',
                'department' => 'Maintenance',
                'section'    => 'Electrical',
                'password'   => '12345',
            ],
        ];
    }

    public function login(): ResponseInterface
    {
        return $this->run(function () {
            $in = $this->payload([
                'username' => 'required',
                'password' => 'required',
            ]);

            $username = trim($in['username']);
            $password = (string) $in['password'];

            $trials = $this->trialUsers();

            // 1. Login cepat untuk akun trial (tidak perlu tunggu koneksi DB jika trial)
            if (isset($trials[$username]) && $password === $trials[$username]['password']) {
                $u = $trials[$username];
                $userData = [
                    'id'         => $u['id'],
                    'username'   => $u['username'],
                    'full_name'  => $u['full_name'],
                    'role'       => $u['role'],
                    'department' => $u['department'],
                    'section'    => $u['section'],
                ];
                session()->set('user', $userData);
                return [
                    'user'    => $userData,
                    'message' => 'Login trial berhasil.',
                ];
            }

            // 2. Query ke database jika user kustom
            $user = null;
            try {
                $user = $this->getUsersModel()->findByUsername($username);
            } catch (\Throwable $e) {
                log_message('warning', 'DB login lookup failed: ' . $e->getMessage());
            }

            if (! $user || ! password_verify($password, $user['password_hash'])) {
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
            $role = $this->request->getGet('role');
            try {
                $q = $this->getUsersModel()->where('is_active', 1)
                    ->select('id, username, full_name, role, department, section');

                if ($role) {
                    $q->where('role', $role);
                }

                $list = $q->findAll();
                if (! empty($list)) {
                    return $list;
                }
            } catch (\Throwable $e) {
                log_message('warning', 'DB users lookup failed: ' . $e->getMessage());
            }

            $trials = array_values($this->trialUsers());
            if ($role) {
                $trials = array_values(array_filter($trials, fn($x) => $x['role'] === $role));
            }
            return array_map(fn($x) => [
                'id'         => $x['id'],
                'username'   => $x['username'],
                'full_name'  => $x['full_name'],
                'role'       => $x['role'],
                'department' => $x['department'],
                'section'    => $x['section'],
            ], $trials);
        });
    }
}
