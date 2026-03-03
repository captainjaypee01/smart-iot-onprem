<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Actions\Commands\CreateCommandAction;
use App\DTO\Commands\CreateCommandDTO;
use App\Http\Requests\Api\V1\CreateCommandRequest;
use App\Http\Resources\Api\V1\CommandResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class CommandController extends Controller
{
    public function __construct(
        private readonly CreateCommandAction $createCommandAction
    ) {
    }

    public function store(CreateCommandRequest $request): JsonResponse
    {
        $dto = new CreateCommandDTO(
            userId: (string) $request->user()?->id,
            deviceId: $request->input('device_id'),
            type: $request->input('type'),
            payload: $request->input('payload'),
            correlationId: $request->header('X-Request-Id') ?? (string) Str::uuid(),
        );

        $command = $this->createCommandAction->execute($dto);

        return response()->json([
            'data' => new CommandResource($command),
        ], 201);
    }
}
