<?php

declare(strict_types=1);

// app/Http/Controllers/Api/V1/Networks/ToggleMaintenanceController.php

namespace App\Http\Controllers\Api\V1\Networks;

use App\Actions\Networks\ToggleMaintenanceAction;
use App\Http\Controllers\Api\V1\Controller;
use App\Http\Requests\Api\V1\Networks\ToggleMaintenanceRequest;
use App\Http\Resources\Api\V1\Networks\NetworkResource;
use App\Models\Network;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

final class ToggleMaintenanceController extends Controller
{
    public function __invoke(
        ToggleMaintenanceRequest $request,
        Network $network,
        ToggleMaintenanceAction $action,
    ): JsonResponse {
        $this->authorizeSuperadmin();

        $validated = $request->validated();

        $updated = $action->execute(
            $network,
            (bool) $validated['is_maintenance'],
            $validated['maintenance_start_at'] ?? null,
            $validated['maintenance_end_at'] ?? null,
        );

        return response()->json(
            (new NetworkResource($updated))->toArray($request),
            Response::HTTP_OK
        );
    }
}
