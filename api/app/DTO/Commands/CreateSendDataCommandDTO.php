<?php

declare(strict_types=1);

namespace App\DTO\Commands;

readonly class CreateSendDataCommandDTO
{
    public function __construct(
        public int $networkId,
        public int $createdBy,
        public string $nodeAddress,
        public ?int $sourceEp,
        public ?int $destEp,
        public ?string $payload,
        public string $trackingMode,
        public ?string $packetId,
    ) {}
}
