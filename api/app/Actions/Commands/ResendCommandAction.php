<?php

declare(strict_types=1);

namespace App\Actions\Commands;

use App\Enums\ProcessingStatus;
use App\Models\Command;
use App\Models\OutboxEvent;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

class ResendCommandAction
{
    private const MAX_RETRIES = 3;

    public function execute(Command $command, int $userId): Command
    {
        $this->validateResendEligibility($command);

        return DB::transaction(function () use ($command, $userId): Command {
            $command->update([
                'retry_count'       => $command->retry_count + 1,
                'retry_at'          => now(),
                'retry_by'          => $userId,
                'processing_status' => ProcessingStatus::Pending,
            ]);

            OutboxEvent::create([
                'aggregate_type' => 'command',
                'aggregate_id'   => $command->id,
                'event_name'     => 'command.send_data.resend',
                'payload'        => ['command_id' => $command->id],
            ]);

            return $command->refresh();
        });
    }

    private function validateResendEligibility(Command $command): void
    {
        if ($command->type !== 'send_data') {
            throw new HttpException(422, 'Only send_data commands can be resent.');
        }

        if ($command->retry_count >= self::MAX_RETRIES) {
            throw new HttpException(422, 'Maximum retry limit (3) has been reached for this command.');
        }

        if ($command->processing_status === ProcessingStatus::Failed) {
            throw new HttpException(422, 'This command has already reached a terminal Failed state and cannot be resent.');
        }
    }
}
