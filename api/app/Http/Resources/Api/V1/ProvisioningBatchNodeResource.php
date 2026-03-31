<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Models\ProvisioningBatchNode;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProvisioningBatchNodeResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var ProvisioningBatchNode $node */
        $node = $this->resource;

        return [
            'id'              => $node->id,
            'service_id'      => $node->service_id,
            'node_address'    => $node->node_address,
            'status'          => $node->status->value,
            'last_command_id' => $node->last_command_id,
            'created_at'      => $node->created_at->toIso8601String(),
        ];
    }
}
