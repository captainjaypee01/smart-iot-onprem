<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Features;

use App\Actions\Features\ReorderGroupsAction;
use App\Http\Controllers\Api\V1\Controller;
use App\Http\Requests\Api\V1\Features\ReorderGroupsRequest;
use App\Http\Resources\Api\V1\Features\FeatureGroupResource;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class ReorderGroupsController extends Controller
{
    public function __invoke(ReorderGroupsRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $grouped = (new ReorderGroupsAction)->execute($validated['groups']);

        return response()->json(
            [
                'data' => FeatureGroupResource::collection($grouped)->resolve(),
            ],
            Response::HTTP_OK
        );
    }
}
