<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Models\Command;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommandResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Command $command */
        $command = $this->resource;

        return [
            'id'         => $command->id,

            // Relations
            'network'    => $command->relationLoaded('network') && $command->network
                ? ['id' => $command->network->id, 'name' => $command->network->name]
                : ['id' => $command->network_id],
            'created_by' => $command->relationLoaded('createdBy') && $command->createdBy
                ? ['id' => $command->createdBy->id, 'name' => trim($command->createdBy->first_name.' '.$command->createdBy->last_name)]
                : ($command->created_by ? ['id' => $command->created_by] : null),
            'retry_by'   => $command->relationLoaded('retryBy') && $command->retryBy
                ? ['id' => $command->retryBy->id, 'name' => trim($command->retryBy->first_name.' '.$command->retryBy->last_name)]
                : ($command->retry_by ? ['id' => $command->retry_by] : null),

            // Command identity
            'type'         => $command->type,
            'node_address' => $command->node_address,
            'request_id'   => $command->request_id,

            // Addressing
            'source_ep' => $command->source_ep,
            'dest_ep'   => $command->dest_ep,

            // Payload
            'payload' => $command->payload,

            // Tracking
            'no_packet_id' => $command->no_packet_id,
            'packet_id'    => $command->packet_id,

            // Status
            'processing_status'       => $command->processing_status?->value,
            'processing_status_label' => $command->processing_status?->label(),
            'message_status'          => $command->message_status?->value,
            'message_status_label'    => $command->message_status?->label(),

            // Retry
            'retry_count' => $command->retry_count,
            'retry_at'    => $command->retry_at?->toIso8601String(),

            // Error
            'error_code'    => $command->error_code,
            'error_message' => $command->error_message,

            // Timestamps
            'requested_at'  => $command->requested_at?->toIso8601String(),
            'dispatched_at' => $command->dispatched_at?->toIso8601String(),
            'acked_at'      => $command->acked_at?->toIso8601String(),
            'completed_at'  => $command->completed_at?->toIso8601String(),
            'created_at'    => $command->created_at->toIso8601String(),
            'updated_at'    => $command->updated_at->toIso8601String(),
        ];
    }
}
