<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1;

use App\Models\Command;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommandResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Command $command */
        $command = $this->resource;

        return [
            'id' => $command->id,
            'user_id' => $command->user_id,
            'network_id' => $command->network_id,
            'device_id' => $command->device_id,
            'type' => $command->type,
            'payload' => $command->payload,
            'status' => $command->status->value,
            'correlation_id' => $command->correlation_id,
            'requested_at' => $command->requested_at?->toIso8601String(),
            'dispatched_at' => $command->dispatched_at?->toIso8601String(),
            'acked_at' => $command->acked_at?->toIso8601String(),
            'completed_at' => $command->completed_at?->toIso8601String(),
            'error_code' => $command->error_code,
            'error_message' => $command->error_message,
            'created_at' => $command->created_at->toIso8601String(),
            'updated_at' => $command->updated_at->toIso8601String(),
        ];
    }
}
