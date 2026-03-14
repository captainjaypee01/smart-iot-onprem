<?php

declare(strict_types=1);

namespace App\DTO\Settings;

readonly class UpdateSessionSettingsDTO
{
    public function __construct(
        public string $sessionLifetimeMinutes,
        public ?int $companyId,
    ) {}
}
