<?php

declare(strict_types=1);

// app/DTO/NodeTypes/StoreNodeTypeDTO.php

namespace App\DTO\NodeTypes;

/**
 * @phpstan-type SensorSlot array{name: string, unit?: string|null}
 */
readonly class StoreNodeTypeDTO
{
    /**
     * @param SensorSlot[] $sensors
     */
    public function __construct(
        public string $name,
        public string $areaId,
        public ?string $description,
        public array $sensors = [],
    ) {}
}

