<?php

// app/Http/Controllers/Api/V1/Users/ResendInviteController.php
// Resends the welcome/set-password email to a user who hasn't set their password yet.
// Single-action because it is a one-off action, not part of standard CRUD.

namespace App\Http\Controllers\Api\V1\Users;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\WelcomeUserNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ResendInviteController extends Controller
{
    public function __invoke(Request $request, User $user): JsonResponse
    {
        $authUser = $request->user();

        // Only superadmin or a company admin within the same company can resend
        if (! $authUser->is_superadmin && (int) $user->company_id !== (int) $authUser->company_id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Only makes sense to resend if the user has never set a password
        if ($user->password !== null) {
            return response()->json([
                'message' => 'This user has already set their password. No invite needed.',
            ], 422);
        }

        if (! $user->is_active) {
            return response()->json([
                'message' => 'Cannot resend invite to a disabled account.',
            ], 422);
        }

        $token = Str::random(64);

        DB::table('password_reset_tokens')->upsert(
            ['email' => $user->email, 'token' => $token, 'created_at' => now()],
            ['email'],
            ['token', 'created_at']
        );

        $user->notify(new WelcomeUserNotification($token));

        return response()->json(['message' => 'Invite email resent successfully.']);
    }
}
