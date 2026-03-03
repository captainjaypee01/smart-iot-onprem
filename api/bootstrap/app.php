<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function (): void {
            // Internal routes (not under /api prefix)
            Route::middleware('api')
                ->prefix('')
                ->group(base_path('routes/internal.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Global middleware
        $middleware->append(\App\Http\Middleware\CorrelationId::class);

        // API middleware groups
        $middleware->api(prepend: [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        ]);

        // Register alias for internal token middleware
        $middleware->alias([
            'internal.token' => \App\Http\Middleware\InternalToken::class,
        ]);

        // Rate limiting
        $middleware->throttleApi();
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Custom exception handling for JSON API responses
        $exceptions->render(function (\Illuminate\Validation\ValidationException $e, $request) {
            if ($request->expectsJson() || $request->is('api/*') || $request->is('internal/*')) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors' => $e->errors(),
                    'request_id' => $request->header('X-Request-Id'),
                ], 422);
            }
        });

        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            if ($request->expectsJson() || $request->is('api/*') || $request->is('internal/*')) {
                return response()->json([
                    'message' => 'Unauthenticated.',
                    'request_id' => $request->header('X-Request-Id'),
                ], 401);
            }
        });

        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\NotFoundHttpException $e, $request) {
            if ($request->expectsJson() || $request->is('api/*') || $request->is('internal/*')) {
                return response()->json([
                    'message' => 'Resource not found.',
                    'request_id' => $request->header('X-Request-Id'),
                ], 404);
            }
        });
    })->create();
