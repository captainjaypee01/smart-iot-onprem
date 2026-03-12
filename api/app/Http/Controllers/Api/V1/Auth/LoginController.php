<?php

// app/Http/Controllers/Api/V1/Auth/LoginController.php
// Handles email + password login for the SPA.
// Returns a Sanctum token + UserResource on success.

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Auth\LoginRequest;
use App\Http\Resources\Api\V1\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class LoginController extends Controller
{
    public function __invoke(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)
            ->with(['company', 'role.permissions'])
            ->first();

        // No user found, no password set (SSO-only), or wrong password
        if (! $user || ! $user->password || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'These credentials do not match our records.',
            ], 401);
        }

        if (! $user->is_active) {
            return response()->json([
                'message' => 'Your account has been disabled. Contact your administrator.',
            ], 403);
        }

        $user->update(['last_login_at' => now()]);

        $token = $user->createToken('spa-password')->plainTextToken;

        return response()->json([
            'user'  => new UserResource($user),
            'token' => $token,
        ]);
    }
}