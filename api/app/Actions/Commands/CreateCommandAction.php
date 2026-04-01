<?php

declare(strict_types=1);

namespace App\Actions\Commands;

use App\DTO\Commands\CreateCommandDTO;
use App\Enums\CommandStatus;
use App\Models\Command;
use App\Models\OutboxEvent;
use Illuminate\Support\Facades\DB;

class CreateCommandAction
{
    public function execute(CreateCommandDTO $dto): Command
    {
        return DB::transaction(function () use ($dto) {
            $command = Command::create([
                'user_id' => $dto->userId,
                'network_id' => $dto->networkId,
                'device_id' => $dto->deviceId,
                'type' => $dto->type,
                'payload' => $dto->payload,
                'status' => CommandStatus::PENDING,
                'correlation_id' => $dto->correlationId,
                'requested_at' => now(),
            ]);

            // Create outbox event atomically
            OutboxEvent::create([
                'aggregate_type' => 'command',
                'aggregate_id' => $command->id,
                'event_name' => 'command.created',
                'payload' => [
                    'command_id' => $command->id,
                    'type' => $command->type,
                    'network_id' => $command->network_id,
                    'device_id' => $command->device_id,
                    'correlation_id' => $command->correlation_id,
                    'payload' => $command->payload,
                ],
            ]);

            return $command;
        });
    }
}
