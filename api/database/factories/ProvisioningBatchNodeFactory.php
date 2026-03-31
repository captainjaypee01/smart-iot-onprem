<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\ProvisioningNodeStatus;
use App\Models\ProvisioningBatch;
use App\Models\ProvisioningBatchNode;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProvisioningBatchNode>
 */
class ProvisioningBatchNodeFactory extends Factory
{
    protected $model = ProvisioningBatchNode::class;

    public function definition(): array
    {
        return [
            'provisioning_batch_id' => ProvisioningBatch::factory(),
            'service_id'            => 'SVC-' . strtoupper($this->faker->unique()->bothify('????####')),
            'node_address'          => strtoupper(substr($this->faker->sha1(), 0, 10)),
            'status'                => ProvisioningNodeStatus::Pending,
            'last_command_id'       => null,
        ];
    }
}
