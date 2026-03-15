<?php

declare(strict_types=1);

namespace App\DTO\Commands;

use App\Enums\CommandStatus;

readonly class UpdateCommandStatusDTO
{
    public function __construct(
        public string $commandId,
        public CommandStatus $status,
        public ?string $errorCode = null,
        public ?string $errorMessage = null,
    ) {}
}
