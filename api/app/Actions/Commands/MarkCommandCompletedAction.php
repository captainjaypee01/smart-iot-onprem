<?php

declare(strict_types=1);

namespace App\Actions\Commands;

use App\Enums\CommandStatus;
use App\Models\Command;

class MarkCommandCompletedAction
{
    public function execute(string $commandId): Command
    {
        $command = Command::findOrFail($commandId);

        if (! $command->transitionTo(CommandStatus::COMPLETED)) {
            throw new \InvalidArgumentException(
                "Cannot transition command {$commandId} from {$command->status->value} to completed"
            );
        }

        return $command->fresh();
    }
}
