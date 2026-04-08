<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\NodeDecommissionStatus;
use App\Models\Node;
use App\Models\NodeDecommissionLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<NodeDecommissionLog>
 */
class NodeDecommissionLogFactory extends Factory
{
    protected $model = NodeDecommissionLog::class;

    public function definition(): array
    {
        $node = Node::factory()->create();

        return [
            'node_id' => $node->id,
            'network_id' => $node->network_id,
            'initiated_by' => User::factory(),
            'status' => NodeDecommissionStatus::Pending->value,
            'packet_id' => strtolower(bin2hex(random_bytes(2))),
            'payload' => '0e05446f697421',
            'is_manual' => false,
            'verification_packet_id' => null,
            'verification_sent_at' => null,
            'verification_expires_at' => null,
            'error_message' => null,
            'decommissioned_at' => null,
        ];
    }

    public function pending(): static
    {
        return $this->state(fn () => ['status' => NodeDecommissionStatus::Pending->value]);
    }

    public function completed(): static
    {
        return $this->state(fn () => [
            'status' => NodeDecommissionStatus::Completed->value,
            'decommissioned_at' => now(),
        ]);
    }

    public function failed(): static
    {
        return $this->state(fn () => [
            'status' => NodeDecommissionStatus::Failed->value,
            'error_message' => 'Node did not respond',
        ]);
    }

    public function manual(): static
    {
        return $this->state(fn () => [
            'status' => NodeDecommissionStatus::Manual->value,
            'is_manual' => true,
            'packet_id' => null,
            'payload' => null,
            'decommissioned_at' => now(),
        ]);
    }
}
