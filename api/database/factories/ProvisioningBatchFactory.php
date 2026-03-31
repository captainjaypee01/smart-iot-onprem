<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\ProvisioningBatchStatus;
use App\Models\Network;
use App\Models\ProvisioningBatch;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProvisioningBatch>
 */
class ProvisioningBatchFactory extends Factory
{
    protected $model = ProvisioningBatch::class;

    public function definition(): array
    {
        return [
            'network_id'        => Network::factory(),
            'packet_id'         => strtolower(bin2hex(random_bytes(2))),
            'target_node_id'    => 'ffffffff',
            'submitted_by'      => User::factory()->state([
                'is_superadmin' => true,
                'company_id'    => null,
                'role_id'       => null,
            ]),
            'status'            => ProvisioningBatchStatus::Pending,
            'total_nodes'       => 1,
            'provisioned_nodes' => 0,
            'is_auto_register'  => false,
            'command_sent'      => 'PROVISIONING_CMD:' . strtolower(bin2hex(random_bytes(2))),
        ];
    }
}
