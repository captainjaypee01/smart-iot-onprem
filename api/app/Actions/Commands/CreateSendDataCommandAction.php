<?php

declare(strict_types=1);

namespace App\Actions\Commands;

use App\DTO\Commands\CreateSendDataCommandDTO;
use App\Enums\MessageStatus;
use App\Enums\ProcessingStatus;
use App\Models\Command;
use App\Models\NodeType;
use App\Models\OutboxEvent;
use Illuminate\Support\Facades\DB;

class CreateSendDataCommandAction
{
    /**
     * Gateway command types that are immediately marked as GatewayResponded / Sent.
     *
     * @var list<string>
     */
    private const GATEWAY_TYPES = [
        'otap_load_scratchpad',
        'otap_process_scratchpad',
        'otap_set_target_scratchpad',
        'get_configs',
        'otap_status',
        'upload_software_update',
        'diagnostic',
        'sync_gateway_time',
        'renew_certificate',
    ];

    public function execute(CreateSendDataCommandDTO $dto): Command
    {
        $nodeAddress = strtoupper($dto->nodeAddress);
        $noPacketId = $dto->trackingMode === 'none';

        $messageStatus = $this->classifyMessageStatus($nodeAddress, $dto->destEp);
        $processingStatus = ProcessingStatus::Pending;

        return DB::transaction(function () use (
            $dto,
            $nodeAddress,
            $noPacketId,
            $messageStatus,
            $processingStatus,
        ): Command {
            // Resolve packet ID inside the transaction so that sequential
            // generation is safe under concurrent requests (lockForUpdate
            // prevents two transactions from reading the same last row).
            $packetId = match ($dto->trackingMode) {
                'none' => null,
                'auto' => $this->nextPacketId(),
                'manual' => strtoupper($dto->packetId ?? ''),
                default => null,
            };

            $command = Command::create([
                'network_id' => $dto->networkId,
                'created_by' => $dto->createdBy,
                'type' => 'send_data',
                'node_address' => $nodeAddress,
                'request_id' => random_int(100_000_000, 4_294_967_295),
                'source_ep' => $dto->sourceEp,
                'dest_ep' => $dto->destEp,
                'payload' => $dto->payload,
                'no_packet_id' => $noPacketId,
                'packet_id' => $packetId,
                'processing_status' => $processingStatus,
                'message_status' => $messageStatus,
                'retry_count' => 0,
                'requested_at' => now(),

                // Legacy columns — defaulted for Command Console commands
                'status' => 'pending',
            ]);

            OutboxEvent::create([
                'aggregate_type' => 'command',
                'aggregate_id' => $command->id,
                'event_name' => 'command.send_data.created',
                'payload' => ['command_id' => $command->id],
            ]);

            return $command;
        });
    }

    /**
     * Return the next sequential packet ID.
     *
     * Sequence: 0001 → 0002 → … → FFFE → 0001 (wraps, skipping 0000 and FFFF).
     * Must be called inside a DB transaction — the lockForUpdate prevents two
     * concurrent requests from reading the same last row and producing duplicates.
     */
    private function nextPacketId(): string
    {
        $last = Command::query()
            ->whereNotNull('packet_id')
            ->where('no_packet_id', false)
            ->orderByDesc('id')
            ->lockForUpdate()
            ->first(['packet_id']);

        $next = $last !== null ? hexdec($last->packet_id) + 1 : 1;

        // Wrap: after FFFE (65534) go back to 1. Skip 0000 and FFFF.
        if ($next > 0xFFFE) {
            $next = 1;
        }

        return strtoupper(str_pad(dechex($next), 4, '0', STR_PAD_LEFT));
    }

    /**
     * Classify message_status using the priority rules from the spec.
     *
     * Priority (first match wins):
     *  1. dest_ep = 9                              → AlarmAcknowledge
     *  2. node_address = "FFFFFFFF"               → NetworkMessage
     *  3. node_address = "FFFFFFFE"               → SinkMessage
     *  4. node_address starts "80" AND ends "FF"  → ZoneMessage
     *  5. node_address starts "80"                → ZoneGroupMessage
     *  6. node_address matches any node_types.area_id → GroupMessage
     *  7. default                                 → WaitingResponse
     */
    private function classifyMessageStatus(string $nodeAddress, ?int $destEp): MessageStatus
    {
        if ($destEp === 9) {
            return MessageStatus::AlarmAcknowledge;
        }

        if ($nodeAddress === 'FFFFFFFF') {
            return MessageStatus::NetworkMessage;
        }

        if ($nodeAddress === 'FFFFFFFE') {
            return MessageStatus::SinkMessage;
        }

        if (str_starts_with($nodeAddress, '80') && str_ends_with($nodeAddress, 'FF')) {
            return MessageStatus::ZoneMessage;
        }

        if (str_starts_with($nodeAddress, '80')) {
            return MessageStatus::ZoneGroupMessage;
        }

        // Case-insensitive match against node_types.area_id
        $isGroupAddress = NodeType::query()
            ->whereRaw('UPPER(area_id) = ?', [strtoupper($nodeAddress)])
            ->exists();

        if ($isGroupAddress) {
            return MessageStatus::GroupMessage;
        }

        return MessageStatus::WaitingResponse;
    }
}
