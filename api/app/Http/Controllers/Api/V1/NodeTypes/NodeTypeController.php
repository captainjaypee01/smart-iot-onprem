<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\NodeTypes;

use App\Actions\NodeTypes\StoreNodeTypeAction;
use App\Actions\NodeTypes\UpdateNodeTypeAction;
use App\DTO\NodeTypes\StoreNodeTypeDTO;
use App\DTO\NodeTypes\UpdateNodeTypeDTO;
use App\Http\Controllers\Api\V1\Controller;
use App\Http\Requests\Api\V1\NodeTypes\StoreNodeTypeRequest;
use App\Http\Requests\Api\V1\NodeTypes\UpdateNodeTypeRequest;
use App\Http\Resources\Api\V1\NodeTypes\NodeTypeResource;
use App\Models\NodeType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class NodeTypeController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorizeSuperadmin();

        $query = NodeType::query();

        if ($search = (string) $request->query('search', '')) {
            $query->where(function ($q) use ($search): void {
                $q->where('name', 'like', '%' . $search . '%')
                    ->orWhere('area_id', 'like', '%' . $search . '%')
                    ->orWhere('description', 'like', '%' . $search . '%');
            });
        }

        $perPage = (int) $request->query('per_page', 15);
        $perPage = max(1, min($perPage, 100));

        $nodeTypes = $query->orderBy('name')->paginate($perPage);

        return NodeTypeResource::collection($nodeTypes);
    }

    public function show(NodeType $nodeType)
    {
        $this->authorizeSuperadmin();

        return response()->json(
            (new NodeTypeResource($nodeType))->toArray(request()),
            Response::HTTP_OK
        );
    }

    public function store(
        StoreNodeTypeRequest $request,
        StoreNodeTypeAction $action,
    ) {
        $this->authorizeSuperadmin();

        $validated = $request->validated();

        $dto = new StoreNodeTypeDTO(
            name: $validated['name'],
            areaId: $validated['area_id'],
            description: $validated['description'] ?? null,
            sensors: $validated['sensors'] ?? [],
        );

        $nodeType = $action->execute($dto);

        return response()->json(
            (new NodeTypeResource($nodeType))->toArray($request),
            Response::HTTP_CREATED
        );
    }

    public function update(
        UpdateNodeTypeRequest $request,
        NodeType $nodeType,
        UpdateNodeTypeAction $action,
    ) {
        $this->authorizeSuperadmin();

        $validated = $request->validated();

        $dto = new UpdateNodeTypeDTO(
            name: $validated['name'] ?? null,
            areaId: $validated['area_id'] ?? null,
            description: $validated['description'] ?? null,
            hasSensors: array_key_exists('sensors', $validated),
            sensors: $validated['sensors'] ?? null,
        );

        $updated = $action->execute($nodeType, $dto);

        return response()->json(
            (new NodeTypeResource($updated))->toArray($request),
            Response::HTTP_OK
        );
    }

    public function destroy(NodeType $nodeType): JsonResponse
    {
        $this->authorizeSuperadmin();

        $inUse = $nodeType->networks()->exists();

        if ($inUse) {
            return response()->json(
                ['message' => 'Node type is in use by one or more networks.'],
                Response::HTTP_CONFLICT
            );
        }

        $nodeType->delete();

        return response()->json([], Response::HTTP_NO_CONTENT);
    }

    public function options(): JsonResponse
    {
        $data = NodeType::query()
            ->orderBy('name')
            ->get(['id', 'name', 'area_id'])
            ->map(fn (NodeType $nodeType): array => [
                'id' => $nodeType->id,
                'name' => $nodeType->name,
                'area_id' => $nodeType->area_id,
            ])
            ->all();

        return response()->json(['data' => $data]);
    }
}

