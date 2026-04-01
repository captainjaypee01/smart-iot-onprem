<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Actions\Commands\CreateCommandAction;
use App\DTO\Commands\CreateCommandDTO;
use App\Http\Requests\Api\V1\CreateCommandRequest;
use App\Http\Resources\Api\V1\CommandResource;
use Illuminate\Http\JsonResponse;

class CommandController extends Controller
{
    public function __construct(
        private readonly CreateCommandAction $createCommandAction
    ) {}

    public function store(CreateCommandRequest $request): JsonResponse
    {
        $dto = new CreateCommandDTO(
            userId: (string) $request->user()?->id,
            networkId: (int) $request->integer('network_id'),
            deviceId: $request->input('device_id'),
            type: $request->input('type'),
            payload: $request->input('payload'),
        );

        $command = $this->createCommandAction->execute($dto);

        return response()->json([
            'data' => new CommandResource($command),
        ], 201);
    }
}
