<?php

// routes/api.php
// Public API routes — add these to your existing api.php file
// Base URL: /api/v1

use App\Http\Controllers\Api\V1\Auth\LoginController;
use App\Http\Controllers\Api\V1\Auth\LogoutController;
use App\Http\Controllers\Api\V1\Auth\MeController;
use App\Http\Controllers\API\V1\Auth\MicrosoftCallbackController;
use App\Http\Controllers\Api\V1\Auth\MicrosoftRedirectController;
use App\Http\Controllers\Api\V1\Auth\SetPasswordController;
use App\Http\Controllers\Api\V1\Commands\CommandController as SendDataCommandController;
use App\Http\Controllers\Api\V1\Companies\CompanyController;
use App\Http\Controllers\Api\V1\Companies\UploadCompanyLogoController;
use App\Http\Controllers\Api\V1\Features\FeatureController;
use App\Http\Controllers\Api\V1\Features\ReorderFeaturesController;
use App\Http\Controllers\Api\V1\Features\ReorderGroupsController;
use App\Http\Controllers\Api\V1\GatewayController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\Networks\GenerateAddressController;
use App\Http\Controllers\Api\V1\Networks\NetworkController;
use App\Http\Controllers\Api\V1\Networks\ToggleMaintenanceController;
use App\Http\Controllers\Api\V1\NodeTypes\NodeTypeController;
use App\Http\Controllers\Api\V1\PermissionController;
use App\Http\Controllers\Api\V1\Provisioning\ProvisioningController;
use App\Http\Controllers\Api\V1\Provisioning\ResendProvisioningNodeController;
use App\Http\Controllers\Api\V1\Roles\RoleController;
use App\Http\Controllers\Api\V1\Settings\SessionSettingsController;
use App\Http\Controllers\Api\V1\Users\DisableUserController;
use App\Http\Controllers\Api\V1\Users\ResendInviteController;
use App\Http\Controllers\Api\V1\Users\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // ─── Health (public) ─────────────────────────────────────────────
    Route::get('/health', HealthController::class);

    // ─── Auth (public) ───────────────────────────────────────────────
    Route::prefix('auth')->group(function () {
        Route::post('/login', LoginController::class);
        Route::post('/set-password', SetPasswordController::class);

        // Returns { redirect_url } for the SPA to follow
        // Microsoft OAuth — redirect gives the SPA the URL to navigate to,
        // callback is where Microsoft returns after the user approves.
        Route::prefix('microsoft')->group(function () {
            Route::get('redirect', MicrosoftRedirectController::class);
            Route::get('callback', MicrosoftCallbackController::class);
        });
    });

    // ─── Auth (protected) ────────────────────────────────────────────
    Route::middleware('auth:sanctum')->group(function () {
        Route::prefix('auth')->group(function () {
            Route::post('/logout', LogoutController::class);
            Route::get('/me', MeController::class);
        });

        // ── Protected API routes go below this line ───────────────────────────
        // Node Types
        Route::get('/node-types/options', [NodeTypeController::class, 'options']);
        Route::apiResource('node-types', NodeTypeController::class);

        // Networks
        Route::get('/networks/options', [NetworkController::class, 'options']);
        Route::post('/networks/generate-address', GenerateAddressController::class);
        Route::apiResource('networks', NetworkController::class);
        Route::post('/networks/{network}/toggle-maintenance', ToggleMaintenanceController::class);

        // ─── Companies ───────────────────────────────────────────────────
        Route::get('/companies/options', [CompanyController::class, 'options']);
        Route::apiResource('companies', CompanyController::class);
        Route::post('companies/{company}/logo', UploadCompanyLogoController::class);

        // ─── Options lists (dropdowns for user create/edit; not paginated) ───
        Route::get('/roles/options', [RoleController::class, 'options']);

        // Role CRUD (options route must be registered before apiResource).
        Route::apiResource('roles', RoleController::class);

        // ─── Permissions ───────────────────────────────────────────────
        Route::get('/permissions', [PermissionController::class, 'index']);
        Route::get('/permissions/options', [PermissionController::class, 'options']);
        Route::get('/permissions/{permission}', [PermissionController::class, 'show']);
        Route::post('/permissions', [PermissionController::class, 'store']);
        Route::put('/permissions/{permission}', [PermissionController::class, 'update']);
        Route::delete('/permissions/{permission}', [PermissionController::class, 'destroy']);

        // ─── Users ───────────────────────────────────────────────────
        // Standard CRUD
        Route::apiResource('users', UserController::class);
        // One-off actions — single-action controllers
        Route::post('/users/{user}/resend-invite', ResendInviteController::class);
        Route::post('/users/{user}/disable', DisableUserController::class);

        // Settings (superadmin only; enforced in controller)
        Route::get('/settings/session', [SessionSettingsController::class, 'index']);
        Route::patch('/settings/session', [SessionSettingsController::class, 'update']);

        // ─── Features ─────────────────────────────────────────────────────────
        Route::get('/features/options', [FeatureController::class, 'options']);
        Route::put('/features/reorder', ReorderFeaturesController::class);
        Route::put('/features/reorder-groups', ReorderGroupsController::class);
        Route::apiResource('features', FeatureController::class)
            ->only(['index', 'show', 'update', 'store', 'destroy']);

        // ─── Commands ─────────────────────────────────────────────────
        Route::get('/commands', [SendDataCommandController::class, 'index']);
        Route::get('/commands/{command}', [SendDataCommandController::class, 'show']);
        Route::post('/commands', [SendDataCommandController::class, 'store']);
        Route::post('/commands/{command}/resend', [SendDataCommandController::class, 'resend']);

        // ─── Provisioning (superadmin only) ───────────────────────────
        Route::get('/provisioning', [ProvisioningController::class, 'index']);
        Route::post('/provisioning', [ProvisioningController::class, 'store']);
        Route::get('/provisioning/{provisioningBatch}', [ProvisioningController::class, 'show']);
        Route::post('/provisioning/{provisioningBatch}/nodes/{provisioningBatchNode}/resend', ResendProvisioningNodeController::class);

        // ─── Gateways (superadmin only) ───────────────────────────────
        Route::get('/gateways', [GatewayController::class, 'index']);
        Route::post('/gateways', [GatewayController::class, 'store']);
        Route::get('/gateways/{gateway}', [GatewayController::class, 'show']);
        Route::patch('/gateways/{gateway}', [GatewayController::class, 'update']);
        Route::delete('/gateways/{gateway}', [GatewayController::class, 'destroy']);
        Route::post('/gateways/{gateway}/commands', [GatewayController::class, 'sendCommand']);

        // Route::apiResource('devices', DeviceController::class);
        // Route::apiResource('alerts',  AlertController::class);
    });
});
