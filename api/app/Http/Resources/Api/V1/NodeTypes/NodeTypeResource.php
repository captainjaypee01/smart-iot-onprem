<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1\NodeTypes;

use App\Models\NodeType;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NodeTypeResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var NodeType $nodeType */
        $nodeType = $this->resource;

        $sensors = [];

        for ($slot = 1; $slot <= 8; $slot++) {
            $nameColumn = "sensor_{$slot}_name";
            $unitColumn = "sensor_{$slot}_unit";

            $name = $nodeType->{$nameColumn};

            if ($name !== null) {
                $sensors[] = [
                    'slot' => $slot,
                    'name' => $name,
                    'unit' => $nodeType->{$unitColumn},
                ];
            }
        }

        return [
            'id' => $nodeType->id,
            'name' => $nodeType->name,
            'area_id' => $nodeType->area_id,
            'description' => $nodeType->description,
            'sensors' => $sensors,
            'sensor_count' => count($sensors),
            'created_at' => $nodeType->created_at->toIso8601String(),
            'updated_at' => $nodeType->updated_at->toIso8601String(),
        ];
    }
}

