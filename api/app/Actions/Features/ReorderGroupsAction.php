<?php

declare(strict_types=1);

namespace App\Actions\Features;

use App\Models\Feature;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class ReorderGroupsAction
{
    /**
     * @param array<int, array{group:string, group_order:int}> $groups
     * @return array<int, array{group:string, features: array<int, Feature>}>
     */
    public function execute(array $groups): array
    {
        foreach ($groups as $groupUpdate) {
            $groupKey = (string) $groupUpdate['group'];

            if ($groupKey === 'admin') {
                throw ValidationException::withMessages([
                    'groups' => ['The admin group cannot be reordered.'],
                ]);
            }
        }

        DB::transaction(function () use ($groups): void {
            foreach ($groups as $groupUpdate) {
                $groupKey = (string) $groupUpdate['group'];
                $groupOrder = (int) $groupUpdate['group_order'];

                Feature::query()
                    ->where('group', $groupKey)
                    ->update(['group_order' => $groupOrder]);
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

