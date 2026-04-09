<?php

declare(strict_types=1);

namespace App\Actions\Provisioning;

use App\Actions\Commands\CreateCommandAction;
use App\DTO\Commands\CreateCommandDTO;
use App\DTO\Provisioning\StoreProvisioningBatchDTO;
use App\Enums\ProvisioningNodeStatus;
use App\Models\ProvisioningBatch;
use App\Models\ProvisioningBatchNode;
use Illuminate\Support\Facades\DB;

final class StoreProvisioningBatchAction
{
    public function __construct(
        private readonly GeneratePacketIdAction $generatePacketId,
        private readonly CreateCommandAction $createCommand,
    ) {}

    /**
     * @return array{primary: ProvisioningBatch, broadcast: ProvisioningBatch}
     */
    public function execute(StoreProvisioningBatchDTO $dto): array
    {
        return DB::transaction(function () use ($dto): array {
            $primaryPacketId = $this->generatePacketId->execute();
            $broadcastPacketId = $this->generatePacketId->execute();

            $primaryBatch = ProvisioningBatch::create([
                'network_id' => $dto->networkId,
                'submitted_by' => $dto->submittedBy,
                'packet_id' => $primaryPacketId,
                'target_node_id' => $dto->targetNodeId,
                'status' => 'pending',
                'total_nodes' => count($dto->nodes),
                'provisioned_nodes' => 0,
                'is_auto_register' => $dto->isAutoRegister,
                'command_sent' => "PROVISIONING_CMD:{$primaryPacketId}",
            ]);

            $broadcastBatch = ProvisioningBatch::create([
                'network_id' => $dto->networkId,
                'submitted_by' => $dto->submittedBy,
                'packet_id' => $broadcastPacketId,
                'target_node_id' => 'ffffffff',
                'status' => 'pending',
                'total_nodes' => count($dto->nodes),
                'provisioned_nodes' => 0,
                'is_auto_register' => $dto->isAutoRegister,
                'command_sent' => "PROVISIONING_CMD:{$broadcastPacketId}",
            ]);

            foreach ($dto->nodes as $node) {
                $this->createNodeWithCommand($primaryBatch, $node, $dto->networkId, $dto->submittedBy);
                $this->createNodeWithCommand($broadcastBatch, $node, $dto->networkId, $dto->submittedBy);
            }

            return [
                'primary' => $primaryBatch->load(['nodes', 'network', 'submittedBy']),
                'broadcast' => $broadcastBatch->load(['nodes', 'network', 'submittedBy']),
            ];
        });
    }

    /**
     * @param  array{service_id: string, node_address: string}  $node
     */
    private function createNodeWithCommand(
        ProvisioningBatch $batch,
        array $node,
        int $networkId,
        int $submittedBy,
    ): void {
        $nodeAddress = strtoupper($node['node_address']);

        /** @var ProvisioningBatchNode $batchNode */
        $batchNode = $batch->nodes()->create([
            'service_id' => $node['service_id'],
            'node_address' => $nodeAddress,
            'status' => ProvisioningNodeStatus::Pending,
        ]);

        $command = $this->createCommand->execute(new CreateCommandDTO(
            userId: (string) $submittedBy,
            networkId: $networkId,
            deviceId: $node['service_id'],
            type: 'node_provisioning',
            payload: json_encode([
                'service_id' => $node['service_id'],
                'node_address' => $nodeAddress,
                'network_id' => $networkId,
                'packet_id' => $batch->packet_id,
                'target_node_id' => $batch->target_node_id,
            ], JSON_THROW_ON_ERROR),
        ));

        $batchNode->update(['last_command_id' => $command->id]);
    }
}
