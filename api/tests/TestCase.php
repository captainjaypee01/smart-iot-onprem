<?php

declare(strict_types=1);

namespace Tests;

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    protected function getEnvironmentSetUp(Application $app): void
    {
        // Force tests onto an isolated in-memory DB.
        // This prevents RefreshDatabase from wiping your dev Postgres.
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.driver', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');
    }
}
