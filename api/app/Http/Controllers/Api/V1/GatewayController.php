<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Actions\Gateway\CreateGatewayAction;
use App\Actions\Gateway\CreateGatewayCommandAction;
use App\Actions\Gateway\DeleteGatewayAction;
use App\Actions\Gateway\UpdateGatewayAction;
use App\DTO\Gateway\CreateGatewayDTO;
use App\DTO\Gateway\GatewayCommandDTO;
use App\DTO\Gateway\UpdateGatewayDTO;
use App\Http\Requests\Api\V1\Gateway\SendGatewayCommandRequest;
use App\Http\Requests\Api\V1\Gateway\StoreGatewayRequest;
use App\Http\Requests\Api\V1\Gateway\UpdateGatewayRequest;
use App\Http\Resources\Api\V1\CommandResource;
use App\Http\Resources\Api\V1\Gateways\GatewayCollection;
use App\Http\Resources\Api\V1\Gateways\GatewayResource;
use App\Models\Gateway;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class GatewayController extends Controller
{
    /**
     * GET /api/v1/gateways
     *
     * List all gateways with optional filters and server-side pagination.
     */
    public function index(Request $request): GatewayCollection
    {
        $this->authorize('viewAny', Gateway::class);

        $threshold = (int) config('iot.gateway_online_threshold_minutes', 10);

        $query = Gateway::query()->with('network');

        if ($request->filled('network_id')) {
            $query->where('network_id', $request->integer('network_id'));
        }

        if ($request->has('is_test_mode')) {
            $query->where('is_test_mode', $request->boolean('is_test_mode'));
        }

        if ($request->filled('status')) {
            $status = $request->string('status')->toString();
            $cutoff = now()->subMinutes($threshold);

            match ($status) {
                'online' => $query->where('last_seen_at', '>=', $cutoff),
                'offline' => $query->whereNotNull('last_seen_at')->where('last_seen_at', '<', $cutoff),
                'unknown' => $query->whereNull('last_seen_at'),
                default => null,
            };
        }

        $gateways = $query
            ->orderBy('created_at', 'desc')
            ->paginate($request->integer('per_page', 15));

        return new GatewayCollection($gateways);
    }

    /**
     * GET /api/v1/gateways/{id}
     *
     * Retrieve a single gateway.
     */
    public function show(Gateway $gateway): GatewayResource
    {
        $this->authorize('view', $gateway);

        return new GatewayResource($gateway->load('network'));
    }

    /**
     * POST /api/v1/gateways
     *
     * Create a new gateway. gateway_prefix is handled outside validated()
     * because it is conditionally required based on network state.
     */
    public function store(StoreGatewayRequest $request): JsonResponse
    {
        $this->authorize('create', Gateway::class);

        $dto = new CreateGatewayDTO(
            networkId:     $request->integer('network_id'),
            name:          $request->string('name')->toString(),
            description:   $request->input('description'),
            isTestMode:    $request->boolean('is_test_mode', false),
            gatewayPrefix: $request->input('gateway_prefix'),
            serviceId:     $request->string('service_id')->toString(),
            assetId:       $request->input('asset_id'),
            deviceKey:     $request->input('device_key'),
            location:      $request->input('location'),
        );

        $gateway = (new CreateGatewayAction)->execute($dto);

        return response()->json(
            new GatewayResource($gateway),
            HttpResponse::HTTP_CREATED
        );
    }

    /**
     * PATCH /api/v1/gateways/{id}
     *
     * Partial update of editable fields. Falls back to existing values for
     * any field not present in the request (because UpdateGatewayAction fills
     * all three fields unconditionally).
     */
    public function update(UpdateGatewayRequest $request, Gateway $gateway): GatewayResource
    {
        $this->authorize('update', $gateway);

        $validated = $request->validated();

        $dto = new UpdateGatewayDTO(
            name:        $validated['name'] ?? $gateway->name,
            description: array_key_exists('description', $validated) ? $validated['description'] : $gateway->description,
            isTestMode:  $validated['is_test_mode'] ?? $gateway->is_test_mode,
            serviceId:   array_key_exists('service_id', $validated) ? $validated['service_id'] : $gateway->service_id,
            assetId:     array_key_exists('asset_id', $validated) ? $validated['asset_id'] : $gateway->asset_id,
            deviceKey:   array_key_exists('device_key', $validated) ? $validated['device_key'] : $gateway->device_key,
            location:    array_key_exists('location', $validated) ? $validated['location'] : $gateway->location,
        );

        $updated = (new UpdateGatewayAction)->execute($gateway, $dto);

        return new GatewayResource($updated);
    }

    /**
     * DELETE /api/v1/gateways/{id}
     *
     * Soft-delete a gateway.
     */
    public function destroy(Gateway $gateway): JsonResponse
    {
        $this->authorize('delete', $gateway);

        (new DeleteGatewayAction)->execute($gateway);

        return response()->json([], HttpResponse::HTTP_NO_CONTENT);
    }

    /**
     * POST /api/v1/gateways/{id}/commands
     *
     * Send a command to a specific gateway. Writes to the shared commands
     * table and enters the outbox/dispatch pipeline.
     */
    public function sendCommand(SendGatewayCommandRequest $request, Gateway $gateway): JsonResponse
    {
        $this->authorize('sendCommand', $gateway);

        $dto = new GatewayCommandDTO(
            type:           $request->validated('type'),
            diagnosticType: $request->validated('diagnostic_type'),
            serviceName:    $request->validated('service_name'),
        );

        $command = (new CreateGatewayCommandAction)->execute($gateway, $dto);

        return (new CommandResource($command))
            ->response()
            ->setStatusCode(HttpResponse::HTTP_CREATED);
    }
}
