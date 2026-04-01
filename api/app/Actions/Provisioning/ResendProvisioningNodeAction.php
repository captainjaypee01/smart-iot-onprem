<?php

declare(strict_types=1);

namespace App\Actions\Provisioning;

use App\DTO\Commands\CreateCommandDTO;
use App\Actions\Commands\CreateCommandAction;
use App\Enums\ProvisioningNodeStatus;
use App\Models\ProvisioningBatch;
use App\Models\ProvisioningBatchNode;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class ResendProvisioningNodeAction
{
    public function __construct(
        private readonly CreateCommandAction $createCommand,
        private readonly RecomputeBatchStatusAction $recomputeBatchStatus,
    ) {}

    public function execute(ProvisioningBatch $batch, ProvisioningBatchNode $node): ProvisioningBatchNode
    {
        return DB::transaction(function () use ($batch, $node): ProvisioningBatchNode {
            $command = $this->createCommand->execute(new CreateCommandDTO(
                userId: $node->provisioning_batch_id !== null ? (string) $batch->submitted_by : null,
                networkId: $batch->network_id,
                deviceId: $node->service_id,
                type: 'node_provisioning',
                payload: json_encode([
                    'service_id'     => $node->service_id,
                    'node_address'   => $node->node_address,
                    'network_id'     => $batch->network_id,
                    'packet_id'      => $batch->packet_id,
                    'target_node_id' => $batch->target_node_id,
                ], JSON_THROW_ON_ERROR),
                correlationId: Str::uuid()->toString(),
            ));

            $node->update([
                'last_command_id' => $command->id,
                'status'          => ProvisioningNodeStatus::Pending,
            ]);

            $this->recomputeBatchStatus->execute($batch);

            return $node->fresh();
        });
    }
}
