<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class CorrelationId
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $correlationId = $request->header('X-Request-Id') ?? (string) Str::uuid();

        $request->headers->set('X-Request-Id', $correlationId);

        $response = $next($request);

        $response->headers->set('X-Request-Id', $correlationId);

        // Add to log context
        logger()->withContext(['request_id' => $correlationId]);

        return $response;
    }
}
