<?php

declare(strict_types=1);

// app/Http/Resources/Api/V1/Networks/NetworkResource.php

namespace App\Http\Resources\Api\V1\Networks;

use App\Models\Network;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NetworkResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Network $network */
        $network = $this->resource;

        $nodeTypes = $network->nodeTypes
            ->map(static function ($nodeType): array {
                return [
                    'id' => $nodeType->id,
                    'name' => $nodeType->name,
                    'area_id' => $nodeType->area_id,
                ];
            })
            ->all();

        return [
            'id' => $network->id,
            'name' => $network->name,
            'network_address' => $network->network_address,
            'description' => $network->description,
            'remarks' => $network->remarks,
            'is_active' => (bool) $network->is_active,
            'diagnostic_interval' => (int) $network->diagnostic_interval,
            'alarm_threshold' => (int) $network->alarm_threshold,
            'alarm_threshold_unit' => $network->alarm_threshold_unit,
            'wirepas_version' => $network->wirepas_version,
            'commissioned_date' => $network->commissioned_date?->format('Y-m-d'),
            'is_maintenance' => (bool) $network->is_maintenance,
            'maintenance_start_at' => $network->maintenance_start_at?->toIso8601String(),
            'maintenance_end_at' => $network->maintenance_end_at?->toIso8601String(),
            'has_monthly_report' => (bool) $network->has_monthly_report,
            'node_types' => $nodeTypes,
            'created_at' => $network->created_at?->toIso8601String(),
            'updated_at' => $network->updated_at?->toIso8601String(),
        ];
    }
}
