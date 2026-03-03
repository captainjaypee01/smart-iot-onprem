<?php

namespace Database\Factories;

use App\Enums\CommandStatus;
use App\Models\Command;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Command>
 */
class CommandFactory extends Factory
{
    protected $model = Command::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'device_id' => 'device-'.Str::random(8),
            'type' => 'set_temperature',
            'payload' => ['temperature' => fake()->numberBetween(18, 26)],
            'status' => CommandStatus::PENDING,
            'correlation_id' => (string) Str::uuid(),
            'requested_at' => now(),
        ];
    }
}
