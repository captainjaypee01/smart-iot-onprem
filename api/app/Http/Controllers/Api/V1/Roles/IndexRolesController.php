<?php

declare(strict_types=1);

// app/Http/Controllers/Api/V1/Roles/IndexRolesController.php
// GET /api/v1/roles/options — roles scoped to company for user create/edit dropdown (not paginated).
// Returns empty data if role_companies has no rows for that company; run db:seed (or RoleSeeder after CompanySeeder) to populate.

namespace App\Http\Controllers\Api\V1\Roles;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IndexRolesController extends Controller
{
    /**
     * Returns roles available for a company.
     * Company admin: uses their company_id, ignores ?company_id.
     * Superadmin: must pass ?company_id.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $authUser = $request->user();

        if ($authUser->is_superadmin) {
            $companyId = $request->query('company_id');
            if ($companyId === null || $companyId === '') {
                return response()->json([
                    'message' => 'The company_id query parameter is required for superadmin.',
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
            $companyId = (int) $companyId;
        } else {
            $companyId = $authUser->company_id;
            if ($companyId === null) {
                return response()->json(['message' => 'Forbidden.'], Response::HTTP_FORBIDDEN);
            }
        }

        $roles = Role::forCompany($companyId)
            ->orderBy('name')
            ->get(['id', 'name', 'is_system_role']);

        $data = $roles->map(fn (Role $role) => [
            'id' => $role->id,
            'name' => $role->name,
            'is_system_role' => (bool) $role->is_system_role,
        ])->values()->all();

        return response()->json(['data' => $data]);
    }
}
