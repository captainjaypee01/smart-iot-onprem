<?php

namespace App\Providers;

use App\Contracts\OutboxPublisherContract;
use App\Services\OutboxPublisherService;
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
        //
    }
}
