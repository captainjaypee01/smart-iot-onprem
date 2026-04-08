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

class VerifyDecommissionAction
{
    /**
     * Hardcoded verification (pulse) command payload.
     * Sent to check whether the node is still responding.
     * Format when dispatched: {verification_packet_id}{VERIFY_PAYLOAD}
     */
    public const VERIFY_PAYLOAD = '0501ff';

    /** Minutes to wait before the verification is considered timed out. */
    public const VERIFY_TIMEOUT_MINUTES = 2;

    public function __construct(
        private readonly GenerateDecommissionPacketIdAction $generatePacketId,
    ) {}

    /**
     * Send a verification (pulse) command for a node in pending decommission state.
     * Updates the existing pending log row with verification fields.
     *
     * @throws HttpResponseException 404 if no pending decommission log exists for the node
     * @throws HttpResponseException 422 if the node is already decommissioned
     */
    public function execute(Node $node): NodeDecommissionLog
    {
        if ($node->status === NodeStatus::Decommissioned) {
            throw new HttpResponseException(
                response()->json(['message' => 'Node is already decommissioned.'], 422)
            );
        }

        /** @var NodeDecommissionLog|null $log */
        $log = NodeDecommissionLog::query()
            ->forNode($node->id)
            ->where('status', NodeDecommissionStatus::Pending->value)
            ->orderByDesc('created_at')
            ->first();

        if ($log === null) {
            throw new HttpResponseException(
                response()->json(['message' => 'No pending decommission log found for this node.'], 404)
            );
        }

        return DB::transaction(function () use ($log, $node): NodeDecommissionLog {
            $verificationPacketId = $this->generatePacketId->next();
            $now = now();

            $command = Command::create([
                'network_id'        => $log->network_id,
                'created_by'        => $log->initiated_by,
                'type'              => 'send_data',
                'node_address'      => $node->node_address,
                'request_id'        => random_int(100_000_000, 4_294_967_295),
                'source_ep'         => 5,
                'dest_ep'           => 5,
                'packet_id'         => $verificationPacketId,
                'payload'           => self::VERIFY_PAYLOAD,
                'processing_status' => ProcessingStatus::Pending,
                'message_status'    => MessageStatus::WaitingResponse,
                'status'            => CommandStatus::PENDING,
                'requested_at'      => $now,
            ]);

            OutboxEvent::create([
                'aggregate_type' => 'command',
                'aggregate_id'   => $command->id,
                'event_name'     => 'command.send_data.created',
                'payload'        => ['command_id' => $command->id],
            ]);

            $log->update([
                'verification_packet_id'    => $verificationPacketId,
                'verification_sent_at'      => $now,
                'verification_expires_at'   => $now->copy()->addMinutes(self::VERIFY_TIMEOUT_MINUTES),
                'verification_command_id'   => $command->id,
            ]);

            return $log->fresh() ?? $log;
        });
    }
}
