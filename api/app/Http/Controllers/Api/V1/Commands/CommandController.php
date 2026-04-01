<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Commands;

use App\Actions\Commands\CreateSendDataCommandAction;
use App\Actions\Commands\ResendCommandAction;
use App\DTO\Commands\CreateSendDataCommandDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Commands\CreateSendDataCommandRequest;
use App\Http\Resources\Api\V1\CommandResource;
use App\Models\Command;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

class CommandController extends Controller
{
    public function __construct(
        private readonly CreateSendDataCommandAction $createAction,
        private readonly ResendCommandAction $resendAction,
    ) {}

    /**
     * GET /api/v1/commands
     *
     * List send_data command history (excludes node_provisioning type).
     * Scoped to the authenticated user's accessible networks.
     */
    public function index(Request $request): AnonymousResourceCollection|JsonResponse
    {
        Gate::authorize('viewAny', Command::class);

        $perPage = min(100, max(1, (int) $request->input('per_page', 15)));

        $commands = Command::query()
            ->with(['network', 'createdBy', 'retryBy'])
            ->forUser($request->user())
            ->excludeNodeProvisioning()
            ->when(
                $request->filled('network_id'),
                fn ($q) => $q->where('network_id', (int) $request->input('network_id'))
            )
            ->when(
                $request->filled('processing_status'),
                fn ($q) => $q->where('processing_status', (int) $request->input('processing_status'))
            )
            ->when(
                $request->filled('message_status'),
                fn ($q) => $q->where('message_status', (int) $request->input('message_status'))
            )
            ->when(
                $request->filled('node_address'),
                fn ($q) => $q->whereRaw('UPPER(node_address) = ?', [strtoupper((string) $request->input('node_address'))])
            )
            ->when(
                $request->filled('date_from'),
                fn ($q) => $q->whereDate('created_at', '>=', $request->input('date_from'))
            )
            ->when(
                $request->filled('date_to'),
                fn ($q) => $q->whereDate('created_at', '<=', $request->input('date_to'))
            )
            ->latest()
            ->paginate($perPage);

        return CommandResource::collection($commands);
    }

    /**
     * GET /api/v1/commands/{command}
     *
     * Fetch a single command by ID.
     * Scoped: non-superadmins can only view commands on their accessible networks.
     */
    public function show(Request $request, Command $command): JsonResponse
    {
        Gate::authorize('view', $command);

        $command->load(['network', 'createdBy', 'retryBy']);

        return response()->json(['data' => new CommandResource($command)]);
    }

    /**
     * POST /api/v1/commands
     *
     * Create and send a send_data command.
     */
    public function store(CreateSendDataCommandRequest $request): JsonResponse
    {
        Gate::authorize('create', Command::class);

        $dto = new CreateSendDataCommandDTO(
            networkId:   (int) $request->validated('network_id'),
            createdBy:   $request->user()->id,
            nodeAddress: (string) $request->validated('node_address'),
            sourceEp:    $request->filled('source_ep') ? (int) $request->validated('source_ep') : null,
            destEp:      $request->filled('dest_ep') ? (int) $request->validated('dest_ep') : null,
            payload:     $request->filled('payload') ? (string) $request->validated('payload') : null,
            trackingMode: (string) $request->validated('include_tracking_id'),
            packetId:     $request->filled('packet_id') ? (string) $request->validated('packet_id') : null,
        );

        $command = $this->createAction->execute($dto);
        $command->load(['network', 'createdBy', 'retryBy']);

        return response()->json(['data' => new CommandResource($command)], Response::HTTP_CREATED);
    }

    /**
     * POST /api/v1/commands/{command}/resend
     *
     * Resend an existing send_data command. Only the creator (or superadmin) may resend.
     */
    public function resend(Request $request, Command $command): JsonResponse
    {
        Gate::authorize('resend', $command);

        $updatedCommand = $this->resendAction->execute($command, $request->user()->id);
        $updatedCommand->load(['network', 'createdBy', 'retryBy']);

        return response()->json(['data' => new CommandResource($updatedCommand)]);
    }
}
