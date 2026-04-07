<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Features;

use App\Actions\Features\DeleteFeatureAction;
use App\Actions\Features\StoreFeatureAction;
use App\DTO\Features\StoreFeatureDTO;
use App\Http\Controllers\Api\V1\Controller;
use App\Http\Requests\Api\V1\Features\DeleteFeatureRequest;
use App\Http\Requests\Api\V1\Features\StoreFeatureRequest;
use App\Http\Requests\Api\V1\Features\UpdateFeatureRequest;
use App\Http\Resources\Api\V1\Features\FeatureGroupResource;
use App\Http\Resources\Api\V1\Features\FeatureResource;
use App\Models\Feature;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class FeatureController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorizeSuperadmin();

        $features = Feature::query()
            ->orderBy('group_order')
            ->orderBy('sort_order')
            ->get();

        $groups = $this->groupFeatures($features);

        return response()->json(
            [
                'data' => FeatureGroupResource::collection($groups)->resolve(),
            ],
            Response::HTTP_OK
        );
    }

    public function show(Request $request, Feature $feature): FeatureResource
    {
        $this->authorizeSuperadmin();

        return new FeatureResource($feature);
    }

    public function update(UpdateFeatureRequest $request, Feature $feature): FeatureResource
    {
        $this->authorizeSuperadmin();

        $feature->update($request->validated());

        return new FeatureResource($feature);
    }

    public function store(StoreFeatureRequest $request): JsonResponse
    {
        $this->authorizeSuperadmin();

        $validated = $request->validated();

        $dto = new StoreFeatureDTO(
            key: (string) $validated['key'],
            name: (string) $validated['name'],
            group: (string) $validated['group'],
            groupOrder: (int) $validated['group_order'],
            route: (string) $validated['route'],
            icon: $validated['icon'] ?? null,
            sortOrder: (int) $validated['sort_order'],
            isActive: (bool) $validated['is_active'],
        );

        $feature = (new StoreFeatureAction)->execute($dto);

        return response()->json(
            (new FeatureResource($feature))->toArray($request),
            Response::HTTP_CREATED,
        );
    }

    public function destroy(DeleteFeatureRequest $request, Feature $feature): JsonResponse
    {
        $this->authorizeSuperadmin();

        (new DeleteFeatureAction)->execute($feature);

        return response()->json([], Response::HTTP_NO_CONTENT);
    }

    public function options(Request $request): JsonResponse
    {
        $features = Feature::query()
            ->where('is_active', true)
            ->where('group', '!=', 'admin')
            ->orderBy('group_order')
            ->orderBy('sort_order')
            ->get();

        $groups = $this->groupFeatures($features);

        return response()->json(
            [
                'data' => FeatureGroupResource::collection($groups)->resolve(),
            ],
            Response::HTTP_OK
        );
    }

    /**
     * @param  iterable<int, Feature>  $features
     * @return array<int, array{group:string,features:array<int,Feature>}>
     */
    private function groupFeatures(iterable $features): array
    {
        $groups = [];

        foreach ($features as $feature) {
            $groupKey = (string) $feature->group;

            if (! isset($groups[$groupKey])) {
                $groups[$groupKey] = [
                    'group' => $groupKey,
                    'features' => [],
                ];
            }

            $groups[$groupKey]['features'][] = $feature;
        }

        return array_values($groups);
    }
}
