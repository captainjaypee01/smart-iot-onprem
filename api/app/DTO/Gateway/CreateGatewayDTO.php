<?php

declare(strict_types=1);

namespace App\DTO\Gateway;

readonly class CreateGatewayDTO
{
    public function __construct(
        public int $networkId,
        public string $name,
        public ?string $description,
        public bool $isTestMode,
        public ?string $gatewayPrefix,
        public string $serviceId,
        public ?string $assetId = null,
        public ?string $deviceKey = null,
        public ?string $location = null,
    ) {}
}
