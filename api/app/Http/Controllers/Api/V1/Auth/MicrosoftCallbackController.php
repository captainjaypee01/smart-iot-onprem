<?php

// app/Http/Controllers/Api/V1/Auth/MicrosoftCallbackController.php
// Handles the OAuth callback redirect from Microsoft.
//
// Flow:
//   1. Microsoft redirects here with ?code=... after the user approves.
//   2. We exchange the code for a Microsoft user profile via Socialite.
//   3. We find the local user by email (no auto-creation — must be pre-provisioned).
//   4. We log the user in via session and redirect to the SPA. The redirect response
//      includes Set-Cookie (session cookie). No token or user in the URL.
//
// On any failure we redirect to /login?error=<key> so the SPA can display
// the appropriate message from SSO_ERROR_MESSAGES.

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\SocialAccount;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

class MicrosoftCallbackController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        $frontendUrl = rtrim(config('app.frontend_url'), '/');

        try {
            /** @var \Laravel\Socialite\Two\User $socialUser */
            $socialUser = Socialite::driver('microsoft')
                ->stateless()
                ->user();
        } catch (Throwable $e) {
            Log::warning('Microsoft SSO failed during token exchange', [
                'error' => $e->getMessage(),
            ]);

            return redirect("{$frontendUrl}/login?error=sso_failed");
        }

        $email = $socialUser->getEmail();

        if (! $email) {
            return redirect("{$frontendUrl}/login?error=no_email");
        }

        // Find user by email — we do NOT auto-create accounts.
        // All users must be pre-provisioned by an admin.
        $user = User::where('email', $email)
            ->with(['company', 'role.permissions'])
            ->first();

        if (! $user) {
            return redirect("{$frontendUrl}/login?error=account_not_found");
        }

        if (! $user->is_active) {
            return redirect("{$frontendUrl}/login?error=account_disabled");
        }

        // Upsert social_accounts — uses integer $user->id for the FK (internal only)
        SocialAccount::updateOrCreate(
            [
                'provider' => 'microsoft',
                'provider_user_id' => $socialUser->getId(),
            ],
            [
                'user_id' => $user->id,
                'access_token' => $socialUser->token,
                'refresh_token' => $socialUser->refreshToken,
                'token_expires_at' => $socialUser->expiresIn
                    ? now()->addSeconds($socialUser->expiresIn)
                    : null,
            ]
        );

        if (! $user->email_verified_at) {
            $user->email_verified_at = now();
        }

        $user->last_login_at = now();
        $user->save();

        $stored = Setting::get(Setting::KEY_SESSION_LIFETIME, $user->company_id);
        config(['session.lifetime' => Setting::resolveSessionLifetimeMinutes($stored)]);

        Auth::guard('web')->login($user, true);
        $request->session()->regenerate();

        return redirect("{$frontendUrl}/auth/callback");
    }
}
