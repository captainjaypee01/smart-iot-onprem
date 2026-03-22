<?php

declare(strict_types=1);

namespace App\Actions\Features;

use App\Models\Feature;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;

class ReorderFeaturesAction
{
    /**
     * @param array<int, array{id:int, sort_order:int}> $features
     * @return array<int, array{group:string, features: array<int, Feature>}>
     */
    public function execute(array $features): array
    {
        DB::transaction(function () use ($features): void {
            foreach ($features as $featureUpdate) {
                $id = (int) $featureUpdate['id'];
                $sortOrder = (int) $featureUpdate['sort_order'];

                Feature::query()
                    ->where('id', $id)
                    ->update(['sort_order' => $sortOrder]);
            }
        });

        return $this->groupFeatures();
    }

    /**
     * Group all features by `group`, preserving group order (group_order ASC)
     * and feature order within group (sort_order ASC).
     *
     * @return array<int, array{group:string, features: array<int, Feature>}>
     */
    private function groupFeatures(): array
    {
        /** @var Collection<int, Feature> $features */
        $features = Feature::query()
            ->orderBy('group_order')
            ->orderBy('sort_order')
            ->get();

        $groups = [];

        foreach ($features as $feature) {
            $groupKey = (string) $feature->group;

            if (! isset($groups[$groupKey])) {
                $groups[$groupKey] = [
                    'group' => $groupKey,
                    'features' => [],
                ];
            }

            $groups[$groupKey]['features'][] = $feature;
        }

        return array_values($groups);
    }
}

