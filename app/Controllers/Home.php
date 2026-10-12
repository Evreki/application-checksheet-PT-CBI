<?php

namespace App\Controllers;

class Home extends BaseController
{
    public function index(): string
    {
        return view('checksheet/index', ['cfg' => config('Checksheet')]);
    }
}
