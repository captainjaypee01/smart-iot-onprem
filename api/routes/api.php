<?php

// routes/api.php
// Public API routes — add these to your existing api.php file
// Base URL: /api/v1

use App\Http\Controllers\Api\V1\Auth\LoginController;
use App\Http\Controllers\Api\V1\Auth\LogoutController;
use App\Http\Controllers\Api\V1\Auth\MeController;
use App\Http\Controllers\Api\V1\Auth\MicrosoftRedirectController;
use App\Http\Controllers\Api\V1\Auth\SetPasswordController;
use App\Http\Controllers\Api\V1\Users\DisableUserController;
use App\Http\Controllers\Api\V1\Users\ResendInviteController;
use App\Http\Controllers\Api\V1\Users\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // ─── Auth (public) ───────────────────────────────────────────────
    Route::prefix('auth')->group(function () {
        Route::post('/login', LoginController::class);
        Route::post('/set-password', SetPasswordController::class);

        // Returns { redirect_url } for the SPA to follow
        Route::get('/microsoft/redirect', MicrosoftRedirectController::class);
    });

    // ─── Auth (protected) ────────────────────────────────────────────
    Route::middleware('auth:sanctum')->group(function () {
        Route::prefix('auth')->group(function () {
            Route::post('/logout', LogoutController::class);
            Route::get('/me', MeController::class);
        });

        // ─── Users ───────────────────────────────────────────────────
        // Standard CRUD
        Route::apiResource('users', UserController::class);

        // One-off actions — single-action controllers
        Route::post('/users/{user}/resend-invite', ResendInviteController::class);
        Route::post('/users/{user}/disable', DisableUserController::class);
    });
});
