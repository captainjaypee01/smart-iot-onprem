<?php

// app/Http/Controllers/Api/V1/Auth/SetPasswordController.php
// Allows invited users to set their password via the invite link.
//
// Token contract (matches InviteUserAction):
//   - Stored as plain text in password_reset_tokens.token
//   - Expires after 60 minutes (checked against created_at)
//   - Deleted immediately after use (single-use)

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Auth\SetPasswordRequest;
use App\Http\Resources\Api\V1\UserResource;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class SetPasswordController extends Controller
{
    private const TOKEN_TTL_MINUTES = 60;

    public function __invoke(SetPasswordRequest $request): JsonResponse
    {
        $record = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->where('token', $request->token)
            ->first();

        if (! $record) {
            return response()->json([
                'message' => 'Invalid or expired link.',
            ], 422);
        }

        if (Carbon::parse($record->created_at)->diffInMinutes(now()) > self::TOKEN_TTL_MINUTES) {
            DB::table('password_reset_tokens')
                ->where('email', $request->email)
                ->delete();

            return response()->json([
                'message' => 'This link has expired. Ask your admin to resend the invite.',
            ], 422);
        }

        $user = User::where('email', $request->email)
            ->with(['company', 'role.permissions'])
            ->firstOrFail();

        $user->update([
            'password'          => Hash::make($request->password),
            'email_verified_at' => $user->email_verified_at ?? now(),
        ]);

        DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->delete();

        $token = $user->createToken('spa-password')->plainTextToken;

        return response()->json([
            'user'  => new UserResource($user),
            'token' => $token,
        ]);
    }
}