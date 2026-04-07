<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Features;

use App\Actions\Features\ReorderFeaturesAction;
use App\Http\Controllers\Api\V1\Controller;
use App\Http\Requests\Api\V1\Features\ReorderFeaturesRequest;
use App\Http\Resources\Api\V1\Features\FeatureGroupResource;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class ReorderFeaturesController extends Controller
{
    public function __invoke(ReorderFeaturesRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $grouped = (new ReorderFeaturesAction)->execute($validated['features']);

        return response()->json(
            [
                'data' => FeatureGroupResource::collection($grouped)->resolve(),
            ],
            Response::HTTP_OK
        );
    }
}
