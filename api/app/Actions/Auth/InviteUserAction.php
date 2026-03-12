<?php

// app/Actions/Auth/InviteUserAction.php
// Generates a plain-text invite token, stores it in password_reset_tokens,
// and returns the signed invite URL for the welcome email.
//
// Why we store plain-text (not hashed):
//   The password_reset_tokens migration stores the token as a plain varchar.
//   SetPasswordController reads it back and compares directly.
//   This is intentional for this project — do not switch to bcrypt here
//   without also updating SetPasswordController.
//
// Usage (e.g. from an admin controller):
//   $url = app(InviteUserAction::class)->execute($user);
//   Mail::to($user->email)->send(new WelcomeMail($user, $url));

namespace App\Actions\Auth;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InviteUserAction
{
    /**
     * Token lifetime in minutes — matches SetPasswordController check.
     */
    private const TOKEN_TTL_MINUTES = 60;

    /**
     * Generate a new invite token for the user and return the set-password URL.
     * Safe to call multiple times — replaces any existing token for this email.
     */
    public function execute(User $user): string
    {
        $token = Str::random(64);

        // Upsert — one token per email at a time
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            [
                'token'      => $token,
                'created_at' => now(),
            ]
        );

        $frontendUrl = rtrim(config('app.frontend_url'), '/');

        return "{$frontendUrl}/set-password?"
            . http_build_query([
                'token' => $token,
                'email' => $user->email,
            ]);
    }

    /**
     * How long (in minutes) an invite token is valid.
     * Exposed so callers can display this in the email body.
     */
    public function ttlMinutes(): int
    {
        return self::TOKEN_TTL_MINUTES;
    }
}