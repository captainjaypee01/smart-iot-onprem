<?php

// app/Http/Controllers/Api/V1/Auth/MeController.php
// Returns the currently authenticated user.
// Used on app load to rehydrate the Zustand auth store.

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MeController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user()
            ->load(['company', 'role.permissions']);

        return response()->json([
            'user' => new UserResource($user),
        ]);
    }
}