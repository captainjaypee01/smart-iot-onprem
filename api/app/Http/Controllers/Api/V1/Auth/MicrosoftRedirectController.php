<?php

// app/Http/Controllers/Api/V1/Auth/MicrosoftRedirectController.php
// Returns the Microsoft OAuth redirect URL for the SPA to follow

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Laravel\Socialite\Facades\Socialite;

class MicrosoftRedirectController extends Controller
{
    public function __invoke(): JsonResponse
    {
        /** @var \Laravel\Socialite\Two\AbstractProvider $driver */
        $driver = Socialite::driver('microsoft')
            ->stateless()
            ->scopes(['openid', 'profile', 'email']);

        $redirectUrl = $driver->redirect()->getTargetUrl();

        return response()->json([
            'redirect_url' => $redirectUrl,
        ]);
    }
}