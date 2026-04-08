<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1\NodeDecommission;

use App\Models\NodeDecommissionLog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NodeDecommissionLogResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var NodeDecommissionLog $log */
        $log = $this->resource;

        $node = $log->relationLoaded('node') && $log->node !== null
            ? [
                'id'           => $log->node->id,
                'name'         => $log->node->name,
                'node_address' => $log->node->node_address,
                'service_id'   => $log->node->service_id,
                'status'       => $log->node->status instanceof \BackedEnum
                    ? $log->node->status->value
                    : $log->node->status,
            ]
            : ['id' => $log->node_id];

        $network = $log->relationLoaded('network') && $log->network !== null
            ? [
                'id' => $log->network->id,
                'name' => $log->network->name,
                'network_address' => $log->network->network_address,
            ]
            : ['id' => $log->network_id];

        $initiatedBy = null;
        if ($log->initiated_by !== null) {
            $initiatedBy = $log->relationLoaded('initiatedBy') && $log->initiatedBy !== null
                ? [
                    'id' => $log->initiatedBy->id,
                    'name' => trim($log->initiatedBy->first_name.' '.$log->initiatedBy->last_name),
                ]
                : ['id' => $log->initiated_by];
        }

        return [
            'id' => $log->id,
            'node' => $node,
            'network' => $network,
            'initiated_by' => $initiatedBy,
            'status' => $log->status?->value ?? $log->status,
            'is_manual' => $log->is_manual,
            'command_id' => $log->command_id,
            'verification_command_id' => $log->verification_command_id,
            'packet_id' => $log->packet_id,
            'payload' => $log->payload,
            'verification_packet_id' => $log->verification_packet_id,
            'verification_sent_at' => $log->verification_sent_at?->toIso8601String(),
            'verification_expires_at' => $log->verification_expires_at?->toIso8601String(),
            'decommission_timed_out' => $log->decommission_timed_out,
            'verification_timed_out' => $log->verification_timed_out,
            'error_message' => $log->error_message,
            'decommissioned_at' => $log->decommissioned_at?->toIso8601String(),
            'created_at' => $log->created_at?->toIso8601String(),
            'updated_at' => $log->updated_at?->toIso8601String(),
        ];
    }
}
