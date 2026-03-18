<?php

declare(strict_types=1);

namespace App\Actions\NodeTypes;

use App\DTO\NodeTypes\StoreNodeTypeDTO;
use App\Models\NodeType;

class StoreNodeTypeAction
{
    public function execute(StoreNodeTypeDTO $dto): NodeType
    {
        $nodeType = new NodeType();
        $nodeType->name = $dto->name;
        $nodeType->area_id = strtoupper($dto->areaId);
        $nodeType->description = $dto->description;

        $this->applySensors($nodeType, $dto->sensors);

        $nodeType->save();

        return $nodeType;
    }

    /**
     * @param array<int, array{name: string, unit?: string|null}> $sensors
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

