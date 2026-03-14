<?php

declare(strict_types=1);

// app/Http/Controllers/Api/V1/HealthController.php
// Simple health endpoint used by Docker healthcheck. Exposes session_driver and Redis session status so you can verify the API is using Redis.

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Redis;

class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $sessionDriver = config('session.driver');
        $redisSessionConnected = null;
        if ($sessionDriver === 'redis') {
            try {
                $connection = config('session.connection');
                Redis::connection($connection)->ping();
                $redisSessionConnected = true;
            } catch (\Throwable $e) {
                $redisSessionConnected = false;
            }
        }

        return response()->json([
            'status' => 'ok',
            'app' => config('app.name'),
            'time' => now()->toIso8601String(),
            'session_driver' => $sessionDriver,
            'redis_session_connected' => $redisSessionConnected,
        ]);
    }
}

