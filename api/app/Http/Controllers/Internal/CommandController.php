<?php

declare(strict_types=1);

namespace App\Http\Controllers\Internal;

use App\Actions\Commands\MarkCommandAckedAction;
use App\Actions\Commands\MarkCommandCompletedAction;
use App\Actions\Commands\MarkCommandDispatchedAction;
use App\Actions\Commands\MarkCommandFailedAction;
use App\DTO\Commands\UpdateCommandStatusDTO;
use App\Enums\CommandStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\CommandResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CommandController extends Controller
{
    public function __construct(
        private readonly MarkCommandDispatchedAction $markDispatchedAction,
        private readonly MarkCommandAckedAction $markAckedAction,
        private readonly MarkCommandCompletedAction $markCompletedAction,
        private readonly MarkCommandFailedAction $markFailedAction,
    ) {
    }

    public function markDispatched(string $id): JsonResponse
    {
        $command = $this->markDispatchedAction->execute($id);

        return response()->json([
            'data' => new CommandResource($command),
        ]);
    }

    public function markAcked(string $id): JsonResponse
    {
        $command = $this->markAckedAction->execute($id);

        return response()->json([
            'data' => new CommandResource($command),
        ]);
    }

    public function markCompleted(string $id): JsonResponse
    {
        $command = $this->markCompletedAction->execute($id);

        return response()->json([
            'data' => new CommandResource($command),
        ]);
    }

    public function markFailed(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'error_code' => ['nullable', 'string', 'max:255'],
            'error_message' => ['nullable', 'string'],
        ]);

        $dto = new UpdateCommandStatusDTO(
            commandId: $id,
            status: CommandStatus::FAILED,
            errorCode: $validated['error_code'] ?? null,
            errorMessage: $validated['error_message'] ?? null,
        );

        $command = $this->markFailedAction->execute($dto);

        return response()->json([
            'data' => new CommandResource($command),
        ]);
    }
}
