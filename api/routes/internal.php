<?php

use App\Http\Controllers\Api\V1\Commands\InternalCommandController;
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
        Route::patch('/commands/{commandId}/status', [InternalCommandController::class, 'updateStatus']);
    });
