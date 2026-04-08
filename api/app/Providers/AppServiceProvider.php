<?php

namespace App\Providers;

use App\Contracts\OutboxPublisherContract;
use App\Models\NodeDecommissionLog;
use App\Policies\NodeDecommissionPolicy;
use App\Services\OutboxPublisherService;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(OutboxPublisherContract::class, OutboxPublisherService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Session lifetime is applied per-company at login (see LoginController, MicrosoftCallbackController, SetPasswordController).

        // Explicit policy registration for models that don't follow the name convention.
        Gate::policy(NodeDecommissionLog::class, NodeDecommissionPolicy::class);
    }
}
