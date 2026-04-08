<?php

declare(strict_types=1);

namespace App\DTO\NodeDecommission;

final readonly class UpdateDecommissionStatusDTO
{
    public function __construct(
        public string $result,
        public string $commandType,
        public ?string $errorMessage,
    ) {}
}
