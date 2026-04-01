<?php

declare(strict_types=1);

namespace App\DTO\Commands;

readonly class CreateCommandDTO
{
    public function __construct(
        public ?string $userId,
        public int $networkId,
        public ?string $deviceId,
        public string $type,
        public ?string $payload,
    ) {}
}
