<?php

declare(strict_types=1);

namespace App\Actions\NodeDecommission;

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

class ResendDecommissionAction
{
    public function __construct(
        private readonly GenerateDecommissionPacketIdAction $generatePacketId,
    ) {}

    /**
     * Resend a decommission command after a failed attempt (node replied to verify = node is alive).
     * Creates a NEW log row — the failed row is preserved in history.
     *
     * @throws HttpResponseException 404 if no failed decommission log exists for the node
     * @throws HttpResponseException 422 if the node is already decommissioned
     */
    public function execute(Node $node): NodeDecommissionLog
    {
        if ($node->status === NodeStatus::Decommissioned) {
            throw new HttpResponseException(
                response()->json(['message' => 'Node is already decommissioned.'], 422)
            );
        }

        $failedLog = NodeDecommissionLog::query()
            ->forNode($node->id)
            ->where('status', NodeDecommissionStatus::Failed->value)
            ->orderByDesc('created_at')
            ->first();

        if ($failedLog === null) {
            throw new HttpResponseException(
                response()->json(['message' => 'No failed decommission log found for this node.'], 404)
            );
        }

        return DB::transaction(function () use ($node, $failedLog): NodeDecommissionLog {
            $packetId = $this->generatePacketId->next();

            $command = Command::create([
                'network_id'        => $failedLog->network_id,
                'created_by'        => $failedLog->initiated_by,
                'type'              => 'send_data',
                'node_address'      => $node->node_address,
                'request_id'        => random_int(100_000_000, 4_294_967_295),
                'source_ep'         => 155,
                'dest_ep'           => 146,
                'packet_id'         => $packetId,
                'payload'           => DecommissionNodeAction::DECOMMISSION_PAYLOAD,
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

            // Create a fresh row — the failed row stays in history as-is
            return NodeDecommissionLog::create([
                'node_id'      => $node->id,
                'network_id'   => $failedLog->network_id,
                'initiated_by' => $failedLog->initiated_by,
                'command_id'   => $command->id,
                'status'       => NodeDecommissionStatus::Pending->value,
                'packet_id'    => $packetId,
                'payload'      => DecommissionNodeAction::DECOMMISSION_PAYLOAD,
                'is_manual'    => false,
            ]);
        });
    }
}
