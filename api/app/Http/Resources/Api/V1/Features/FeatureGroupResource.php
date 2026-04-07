<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1\Features;

use App\Models\Feature;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FeatureGroupResource extends JsonResource
{
    private const LABELS = [
        'monitoring' => 'Monitoring',
        'reports' => 'Reports',
        'management' => 'Management',
        'admin' => 'Admin',
    ];

    /**
     * @return array{group:string,label:string,features:array<int,array<string,mixed>>}
     */
    public function toArray(Request $request): array
    {
        /** @var array{group:string,features:array<int,Feature>}|object $group */
        $group = $this->resource;

        $groupKey = is_array($group) ? (string) ($group['group'] ?? '') : (string) $group->group;
        $features = is_array($group) ? ($group['features'] ?? []) : ($group->features ?? []);

        $label = self::LABELS[$groupKey] ?? ucfirst($groupKey);

        $featurePayloads = [];
        foreach ($features as $feature) {
            $featurePayloads[] = (new FeatureResource($feature))->toArray($request);
        }

        return [
            'group' => $groupKey,
            'label' => $label,
            'features' => $featurePayloads,
        ];
    }
}
