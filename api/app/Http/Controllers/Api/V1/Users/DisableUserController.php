<?php

declare(strict_types=1);

// app/Http/Controllers/Api/V1/Users/DisableUserController.php
// Toggles a user's is_active status (disable or re-enable).
// Single-action controller — delegates to DisableUserAction.

namespace App\Http\Controllers\Api\V1\Users;

use App\Actions\Users\DisableUserAction;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DisableUserController extends Controller
{
    public function __invoke(Request $request, User $user): JsonResponse
    {
        $authUser = $request->user();

        if (! $authUser->hasPermission('user.disable')) {
            return response()->json(['message' => 'Forbidden.'], Response::HTTP_FORBIDDEN);
        }

        // Scope: company admin can only disable users in their company (allow through if target is superadmin so action returns specific message)
        if (! $user->is_superadmin && ! $authUser->is_superadmin && (int) $user->company_id !== (int) $authUser->company_id) {
            return response()->json(['message' => 'Unauthorized.'], Response::HTTP_FORBIDDEN);
        }

        $result = (new DisableUserAction)->execute($user, $authUser->id);

        if ($result instanceof JsonResponse) {
            return $result;
        }

        $updatedUser = $result;
        $updatedUser->load(['company', 'role']);
        $action = $updatedUser->is_active ? 'enabled' : 'disabled';

        return response()->json([
            'message' => "User {$action} successfully.",
            'user' => new UserResource($updatedUser),
        ]);
    }
}
