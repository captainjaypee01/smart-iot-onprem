<?php

// app/Http/Controllers/Api/V1/Auth/MeController.php
// Returns the currently authenticated user.
// Used on app load to rehydrate the Zustand auth store.
// Eager-loads company and role.permissions in one batched query to avoid N+1 and extra round-trips.

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MeController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = User::with([
            'company',
            'role.permissions:id,key', // only columns used by UserResource
        ])->find($request->user()->id);

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        return response()->json([
            'user' => new UserResource($user),
        ]);
    }
}