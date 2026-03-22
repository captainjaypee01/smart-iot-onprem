<?php

declare(strict_types=1);

// app/Http/Controllers/Api/V1/Networks/NetworkController.php

namespace App\Http\Controllers\Api\V1\Networks;

use App\Actions\Networks\StoreNetworkAction;
use App\Actions\Networks\UpdateNetworkAction;
use App\DTO\Networks\StoreNetworkDTO;
use App\DTO\Networks\UpdateNetworkDTO;
use App\Http\Controllers\Api\V1\Controller;
use App\Http\Requests\Api\V1\Networks\StoreNetworkRequest;
use App\Http\Requests\Api\V1\Networks\UpdateNetworkRequest;
use App\Http\Resources\Api\V1\Networks\NetworkResource;
use App\Models\Network;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class NetworkController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorizeSuperadmin();

        $query = Network::query()->with('nodeTypes');

        if ($search = (string) $request->query('search', '')) {
            $query->where(function ($q) use ($search): void {
                $q->where('name', 'like', '%' . $search . '%')
                    ->orWhere('network_address', 'like', '%' . $search . '%')
                    ->orWhere('description', 'like', '%' . $search . '%');
            });
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', (bool) $request->query('is_active'));
        }

        if ($request->filled('is_maintenance')) {
            $query->where('is_maintenance', (bool) $request->query('is_maintenance'));
        }

        $perPage = (int) $request->query('per_page', 15);
        $perPage = max(1, min($perPage, 100));

        $networks = $query->orderBy('name')->paginate($perPage);

        // Index/search responses format addresses with a `0x` prefix for display,
        // even though the DB stores the plain 6-hex-digit form.
        $networks->getCollection()->transform(static function (Network $network): Network {
            $addr = (string) $network->network_address;
            if (str_starts_with($addr, '0x') || str_starts_with($addr, '0X')) {
                $hex = substr($addr, 2);
            } else {
                $hex = $addr;
            }

            $network->network_address = '0x' . strtoupper($hex);

            return $network;
        });

        return NetworkResource::collection($networks);
    }

    public function show(Network $network): JsonResponse
    {
        $this->authorizeSuperadmin();

        $network->load('nodeTypes');

        return response()->json(
            (new NetworkResource($network))->toArray(request()),
            Response::HTTP_OK
        );
    }

    public function store(
        StoreNetworkRequest $request,
        StoreNetworkAction $action,
    ): JsonResponse {
        $this->authorizeSuperadmin();

        $validated = $request->validated();

        $dto = new StoreNetworkDTO(
            name: $validated['name'],
            networkAddress: $validated['network_address'],
            description: $validated['description'] ?? null,
            remarks: $validated['remarks'] ?? null,
            isActive: $validated['is_active'] ?? true,
            diagnosticInterval: $validated['diagnostic_interval'],
            alarmThreshold: $validated['alarm_threshold'],
            alarmThresholdUnit: $validated['alarm_threshold_unit'],
            wirepasVersion: $validated['wirepas_version'] ?? null,
            commissionedDate: $validated['commissioned_date'] ?? null,
            isMaintenance: $validated['is_maintenance'] ?? false,
            maintenanceStartAt: $validated['maintenance_start_at'] ?? null,
            maintenanceEndAt: $validated['maintenance_end_at'] ?? null,
            hasMonthlyReport: $validated['has_monthly_report'] ?? false,
            nodeTypeIds: $validated['node_types'] ?? null,
        );

        $network = $action->execute($dto);

        return response()->json(
            (new NetworkResource($network))->toArray($request),
            Response::HTTP_CREATED
        );
    }

    public function update(
        UpdateNetworkRequest $request,
        Network $network,
        UpdateNetworkAction $action,
    ): JsonResponse {
        $this->authorizeSuperadmin();

        $validated = $request->validated();

        $dto = new UpdateNetworkDTO(
            name: $validated['name'] ?? null,
            networkAddress: $validated['network_address'] ?? null,
            description: $validated['description'] ?? null,
            remarks: $validated['remarks'] ?? null,
            isActive: $validated['is_active'] ?? null,
            diagnosticInterval: $validated['diagnostic_interval'] ?? null,
            alarmThreshold: $validated['alarm_threshold'] ?? null,
            alarmThresholdUnit: $validated['alarm_threshold_unit'] ?? null,
            wirepasVersion: $validated['wirepas_version'] ?? null,
            commissionedDate: $validated['commissioned_date'] ?? null,
            isMaintenance: $validated['is_maintenance'] ?? null,
            maintenanceStartAt: $validated['maintenance_start_at'] ?? null,
            maintenanceEndAt: $validated['maintenance_end_at'] ?? null,
            hasMonthlyReport: $validated['has_monthly_report'] ?? null,
            hasNodeTypes: array_key_exists('node_types', $validated),
            nodeTypeIds: $validated['node_types'] ?? null,
        );

        $updated = $action->execute($network, $dto);

        return response()->json(
            (new NetworkResource($updated))->toArray($request),
            Response::HTTP_OK
        );
    }

    public function destroy(Network $network): JsonResponse
    {
        $this->authorizeSuperadmin();

        $network->delete();

        return response()->json([], Response::HTTP_NO_CONTENT);
    }

    public function options(Request $request): JsonResponse
    {
        $this->authorizeSuperadmin();

        $companyId = $request->query('company_id');

        $companyId = $companyId === null || $companyId === '' ? null : (int) $companyId;

        $query = Network::query()
            ->orderBy('name')
            ->when($companyId !== null, static function ($q) use ($companyId): void {
                $q->whereExists(static function ($sub) use ($companyId): void {
                    $sub->selectRaw('1')
                        ->from('company_networks')
                        ->whereColumn('company_networks.network_id', 'networks.id')
                        ->where('company_networks.company_id', $companyId);
                });
            })
            ->get(['id', 'name', 'network_address', 'is_active'])
            ->map(static fn (Network $network): array => [
                'id' => $network->id,
                'name' => $network->name,
                'network_address' => $network->network_address,
                'is_active' => (bool) $network->is_active,
            ])
            ->all();

        return response()->json(['data' => $data]);
    }
}

