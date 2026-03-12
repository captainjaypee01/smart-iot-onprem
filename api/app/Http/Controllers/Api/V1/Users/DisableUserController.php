<?php

// app/Http/Controllers/Api/V1/Users/DisableUserController.php
// Toggles a user's is_active status (disable or re-enable).
// Single-action because it is a one-off state change, not part of standard CRUD.

namespace App\Http\Controllers\API\V1\Users;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;


class DisableUserController extends Controller
{
    public function __invoke(Request $request, User $user): JsonResponse
    {
        $authUser = $request->user();

        // Only superadmin or a company admin within the same company can toggle
        if (! $authUser->is_superadmin && (int) $user->company_id !== (int) $authUser->company_id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Prevent disabling a superadmin account
        if ($user->is_superadmin) {
            return response()->json([
                'message' => 'Superadmin accounts cannot be disabled.',
            ], 403);
        }

        // Prevent self-disable
        if ($user->id === $authUser->id) {
            return response()->json([
                'message' => 'You cannot disable your own account.',
            ], 403);
        }

        // Toggle: disable if active, re-enable if disabled
        $user->update(['is_active' => ! $user->is_active]);

        $action  = $user->is_active ? 'enabled' : 'disabled';
        $message = "User {$action} successfully.";

        $user->load(['company', 'role.permissions']);

        return response()->json([
            'message' => $message,
            'user'    => new UserResource($user),
        ]);
    }
}
