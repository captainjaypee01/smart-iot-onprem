<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1\NodeDecommission;

use App\Models\Node;
use App\Models\NodeDecommissionLog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DecommissionNodeResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Node $node */
        $node = $this->resource;

        $network = $node->relationLoaded('network') && $node->network !== null
            ? [
                'id' => $node->network->id,
                'name' => $node->network->name,
                'network_address' => $node->network->network_address,
            ]
            : ['id' => $node->network_id];

        /** @var NodeDecommissionLog|null $latestLog */
        $latestLog = $node->relationLoaded('decommissionLogs')
            ? $node->decommissionLogs->sortByDesc('created_at')->first()
            : null;

        return [
            'id' => $node->id,
            'name' => $node->name,
            'node_address' => $node->node_address,
            'service_id' => $node->service_id,
            'status' => $node->status?->value ?? $node->status,
            'network' => $network,
            'latest_decommission_log' => $latestLog !== null
                ? [
                    'id' => $latestLog->id,
                    'status' => $latestLog->status?->value ?? $latestLog->status,
                    'is_manual' => $latestLog->is_manual,
                    'decommission_timed_out' => $latestLog->decommission_timed_out,
                    'verification_timed_out' => $latestLog->verification_timed_out,
                    'verification_sent_at' => $latestLog->verification_sent_at?->toIso8601String(),
                    'error_message' => $latestLog->error_message,
                    'created_at' => $latestLog->created_at?->toIso8601String(),
                ]
                : null,
        ];
    }
}
