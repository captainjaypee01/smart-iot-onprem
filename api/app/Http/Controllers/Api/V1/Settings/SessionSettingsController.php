<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Settings;

use App\Actions\Settings\GetSessionSettingsAction;
use App\Actions\Settings\UpdateSessionSettingsAction;
use App\DTO\Settings\UpdateSessionSettingsDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Settings\UpdateSessionSettingsRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SessionSettingsController extends Controller
{
    /**
     * GET /api/v1/settings/session
     * Get session settings for the authenticated user. Superadmin can pass ?company_id= and receives companies list.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user === null) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $requestedCompanyId = $request->query('company_id');
        $companyId = $requestedCompanyId !== null && $requestedCompanyId !== ''
            ? (int) $requestedCompanyId
            : null;

        $action = new GetSessionSettingsAction;
        $payload = $action->execute($user, $companyId);

        return response()->json($payload);
    }

    /**
     * PATCH /api/v1/settings/session
     * Update session lifetime for a company. Superadmin must send company_id; company admin updates their own.
     */
    public function update(UpdateSessionSettingsRequest $request): JsonResponse
    {
        $user = $request->user();
        $dto = new UpdateSessionSettingsDTO(
            sessionLifetimeMinutes: $request->validated('session_lifetime_minutes'),
            companyId: $request->filled('company_id') ? (int) $request->input('company_id') : null,
        );

        $action = new UpdateSessionSettingsAction;
        $result = $action->execute($user, $dto);

        return response()->json($result);
    }
}
