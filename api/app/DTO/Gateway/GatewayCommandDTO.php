<?php

declare(strict_types=1);

namespace App\DTO\Gateway;

readonly class GatewayCommandDTO
{
    public function __construct(
        public string $type,
        public ?string $diagnosticType = null,
        public ?string $serviceName = null,
    ) {}
}
