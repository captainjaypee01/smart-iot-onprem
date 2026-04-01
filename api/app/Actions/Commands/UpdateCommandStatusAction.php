<?php

declare(strict_types=1);

namespace App\Actions\Commands;

use App\Enums\MessageStatus;
use App\Enums\ProcessingStatus;
use App\Models\Command;
use Symfony\Component\HttpKernel\Exception\HttpException;

class UpdateCommandStatusAction
{
    /**
     * Update the command's processing_status and related fields from an IoT service callback.
     *
     * Idempotency rule: if the command is already in Failed (terminal), reject with 409.
     *
     * @param  array{processing_status: int, message_status: int|null, error_message: string|null, acked_at: string|null, dispatched_at: string|null}  $data
     */
    public function execute(Command $command, array $data): Command
    {
        $newProcessingStatus = ProcessingStatus::from((int) $data['processing_status']);

        // Guard: terminal Failed state must not be overwritten
        if (
            $command->processing_status instanceof ProcessingStatus
            && $command->processing_status->isTerminal()
        ) {
            throw new HttpException(409, 'Command is in a terminal Failed state and cannot be updated.');
        }

        $updates = [
            'processing_status' => $newProcessingStatus,
        ];

        if (array_key_exists('message_status', $data) && $data['message_status'] !== null) {
            $updates['message_status'] = MessageStatus::from((int) $data['message_status']);
        }

        if (array_key_exists('error_message', $data)) {
            $updates['error_message'] = $data['error_message'];
        }

        if (! empty($data['acked_at'])) {
            $updates['acked_at'] = $data['acked_at'];
        }

        if (! empty($data['dispatched_at'])) {
            $updates['dispatched_at'] = $data['dispatched_at'];
        }

        // Set completed_at when transitioning to Sent (from IoT ack) or Failed
        if (
            $newProcessingStatus === ProcessingStatus::Sent
            || $newProcessingStatus === ProcessingStatus::Failed
        ) {
            $updates['completed_at'] = now();
        }

        $command->update($updates);

        return $command->refresh();
    }
}
