<?php

declare(strict_types=1);

namespace App\Actions\Gateway;

use App\DTO\Gateway\GatewayCommandDTO;
use App\Enums\CommandStatus;
use App\Enums\GatewayCommandType;
use App\Enums\MessageStatus;
use App\Enums\ProcessingStatus;
use App\Models\Command;
use App\Models\Gateway;
use App\Models\OutboxEvent;
use Illuminate\Support\Facades\DB;

final class CreateGatewayCommandAction
{
    public function execute(Gateway $gateway, GatewayCommandDTO $dto): Command
    {
        $gateway->loadMissing('network');

        $requestId = random_int(100_000_000, 4_294_967_295);

        // Build the JSON payload based on command type.
        $payload = match ($dto->type) {
            GatewayCommandType::RestartGateway->value => null,
            GatewayCommandType::Diagnostic->value => json_encode(
                array_filter(
                    [
                        'reqId'           => $requestId,
                        'diagnostic_type' => $dto->diagnosticType,
                        'service_name'    => $dto->serviceName,
                    ],
                    fn ($v) => $v !== null
                )
            ),
            default => null,
        };

        return DB::transaction(function () use ($gateway, $dto, $requestId, $payload): Command {
            $command = Command::create([
                'network_id'        => $gateway->network_id,
                'created_by'        => auth()->id(),
                'type'              => $dto->type,
                'node_address'      => $gateway->gateway_id,
                'request_id'        => $requestId,
                'source_ep'         => null,
                'dest_ep'           => null,
                'payload'           => $payload,
                'no_packet_id'      => true,
                'packet_id'         => null,
                'processing_status' => ProcessingStatus::Pending,
                'message_status'    => MessageStatus::GatewayResponded,
                'retry_count'       => 0,
                'requested_at'      => now(),
                'status'            => CommandStatus::PENDING,
            ]);

            OutboxEvent::create([
                'aggregate_type' => 'command',
                'aggregate_id'   => $command->id,
                'event_name'     => 'command.gateway.created',
                'payload'        => ['command_id' => $command->id],
            ]);

            return $command;
        });
    }
}
