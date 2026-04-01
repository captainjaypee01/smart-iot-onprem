<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Commands;

use App\Actions\Commands\UpdateCommandStatusAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Commands\UpdateCommandStatusRequest;
use App\Http\Resources\Api\V1\CommandResource;
use App\Models\Command;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpKernel\Exception\HttpException;

class InternalCommandController extends Controller
{
    public function __construct(
        private readonly UpdateCommandStatusAction $updateStatusAction,
    ) {}

    /**
     * PATCH /api/v1/internal/commands/{command}/status
     *
     * Called by the IoT service after receiving an MQTT ack or error.
     * Requires X-Internal-Token middleware (applied at route level).
     */
    public function updateStatus(UpdateCommandStatusRequest $request, string $commandId): JsonResponse
    {
        $command = Command::find($commandId);

        if ($command === null) {
            return response()->json(['message' => 'Resource not found.'], 404);
        }

        try {
            $updated = $this->updateStatusAction->execute($command, $request->validated());
        } catch (HttpException $e) {
            return response()->json(['message' => $e->getMessage()], $e->getStatusCode());
        }

        $updated->load(['network', 'createdBy', 'retryBy']);

        return response()->json(['data' => new CommandResource($updated)]);
    }
}
