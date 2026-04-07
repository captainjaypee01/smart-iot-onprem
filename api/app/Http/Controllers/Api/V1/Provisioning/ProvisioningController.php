<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Provisioning;

use App\Actions\Provisioning\StoreProvisioningBatchAction;
use App\DTO\Provisioning\StoreProvisioningBatchDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Provisioning\StoreProvisioningBatchRequest;
use App\Http\Resources\Api\V1\ProvisioningBatchResource;
use App\Models\ProvisioningBatch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class ProvisioningController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection|JsonResponse
    {
        if (! $request->user()?->is_superadmin) {
            return response()->json(['message' => 'Forbidden.'], Response::HTTP_FORBIDDEN);
        }

        $perPage = min(100, max(1, (int) $request->input('per_page', 15)));

        $batches = ProvisioningBatch::query()
            ->with(['network', 'submittedBy'])
            ->when($request->filled('network_id'), fn ($q) => $q->where('network_id', (int) $request->input('network_id')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->latest()
            ->paginate($perPage);

        return ProvisioningBatchResource::collection($batches);
    }

    public function show(Request $request, ProvisioningBatch $provisioningBatch): ProvisioningBatchResource|JsonResponse
    {
        if (! $request->user()?->is_superadmin) {
            return response()->json(['message' => 'Forbidden.'], Response::HTTP_FORBIDDEN);
        }

        $provisioningBatch->load(['network', 'submittedBy', 'nodes']);

        return new ProvisioningBatchResource($provisioningBatch);
    }

    public function store(StoreProvisioningBatchRequest $request, StoreProvisioningBatchAction $action): JsonResponse
    {
        $dto = new StoreProvisioningBatchDTO(
            networkId: (int) $request->validated('network_id'),
            submittedBy: $request->user()->id,
            targetNodeId: $request->validated('target_node_id'),
            isAutoRegister: $request->boolean('is_auto_register', false),
            nodes: $request->validated('nodes'),
        );

        $result = $action->execute($dto);

        return response()->json([
            'data' => [
                'primary' => new ProvisioningBatchResource($result['primary']),
                'broadcast' => new ProvisioningBatchResource($result['broadcast']),
            ],
        ], Response::HTTP_CREATED);
    }
}
