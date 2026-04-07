<?php

declare(strict_types=1);

// app/DTO/Networks/StoreNetworkDTO.php

namespace App\DTO\Networks;

readonly class StoreNetworkDTO
{
    /**
     * @param  int[]|null  $nodeTypeIds
     */
    public function __construct(
        public string $name,
        public string $networkAddress,
        public ?string $description,
        public ?string $remarks,
        public bool $isActive,
        public int $diagnosticInterval,
        public int $alarmThreshold,
        public string $alarmThresholdUnit,
        public ?string $wirepasVersion,
        public ?string $commissionedDate,
        public bool $isMaintenance,
        public ?string $maintenanceStartAt,
        public ?string $maintenanceEndAt,
        public bool $hasMonthlyReport,
        public ?array $nodeTypeIds = null,
    ) {}
}
