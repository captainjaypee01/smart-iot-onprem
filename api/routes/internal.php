<?php

use App\Http\Controllers\Internal\CommandController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Internal API Routes (Backend Services)
|--------------------------------------------------------------------------
|
| These routes are for backend services (IoT services). They use internal
| token authentication (X-Internal-Token header).
|
*/

Route::prefix('internal')
    ->middleware(['internal.token', 'throttle:1000,1'])
    ->group(function () {
        Route::post('/commands/{id}/mark-dispatched', [CommandController::class, 'markDispatched']);
        Route::post('/commands/{id}/mark-acked', [CommandController::class, 'markAcked']);
        Route::post('/commands/{id}/mark-completed', [CommandController::class, 'markCompleted']);
        Route::post('/commands/{id}/mark-failed', [CommandController::class, 'markFailed']);
    });
