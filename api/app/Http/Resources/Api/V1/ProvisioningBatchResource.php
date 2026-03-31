<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Models\ProvisioningBatch;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProvisioningBatchResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var ProvisioningBatch $batch */
        $batch = $this->resource;

        return [
            'id'               => $batch->id,
            'network'          => $this->whenLoaded('network', fn () => [
                'id'              => $batch->network->id,
                'name'            => $batch->network->name,
                'network_address' => $batch->network->network_address,
            ]),
            'submitted_by'     => $this->whenLoaded('submittedBy', fn () => $batch->submittedBy !== null
                ? [
                    'id'   => $batch->submittedBy->id,
                    'name' => $batch->submittedBy->name,
                ]
                : null
            ),
            'status'           => $batch->status->value,
            'total_nodes'      => $batch->total_nodes,
            'provisioned_nodes' => $batch->provisioned_nodes,
            'status_summary'   => "{$batch->provisioned_nodes}/{$batch->total_nodes} provisioned",
            'nodes'            => $this->whenLoaded('nodes', fn () => ProvisioningBatchNodeResource::collection($batch->nodes)),
            'created_at'       => $batch->created_at->toIso8601String(),
        ];
    }
}
