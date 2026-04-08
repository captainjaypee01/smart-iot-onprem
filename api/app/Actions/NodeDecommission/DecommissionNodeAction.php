<?php

declare(strict_types=1);

namespace App\Actions\NodeDecommission;

use App\DTO\NodeDecommission\DecommissionNodeDTO;
use App\Enums\CommandStatus;
use App\Enums\MessageStatus;
use App\Enums\NodeDecommissionStatus;
use App\Enums\NodeStatus;
use App\Enums\ProcessingStatus;
use App\Models\Command;
use App\Models\Node;
use App\Models\NodeDecommissionLog;
use App\Models\OutboxEvent;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;

class DecommissionNodeAction
{
    /**
     * Hardcoded decommission command payload (concatenated with packet_id when dispatching).
     * Format when sent to gateway: {packet_id}{DECOMMISSION_PAYLOAD}
     */
    public const DECOMMISSION_PAYLOAD = '0e05446f697421';

    public function __construct(
        private readonly GenerateDecommissionPacketIdAction $generatePacketId,
    ) {}

    /**
     * Send a decommission command for a node — creates a pending log entry.
     *
     * @throws HttpResponseException 422 if node is already decommissioned
     * @throws HttpResponseException 409 if an active pending decommission log exists
     */
    public function execute(Node $node, DecommissionNodeDTO $dto): NodeDecommissionLog
    {
        if ($node->status === NodeStatus::Decommissioned) {
            throw new HttpResponseException(
                response()->json(['message' => 'Node is already decommissioned.'], 422)
            );
        }

        $pendingExists = NodeDecommissionLog::query()
            ->forNode($node->id)
            ->where('status', NodeDecommissionStatus::Pending->value)
            ->exists();

        if ($pendingExists) {
            throw new HttpResponseException(
                response()->json(['message' => 'An active pending decommission already exists for this node.'], 409)
            );
        }

        return DB::transaction(function () use ($node, $dto): NodeDecommissionLog {
            $packetId = $this->generatePacketId->next();

            $command = Command::create([
                'network_id'        => $dto->networkId,
                'created_by'        => $dto->initiatedBy,
                'type'              => 'send_data',
                'node_address'      => $node->node_address,
                'request_id'        => random_int(100_000_000, 4_294_967_295),
                'source_ep'         => 155,
                'dest_ep'           => 146,
                'packet_id'         => $packetId,
                'payload'           => self::DECOMMISSION_PAYLOAD,
                'processing_status' => ProcessingStatus::Pending,
                'message_status'    => MessageStatus::WaitingResponse,
                'status'            => CommandStatus::PENDING,
                'requested_at'      => now(),
            ]);

            OutboxEvent::create([
                'aggregate_type' => 'command',
                'aggregate_id'   => $command->id,
                'event_name'     => 'command.send_data.created',
                'payload'        => ['command_id' => $command->id],
            ]);

            return NodeDecommissionLog::create([
                'node_id'      => $node->id,
                'network_id'   => $dto->networkId,
                'initiated_by' => $dto->initiatedBy,
                'command_id'   => $command->id,
                'status'       => NodeDecommissionStatus::Pending->value,
                'packet_id'    => $packetId,
                'payload'      => self::DECOMMISSION_PAYLOAD,
                'is_manual'    => false,
            ]);
        });
    }
}
