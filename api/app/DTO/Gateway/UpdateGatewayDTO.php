<?php

declare(strict_types=1);

namespace App\DTO\Gateway;

readonly class UpdateGatewayDTO
{
    public function __construct(
        public string $name,
        public ?string $description,
        public bool $isTestMode,
        public ?string $serviceId = null,
        public ?string $assetId = null,
        public ?string $deviceKey = null,
        public ?string $location = null,
    ) {}
}
