<?php

// app/DTO/Companies/UpdateCompanyDTO.php

declare(strict_types=1);

namespace App\DTO\Companies;

use App\Enums\AlarmThresholdUnit;

final readonly class UpdateCompanyDTO
{
    public function __construct(
        public ?string $name,
        public ?string $code,
        public ?string $address,
        public ?string $contactEmail,
        public ?string $contactPhone,
        public ?string $timezone,
        public ?int $loginAttempts,
        public ?bool $is2faEnforced,
        public ?bool $isDemo,
        public ?bool $isActiveZone,
        public ?bool $isActive,
        public ?int $customAlarmThreshold,
        public AlarmThresholdUnit|string|null $customAlarmThresholdUnit,
        /**
         * @var int[]|null
         */
        public ?array $networkIds,
    ) {}
}
