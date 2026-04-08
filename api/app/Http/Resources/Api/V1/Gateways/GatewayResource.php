<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1\Gateways;

use App\Models\Gateway;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GatewayResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Gateway $gateway */
        $gateway = $this->resource;

        return [
            'id' => $gateway->id,
            'network_id' => $gateway->network_id,
            'network' => $this->whenLoaded(
                'network',
                fn (): array => [
                    'id' => $gateway->network->id,
                    'name' => $gateway->network->name,
                    'network_address' => $gateway->network->network_address,
                ]
            ),
            'gateway_id' => $gateway->gateway_id,
            'sink_id' => $gateway->sink_id,
            'service_id' => $gateway->service_id,
            'asset_id' => $gateway->asset_id,
            'device_key' => $gateway->device_key,
            'location' => $gateway->location,
            'ip_address' => $gateway->ip_address,
            'gateway_version' => $gateway->gateway_version,
            'name' => $gateway->name,
            'description' => $gateway->description,
            'is_test_mode' => $gateway->is_test_mode,
            'status' => $gateway->status->value,
            'last_seen_at' => $gateway->last_seen_at?->toIso8601String(),
            'created_at' => $gateway->created_at?->toIso8601String(),
            'updated_at' => $gateway->updated_at?->toIso8601String(),
        ];
    }
}
