<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1\Features;

use App\Models\Feature;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FeatureResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Feature $feature */
        $feature = $this->resource;

        return [
            'id' => $feature->id,
            'key' => $feature->key,
            'name' => $feature->name,
            'group' => $feature->group,
            'group_order' => (int) $feature->group_order,
            'route' => $feature->route,
            'icon' => $feature->icon,
            'sort_order' => (int) $feature->sort_order,
            'is_active' => (bool) $feature->is_active,
            'created_at' => $feature->created_at?->toIso8601String(),
            'updated_at' => $feature->updated_at?->toIso8601String(),
        ];
    }
}

