<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\NodeDecommission;

use App\Actions\NodeDecommission\DecommissionNodeAction;
use App\Actions\NodeDecommission\ManualDecommissionAction;
use App\Actions\NodeDecommission\ResendDecommissionAction;
use App\Actions\NodeDecommission\UpdateDecommissionStatusAction;
use App\Actions\NodeDecommission\VerifyDecommissionAction;
use App\DTO\NodeDecommission\DecommissionNodeDTO;
use App\DTO\NodeDecommission\UpdateDecommissionStatusDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\NodeDecommission\DecommissionNodeRequest;
use App\Http\Requests\Api\V1\NodeDecommission\ListDecommissionHistoryRequest;
use App\Http\Requests\Api\V1\NodeDecommission\ListDecommissionNodesRequest;
use App\Http\Requests\Api\V1\NodeDecommission\UpdateDecommissionStatusRequest;
use App\Http\Resources\Api\V1\NodeDecommission\DecommissionNodeResource;
use App\Http\Resources\Api\V1\NodeDecommission\NodeDecommissionLogResource;
use App\Models\Node;
use App\Models\NodeDecommissionLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class NodeDecommissionController extends Controller
{
    public function __construct(
        private readonly DecommissionNodeAction $decommissionNode,
        private readonly ResendDecommissionAction $resendDecommission,
        private readonly VerifyDecommissionAction $verifyDecommission,
        private readonly ManualDecommissionAction $manualDecommission,
        private readonly UpdateDecommissionStatusAction $updateStatus,
    ) {}

    /**
     * GET /api/v1/node-decommission/nodes
     *
     * List decommissionable nodes (status != decommissioned) for a given network.
     */
    public function nodes(ListDecommissionNodesRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', NodeDecommissionLog::class);

        $validated = $request->validated();
        $networkId = (int) $validated['network_id'];
        $perPage = isset($validated['per_page']) ? (int) $validated['per_page'] : 15;

        $query = Node::query()
            ->with(['network', 'decommissionLogs' => function ($q): void {
                $q->orderByDesc('created_at')->limit(1);
            }])
            ->where('network_id', $networkId)
            ->decommissionable()
            ->orderBy('name');

        if (! empty($validated['search'])) {
            $search = $validated['search'];
            $query->where(function ($q) use ($search): void {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('service_id', 'ilike', "%{$search}%");
            });
        }

        if (! empty($validated['node_type_id'])) {
            $nodeTypeId = (int) $validated['node_type_id'];
            // Filter nodes whose node_config references the given node_type_id
            $query->whereHas('nodeConfig', function ($q) use ($nodeTypeId): void {
                $q->where('node_type_id', $nodeTypeId);
            });
        }

        $nodes = $query->paginate($perPage);

        return DecommissionNodeResource::collection($nodes);
    }

    /**
     * GET /api/v1/node-decommission/history
     *
     * Paginated decommission log history for a network.
     */
    public function history(ListDecommissionHistoryRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', NodeDecommissionLog::class);

        $validated = $request->validated();
        $networkId = (int) $validated['network_id'];
        $perPage = isset($validated['per_page']) ? (int) $validated['per_page'] : 15;

        $query = NodeDecommissionLog::query()
            ->with(['node', 'network', 'initiatedBy'])
            ->forNetwork($networkId)
            ->orderByDesc('created_at');

        if (! empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        $logs = $query->paginate($perPage);

        return NodeDecommissionLogResource::collection($logs);
    }

    /**
     * POST /api/v1/node-decommission/{node}/decommission
     *
     * Send a decommission command for a node.
     */
    public function decommission(DecommissionNodeRequest $request, Node $node): JsonResponse
    {
        $this->authorize('decommission', NodeDecommissionLog::class);

        $validated = $request->validated();

        // Validate network_id matches node.network_id
        if ((int) $validated['network_id'] !== (int) $node->network_id) {
            return response()->json(['message' => 'The network_id does not match the node\'s network.'], 422);
        }

        $dto = new DecommissionNodeDTO(
            networkId: (int) $validated['network_id'],
            initiatedBy: (int) $request->user()->id,
        );

        $log = $this->decommissionNode->execute($node, $dto);
        $log->load(['node', 'network', 'initiatedBy']);

        return response()->json(['data' => new NodeDecommissionLogResource($log)], HttpResponse::HTTP_CREATED);
    }

    /**
     * POST /api/v1/node-decommission/{node}/resend
     *
     * Resend the decommission command for a node whose most recent log is 'failed'.
     */
    public function resend(Node $node): JsonResponse
    {
        $this->authorize('verify', NodeDecommissionLog::class);

        $log = $this->resendDecommission->execute($node);
        $log->load(['node', 'network', 'initiatedBy']);

        return response()->json(['data' => new NodeDecommissionLogResource($log)], HttpResponse::HTTP_CREATED);
    }

    /**
     * POST /api/v1/node-decommission/{node}/verify
     *
     * Send a verification command for a node in pending decommission state.
     */
    public function verify(Node $node): JsonResponse
    {
        $this->authorize('verify', NodeDecommissionLog::class);

        $log = $this->verifyDecommission->execute($node);
        $log->load(['node', 'network', 'initiatedBy']);

        return response()->json(['data' => new NodeDecommissionLogResource($log)]);
    }

    /**
     * POST /api/v1/node-decommission/{node}/manual
     *
     * Manually mark a node as decommissioned without sending an IoT command.
     */
    public function manual(Node $node): JsonResponse
    {
        $this->authorize('manualDecommission', NodeDecommissionLog::class);

        /** @var \App\Models\User $user */
        $user = request()->user();
        $log = $this->manualDecommission->execute($node, (int) $user->id);
        $log->load(['node', 'network', 'initiatedBy']);

        return response()->json(['data' => new NodeDecommissionLogResource($log)], HttpResponse::HTTP_CREATED);
    }

    /**
     * PATCH /api/v1/internal/node-decommission/{log}/status
     *
     * Internal endpoint — called by the IoT service after receiving an MQTT ack.
     * Protected by X-Internal-Token middleware (applied at route level).
     */
    public function updateStatus(UpdateDecommissionStatusRequest $request, NodeDecommissionLog $log): JsonResponse
    {
        $validated = $request->validated();

        $dto = new UpdateDecommissionStatusDTO(
            result: $validated['result'],
            commandType: $validated['command_type'],
            errorMessage: $validated['error_message'] ?? null,
        );

        $updated = $this->updateStatus->execute($log, $dto);
        $updated->load(['node', 'network', 'initiatedBy']);

        return response()->json(['data' => new NodeDecommissionLogResource($updated)]);
    }
}
