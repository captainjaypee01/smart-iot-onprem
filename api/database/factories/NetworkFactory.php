<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Network;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Network>
 */
class NetworkFactory extends Factory
{
    protected $model = Network::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->unique()->company(),
            'network_address' => '0x' . strtoupper(substr($this->faker->sha1(), 0, 6)),
            'description' => $this->faker->optional()->sentence(),
            'is_active' => true,
        ];
    }
}

