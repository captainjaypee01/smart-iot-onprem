<?php

declare(strict_types=1);

// app/Http/Controllers/Api/V1/PermissionController.php
// Handles CRUD and grouped listing for permissions.

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\V1\Permissions\StorePermissionRequest;
use App\Http\Requests\Api\V1\Permissions\UpdatePermissionRequest;
use App\Http\Resources\Api\V1\PermissionResource;
use App\Models\Permission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

final class PermissionController extends Controller
{
    /**
     * Grouped list by default (for Role UI), or flat paginated list when
     * `flat=1` is passed (for Permissions CRUD table).
     */
    public function index(Request $request): JsonResponse|AnonymousResourceCollection
    {
        $authUser = $request->user();
        if (! $authUser->hasPermission('permission.view')) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if ($request->boolean('flat')) {
            $perPage = (int) $request->input('per_page', 15);
            $perPage = max(1, min(100, $perPage));

            $paginator = Permission::query()
                ->orderBy('module')
                ->orderBy('key')
                ->paginate($perPage);

            return PermissionResource::collection($paginator);
        }

        $permissions = Permission::query()
            ->orderBy('module')
            ->orderBy('key')
            ->get();

        $grouped = $permissions
            ->groupBy('module')
            ->values()
            ->map(static function ($group) {
                /** @var \App\Models\Permission $first */
                $first = $group->first();

                return [
                    'module' => $first->module,
                    'label' => self::moduleLabel($first->module),
                    'permissions' => PermissionResource::collection($group)->resolve(),
                ];
            });

        return response()->json(['data' => $grouped]);
    }

    /**
     * Flat options list for dropdowns.
     */
    public function options(Request $request): JsonResponse
    {
        $authUser = $request->user();
        if (! $authUser->hasPermission('permission.view')) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $permissions = Permission::query()
            ->orderBy('module')
            ->orderBy('key')
            ->get(['id', 'key', 'display_name', 'module']);

        return response()->json([
            'data' => $permissions->map(static fn (Permission $permission) => [
                'id' => $permission->id,
                'key' => $permission->key,
                'display_name' => $permission->display_name,
                'module' => $permission->module,
            ]),
        ]);
    }

    public function show(Request $request, Permission $permission): PermissionResource|JsonResponse
    {
        $authUser = $request->user();
        if (! $authUser->hasPermission('permission.view')) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return new PermissionResource($permission);
    }

    public function store(StorePermissionRequest $request): JsonResponse
    {
        /** @var array{key:string,display_name:string,module:string,description?:string|null} $data */
        $data = $request->validated();

        $permission = Permission::create([
            'key' => $data['key'],
            'display_name' => $data['display_name'],
            'module' => $data['module'],
            'description' => $data['description'] ?? null,
        ]);

        return response()->json([
            'data' => new PermissionResource($permission),
        ], 201);
    }

    public function update(UpdatePermissionRequest $request, Permission $permission): PermissionResource
    {
        /** @var array{display_name?:string,description?:string|null} $data */
        $data = $request->validated();

        if (array_key_exists('display_name', $data)) {
            $permission->display_name = $data['display_name'];
        }
        if (array_key_exists('description', $data)) {
            $permission->description = $data['description'];
        }

        $permission->save();

        return new PermissionResource($permission);
    }

    public function destroy(Request $request, Permission $permission): JsonResponse
    {
        $authUser = $request->user();
        if (! $authUser->hasPermission('permission.delete')) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if ($permission->roles()->exists()) {
            return response()->json([
                'message' => 'Permission is in use by one or more roles.',
            ], 409);
        }

        $permission->delete();

        return response()->json([], 204);
    }

    private static function moduleLabel(string $module): string
    {
        return match ($module) {
            'user' => 'User Management',
            'company' => 'Company Management',
            'role' => 'Role Management',
            'permission' => 'Permission Management',
            'network' => 'Network Management',
            'zone' => 'Zone Management',
            'node' => 'Node Management',
            'fault' => 'Fault Management',
            default => ucfirst($module).' Management',
        };
    }
}
