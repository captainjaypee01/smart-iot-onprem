<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\NodeStatus;
use App\Models\Network;
use App\Models\Node;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Node>
 */
class NodeFactory extends Factory
{
    protected $model = Node::class;

    public function definition(): array
    {
        return [
            'network_id' => Network::factory(),
            'zone_id' => null,
            'node_config_id' => null,
            'asset_id' => null,
            'name' => $this->faker->words(3, true),
            'node_address' => strtoupper(substr($this->faker->sha1(), 0, 8)),
            'service_id' => 'SVC-'.strtoupper($this->faker->unique()->lexify('??????')),
            'product_type' => null,
            'building_name' => null,
            'building_level' => null,
            'sector_name' => null,
            'postal_id' => null,
            'is_online' => false,
            'last_online_at' => null,
            'provisioned_at' => null,
            'status' => NodeStatus::New->value,
        ];
    }

    public function active(): static
    {
        return $this->state(fn () => ['status' => NodeStatus::Active->value]);
    }

    public function decommissioned(): static
    {
        return $this->state(fn () => ['status' => NodeStatus::Decommissioned->value]);
    }
}
