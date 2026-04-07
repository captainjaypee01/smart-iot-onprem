<?php

declare(strict_types=1);

namespace App\Actions\Features;

use App\DTO\Features\StoreFeatureDTO;
use App\Models\Feature;

final class StoreFeatureAction
{
    public function execute(StoreFeatureDTO $dto): Feature
    {
        $feature = Feature::create([
            'key' => $dto->key,
            'name' => $dto->name,
            'group' => $dto->group,
            'group_order' => $dto->groupOrder,
            'route' => $dto->route,
            'icon' => $dto->icon,
            'sort_order' => $dto->sortOrder,
            'is_active' => $dto->isActive,
        ]);

        return $feature->refresh();
    }
}
