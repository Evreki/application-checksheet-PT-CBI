<?php

use CodeIgniter\Router\RouteCollection;

/** @var RouteCollection $routes */
$routes->get('/', 'Home::index');
$routes->get('reports/(:num)/print', 'ReportViewController::print/$1');

/*
 * API v1. Semua mutasi memakai POST (bukan PUT/PATCH/DELETE) supaya aman di IIS/WebDAV & proxy kantor.
 * Setiap respons mutasi mengembalikan state lembar terbaru → UI selalu konsisten.
 */
$routes->group('api/v1', ['namespace' => 'App\Controllers\Api'], static function (RouteCollection $routes) {
    // Auth & Users
    $routes->post('auth/login', 'AuthController::login');
    $routes->get('auth/me', 'AuthController::me');
    $routes->post('auth/logout', 'AuthController::logout');
    $routes->get('auth/users', 'AuthController::users');

    // Multi-Instance Equipment
    $routes->get('instances', 'EquipmentInstanceController::index');

    // Penugasan & Kalender
    $routes->get('assignments', 'AssignmentController::index');
    $routes->post('assignments', 'AssignmentController::create');
    $routes->post('assignments/(:num)/status', 'AssignmentController::updateStatus/$1');

    // Sidebar Action (Today & Backlog)
    $routes->get('actions', 'ActionController::index');
    $routes->post('actions', 'ActionController::create');
    $routes->post('actions/(:num)/decision', 'ActionController::decision/$1');
    $routes->post('actions/(:num)/status', 'ActionController::updateStatus/$1');

    // Sidebar Reporting & Sparepart
    $routes->get('reports', 'ReportController::index');
    $routes->post('reports', 'ReportController::create');
    $routes->post('reports/(:num)/approve', 'ReportController::approve/$1');

    // Checksheet & Templates
    $routes->get('templates', 'TemplateController::index');

    $routes->post('sheets/open', 'SheetController::open');
    $routes->get('sheets/(:num)', 'SheetController::show/$1');
    $routes->post('sheets/(:num)/header', 'SheetController::updateHeader/$1');
    $routes->post('sheets/(:num)/remarks', 'SheetController::saveRemark/$1');
    $routes->post('sheets/(:num)/days/(:num)/pic', 'SheetController::savePic/$1/$2');

    $routes->post('sheets/(:num)/entries', 'EntryController::save/$1');
    $routes->post('sheets/(:num)/days/(:num)/fill', 'EntryController::fillDay/$1/$2');

    $routes->post('sheets/(:num)/approvals', 'ApprovalController::act/$1');
    $routes->post('sheets/(:num)/approvals/revoke', 'ApprovalController::revoke/$1');

    $routes->post('sheets/(:num)/findings', 'FindingController::save/$1');
    $routes->post('sheets/(:num)/findings/(:num)/delete', 'FindingController::delete/$1/$2');
});
