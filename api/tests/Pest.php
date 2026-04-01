<?php

declare(strict_types=1);

// Ensure test runs never touch the dev Postgres database.
// Some executions of `php artisan test` inside the container may ignore phpunit.xml env,
// and RefreshDatabase can then wipe pgsql. We hard-force sqlite at test bootstrap time.
putenv('DB_CONNECTION=sqlite');
putenv('DB_DATABASE=:memory:');
$_ENV['DB_CONNECTION'] = 'sqlite';
$_ENV['DB_DATABASE'] = ':memory:';

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class)->in('Feature');

// ── Shared test helpers ───────────────────────────────────────────────────────

function createSuperadmin(): User
{
    return User::factory()->create([
        'company_id'   => null,
        'role_id'      => null,
        'is_superadmin' => true,
    ]);
}
