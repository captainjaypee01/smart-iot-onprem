<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('user can login with valid credentials', function () {
    $this->get('/sanctum/csrf-cookie', [
        'Referer' => 'http://localhost:5173/',
    ])->assertStatus(204);
    $token = csrf_token();

    $user = User::factory()->create([
        'email' => 'test@example.com',
        'password' => bcrypt('password'),
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'test@example.com',
        'password' => 'password',
    ], [
        'Referer' => 'http://localhost:5173/',
        'X-XSRF-TOKEN' => $token,
        'X-CSRF-TOKEN' => $token,
    ]);

    $response->assertStatus(200)
        ->assertJsonStructure([
            'user' => ['id', 'name', 'email'],
        ])
        ->assertJsonMissing(['token']);

    expect($response->json('user.email'))->toBe('test@example.com');
});

test('user cannot login with invalid credentials', function () {
    User::factory()->create([
        'email' => 'test@example.com',
        'password' => bcrypt('password'),
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'test@example.com',
        'password' => 'wrong-password',
    ]);

    $response->assertStatus(401)
        ->assertJson([
            'message' => 'These credentials do not match our records.',
        ]);
});

test('authenticated user can get their profile', function () {
    $user = User::factory()->create();

    $this->actingAs($user, 'web');

    $response = $this->getJson('/api/v1/auth/me');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'user' => ['id', 'uuid', 'name', 'email'],
        ]);

    expect($response->json('user.uuid'))->toBe($user->uuid);
    expect($response->json('user.id'))->toBe($user->id);
});

test('user can logout', function () {
    $this->get('/sanctum/csrf-cookie', [
        'Referer' => 'http://localhost:5173/',
    ])->assertStatus(204);

    User::factory()->create([
        'email' => 'logout@example.com',
        'password' => bcrypt('password'),
    ]);

    $this->postJson('/api/v1/auth/login', [
        'email' => 'logout@example.com',
        'password' => 'password',
    ], [
        'Referer' => 'http://localhost:5173/',
        'X-XSRF-TOKEN' => csrf_token(),
        'X-CSRF-TOKEN' => csrf_token(),
    ])->assertStatus(200);

    $logoutToken = csrf_token();

    $response = $this->postJson('/api/v1/auth/logout', [], [
        'Referer' => 'http://localhost:5173/',
        'X-XSRF-TOKEN' => $logoutToken,
        'X-CSRF-TOKEN' => $logoutToken,
    ]);

    $response->assertStatus(200)
        ->assertJson(['message' => 'Logged out successfully']);
});
