<?php

// app/Http/Controllers/Api/V1/Auth/MeController.php
// Returns the currently authenticated user and their permission keys.
// Used on app load to rehydrate the Zustand auth store and drive permission-based UI.

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\UserResource;
use App\Models\Permission;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MeController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = User::with([
            'company',
            'role.permissions:id,key',
        ])->find($request->user()->id);

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $permissions = $user->is_superadmin
            ? Permission::pluck('key')->values()->all()
            : $user->role?->permissions?->pluck('key')->values()->all() ?? [];

        return response()->json([
            'user' => new UserResource($user),
            'permissions' => $permissions,
        ]);
    }
}
