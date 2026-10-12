<?php

use CodeIgniter\Router\RouteCollection;

/** @var RouteCollection $routes */
$routes->get('/', 'Home::index');

/*
 * API v1. Semua mutasi memakai POST (bukan PUT/PATCH/DELETE) supaya aman di IIS/WebDAV & proxy kantor.
 * Setiap respons mutasi mengembalikan state lembar terbaru → UI selalu konsisten.
 */
$routes->group('api/v1', ['namespace' => 'App\Controllers\Api'], static function (RouteCollection $routes) {
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
