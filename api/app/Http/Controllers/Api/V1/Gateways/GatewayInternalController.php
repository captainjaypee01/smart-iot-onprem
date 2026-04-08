<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Gateways;

use App\Actions\Gateway\UpdateGatewayLastSeenAction;
use App\Http\Controllers\Controller;
use App\Models\Gateway;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GatewayInternalController extends Controller
{
    /**
     * PATCH /internal/gateways/{gatewayId}/last-seen
     *
     * Called by the IoT service every time a message arrives from a gateway.
     * Updates last_seen_at to the current timestamp and optionally sets ip_address
     * when provided in the request body.
     *
     * Requires X-Internal-Token middleware (applied at route level).
     * Soft-deleted gateways are included — the device may still be emitting
     * MQTT heartbeats after being deleted from the platform UI.
     */
    public function updateLastSeen(Request $request, string $gatewayId): JsonResponse
    {
        $gateway = Gateway::withTrashed()->find((int) $gatewayId);

        if ($gateway === null) {
            return response()->json(['message' => 'Resource not found.'], 404);
        }

        (new UpdateGatewayLastSeenAction)->execute(
            $gateway,
            $request->input('ip_address'),
            $request->input('gateway_version'),
        );

        return response()->json([
            'data' => [
                'id' => $gateway->id,
                'gateway_id' => $gateway->gateway_id,
                'last_seen_at' => $gateway->last_seen_at?->toIso8601String(),
                'ip_address' => $gateway->ip_address,
                'gateway_version' => $gateway->gateway_version,
            ],
        ], 200);
    }
}
