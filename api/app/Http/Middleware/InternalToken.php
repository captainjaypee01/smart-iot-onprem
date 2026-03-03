<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class InternalToken
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->header('X-Internal-Token');
        $expectedToken = config('app.internal_api_token');

        if (! $expectedToken || $token !== $expectedToken) {
            return response()->json([
                'message' => 'Unauthorized',
                'errors' => ['token' => ['Invalid or missing internal API token']],
            ], 401);
        }

        return $next($request);
    }
}
