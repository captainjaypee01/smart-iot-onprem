<?php

declare(strict_types=1);

namespace App\Actions\NodeTypes;

use App\DTO\NodeTypes\UpdateNodeTypeDTO;
use App\Models\NodeType;

class UpdateNodeTypeAction
{
    public function execute(NodeType $nodeType, UpdateNodeTypeDTO $dto): NodeType
    {
        if ($dto->name !== null) {
            $nodeType->name = $dto->name;
        }

        if ($dto->areaId !== null) {
            $nodeType->area_id = strtoupper($dto->areaId);
        }

        if ($dto->description !== null) {
            $nodeType->description = $dto->description;
        }

        if ($dto->hasSensors) {
            $sensors = $dto->sensors ?? [];
            $this->applySensors($nodeType, $sensors);
        }

        $nodeType->save();

        return $nodeType;
    }

    /**
     * @param  array<int, array{name: string, unit?: string|null}>  $sensors
     */
    private function applySensors(NodeType $nodeType, array $sensors): void
    {
        for ($slot = 1; $slot <= 8; $slot++) {
            $index = $slot - 1;
            $nameColumn = "sensor_{$slot}_name";
            $unitColumn = "sensor_{$slot}_unit";

            if (array_key_exists($index, $sensors)) {
                $nodeType->{$nameColumn} = $sensors[$index]['name'];
                $nodeType->{$unitColumn} = $sensors[$index]['unit'] ?? null;
            } else {
                $nodeType->{$nameColumn} = null;
                $nodeType->{$unitColumn} = null;
            }
        }
    }
}
