<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Roles;

use App\Actions\Roles\StoreRoleAction;
use App\Actions\Roles\UpdateRoleAction;
use App\DTO\Roles\StoreRoleDTO;
use App\DTO\Roles\UpdateRoleDTO;
use App\Http\Controllers\Api\V1\Controller;
use App\Http\Requests\Api\V1\Roles\StoreRoleRequest;
use App\Http\Requests\Api\V1\Roles\UpdateRoleRequest;
use App\Http\Resources\Api\V1\Roles\RoleResource;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class RoleController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection|JsonResponse
    {
        $authUser = $request->user();

        if (! $authUser->is_superadmin && ! $authUser->hasPermission('role.view')) {
            return response()->json(['message' => 'Forbidden.'], Response::HTTP_FORBIDDEN);
        }

        $perPage = min(100, max(1, (int) $request->input('per_page', 15)));

        $query = Role::query()
            ->with(['companies', 'features', 'permissions', 'networks'])
            ->withCount('users');

        if ($authUser->is_superadmin) {
            $companyId = $request->query('company_id');

            if ($companyId !== null && $companyId !== '') {
                $companyId = (int) $companyId;

                $query->whereHas('companies', static function ($q) use ($companyId): void {
                    $q->where('companies.id', $companyId);
                });
            }
        } else {
            $query->forCompany((int) $authUser->company_id);
        }

        if ($search = (string) $request->query('search', '')) {
            $query->where('name', 'like', '%' . $search . '%');
        }

        $roles = $query
            ->orderBy('name')
            ->paginate($perPage);

        return RoleResource::collection($roles);
    }

    public function show(Request $request, Role $role): JsonResponse
    {
        $authUser = $request->user();

        if (! $authUser->is_superadmin && ! $authUser->hasPermission('role.view')) {
            return response()->json(['message' => 'Forbidden.'], Response::HTTP_FORBIDDEN);
        }

        if (! $authUser->is_superadmin && ! $role->companies->contains('id', $authUser->company_id)) {
            return response()->json(['message' => 'Forbidden.'], Response::HTTP_FORBIDDEN);
        }

        $role->load(['companies', 'features', 'permissions', 'networks']);

        return response()->json((new RoleResource($role))->toArray($request), Response::HTTP_OK);
    }

    public function store(StoreRoleRequest $request): JsonResponse
    {
        $auth = $request->user();

        $companyId = $auth->is_superadmin
            ? (int) $request->validated('company_id')
            : (int) $auth->company_id;

        $validated = $request->validated();

        $dto = new StoreRoleDTO(
            name: (string) $validated['name'],
            companyId: $companyId,
            isSystemRole: (bool) ($validated['is_system_role'] ?? false),
            featureIds: $validated['feature_ids'] ?? [],
            permissionIds: $validated['permission_ids'] ?? [],
            networkIds: $validated['network_ids'] ?? [],
        );

        $role = (new StoreRoleAction())->execute($dto);

        return response()->json((new RoleResource($role))->toArray($request), Response::HTTP_CREATED);
    }

    public function update(UpdateRoleRequest $request, Role $role): JsonResponse
    {
        if ($role->is_system_role) {
            return response()->json(['message' => 'Forbidden.'], Response::HTTP_FORBIDDEN);
        }

        $validated = $request->validated();

        $featureIds = array_key_exists('feature_ids', $validated) ? $validated['feature_ids'] : null;
        $permissionIds = array_key_exists('permission_ids', $validated) ? $validated['permission_ids'] : null;
        $networkIds = array_key_exists('network_ids', $validated) ? $validated['network_ids'] : null;

        $dto = new UpdateRoleDTO(
            name: $validated['name'] ?? null,
            isSystemRole: array_key_exists('is_system_role', $validated) ? $validated['is_system_role'] : null,
            featureIds: $featureIds,
            permissionIds: $permissionIds,
            networkIds: $networkIds,
        );

        $updated = (new UpdateRoleAction())->execute($role, $dto);

        return response()->json((new RoleResource($updated))->toArray($request), Response::HTTP_OK);
    }

    public function destroy(Request $request, Role $role): JsonResponse
    {
        $authUser = $request->user();

        if (! $authUser->is_superadmin && ! $authUser->hasPermission('role.delete')) {
            return response()->json(['message' => 'Forbidden.'], Response::HTTP_FORBIDDEN);
        }

        if (! $authUser->is_superadmin && ! $role->companies->contains('id', $authUser->company_id)) {
            return response()->json(['message' => 'Forbidden.'], Response::HTTP_FORBIDDEN);
        }

        if ($role->is_system_role) {
            return response()->json(['message' => 'Forbidden.'], Response::HTTP_FORBIDDEN);
        }

        if ($role->users()->exists()) {
            return response()->json([
                'message' => 'Role has active users and cannot be deleted.',
            ], Response::HTTP_CONFLICT);
        }

        $role->delete();

        return response()->json([], Response::HTTP_NO_CONTENT);
    }

    public function options(Request $request): JsonResponse
    {
        $authUser = $request->user();

        if ($authUser->is_superadmin) {
            $companyId = $request->query('company_id');

            if ($companyId === null || $companyId === '') {
                return response()->json(
                    ['message' => 'The company_id query parameter is required for superadmin.'],
                    Response::HTTP_UNPROCESSABLE_ENTITY
                );
            }

            $companyId = (int) $companyId;
        } else {
            $companyId = $authUser->company_id;

            if ($companyId === null) {
                return response()->json(['message' => 'Forbidden.'], Response::HTTP_FORBIDDEN);
            }

            $companyId = (int) $companyId;
        }

        $roles = Role::forCompany($companyId)
            ->orderBy('name')
            ->get(['id', 'name', 'is_system_role']);

        $data = $roles->map(static function (Role $role): array {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'is_system_role' => (bool) $role->is_system_role,
            ];
        })->values()->all();

        return response()->json(['data' => $data]);
    }
}

