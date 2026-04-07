<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Gateway;
use App\Models\Network;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Gateway>
 */
class GatewayFactory extends Factory
{
    protected $model = Gateway::class;

    public function definition(): array
    {
        $sinkId = str_pad((string) $this->faker->numberBetween(1, 99), 2, '0', STR_PAD_LEFT);
        $prefix = strtoupper($this->faker->unique()->lexify('??????'));

        return [
            'network_id' => Network::factory(),
            'gateway_id' => $prefix.'_'.$sinkId,
            'sink_id' => $sinkId,
            'name' => $this->faker->words(3, true),
            'description' => $this->faker->optional()->sentence(),
            'is_test_mode' => false,
            'last_seen_at' => null,
        ];
    }

    public function online(): static
    {
        return $this->state(fn () => ['last_seen_at' => now()->subMinutes(5)]);
    }

    public function offline(): static
    {
        return $this->state(fn () => ['last_seen_at' => now()->subMinutes(30)]);
    }

    public function testMode(): static
    {
        return $this->state(fn () => ['is_test_mode' => true]);
    }
}
