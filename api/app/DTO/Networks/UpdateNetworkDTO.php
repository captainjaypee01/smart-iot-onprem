<?php

declare(strict_types=1);

// app/DTO/Networks/UpdateNetworkDTO.php

namespace App\DTO\Networks;

readonly class UpdateNetworkDTO
{
    /**
     * @param  int[]|null  $nodeTypeIds
     */
    public function __construct(
        public ?string $name = null,
        public ?string $networkAddress = null,
        public ?string $description = null,
        public ?string $remarks = null,
        public ?bool $isActive = null,
        public ?int $diagnosticInterval = null,
        public ?int $alarmThreshold = null,
        public ?string $alarmThresholdUnit = null,
        public ?string $wirepasVersion = null,
        public ?string $commissionedDate = null,
        public ?bool $isMaintenance = null,
        public ?string $maintenanceStartAt = null,
        public ?string $maintenanceEndAt = null,
        public ?bool $hasMonthlyReport = null,
        public bool $hasNodeTypes = false,
        public ?array $nodeTypeIds = null,
    ) {}
}
