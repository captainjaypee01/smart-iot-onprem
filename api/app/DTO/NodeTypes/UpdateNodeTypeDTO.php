<?php

declare(strict_types=1);

// app/DTO/NodeTypes/UpdateNodeTypeDTO.php

namespace App\DTO\NodeTypes;

/**
 * @phpstan-type SensorSlot array{name: string, unit?: string|null}
 */
readonly class UpdateNodeTypeDTO
{
    /**
     * @param SensorSlot[]|null $sensors
     */
    public function __construct(
        public ?string $name = null,
        public ?string $areaId = null,
        public ?string $description = null,
        public bool $hasSensors = false,
        public ?array $sensors = null,
    ) {}
}

