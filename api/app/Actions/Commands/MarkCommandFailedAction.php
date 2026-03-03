<?php

declare(strict_types=1);

namespace App\Actions\Commands;

use App\DTO\Commands\UpdateCommandStatusDTO;
use App\Enums\CommandStatus;
use App\Models\Command;

class MarkCommandFailedAction
{
    public function execute(UpdateCommandStatusDTO $dto): Command
    {
        $command = Command::findOrFail($dto->commandId);

        if (! $command->status->canTransitionTo(CommandStatus::FAILED)) {
            throw new \InvalidArgumentException(
                "Cannot transition command {$dto->commandId} from {$command->status->value} to failed"
            );
        }

        $command->status = CommandStatus::FAILED;
        $command->error_code = $dto->errorCode;
        $command->error_message = $dto->errorMessage;
        $command->save();

        return $command->fresh();
    }
}
