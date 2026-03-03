<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CommandController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes (Public - SPA)
|--------------------------------------------------------------------------
|
| These routes are for the React SPA. They use Sanctum cookie-based auth.
|
*/

Route::prefix('v1')->group(function () {
    // Auth routes (public)
    Route::post('/auth/login', [AuthController::class, 'login']);

    // Protected routes (require Sanctum auth)
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);

        // Commands
        Route::post('/commands', [CommandController::class, 'store']);
    });
});
