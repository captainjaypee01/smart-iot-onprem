<?php

declare(strict_types=1);

// app/Http/Controllers/Api/V1/Auth/MeController.php
// Returns the currently authenticated user and their permission keys.
// Used on app load to rehydrate the Zustand auth store and drive permission-based UI.

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\UserResource;
use App\Models\Feature;
use App\Models\Network;
use App\Models\Permission;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MeController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = User::with([
            'company',
            'role.permissions:id,key',
        ])->find($request->user()->id);

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $permissions = $user->is_superadmin
            ? Permission::pluck('key')->values()->all()
            : $user->role?->permissions?->pluck('key')->values()->all() ?? [];

        $features = $user->is_superadmin
            ? $this->getSuperadminFeatures()
            : $this->getRoleFeatures($user->role_id);

        $networks = $user->is_superadmin
            ? $this->getSuperadminNetworks()
            : $this->getRoleNetworks($user->role_id, (int) $user->company_id);

        return response()->json([
            'user' => new UserResource($user),
            'permissions' => $permissions,
            'features' => $features,
            'networks' => $networks,
        ]);
    }

    /**
     * @return array<int, array{key:string,name:string,route:string,icon:?string,group:string,group_order:int,sort_order:int}>
     */
    private function getSuperadminFeatures(): array
    {
        return Feature::query()
            ->where('is_active', true)
            ->orderBy('group_order')
            ->orderBy('sort_order')
            ->get(['key', 'name', 'route', 'icon', 'group', 'group_order', 'sort_order'])
            ->map(static function (Feature $feature): array {
                return [
                    'key' => $feature->key,
                    'name' => $feature->name,
                    'route' => $feature->route,
                    'icon' => $feature->icon,
                    'group' => $feature->group,
                    'group_order' => (int) $feature->group_order,
                    'sort_order' => (int) $feature->sort_order,
                ];
            })
            ->all();
    }

    /**
     * @return array<int, array{key:string,name:string,route:string,icon:?string,group:string,group_order:int,sort_order:int}>
     */
    private function getRoleFeatures(?int $roleId): array
    {
        if ($roleId === null) {
            return [];
        }

        return Feature::query()
            ->join('role_features', 'role_features.feature_id', '=', 'features.id')
            ->where('role_features.role_id', $roleId)
            ->where('features.is_active', true)
            ->orderBy('features.group_order')
            ->orderBy('features.sort_order')
            ->get([
                'features.key',
                'features.name',
                'features.route',
                'features.icon',
                'features.group',
                'features.group_order',
                'features.sort_order',
            ])
            ->map(static function (Feature $feature): array {
                return [
                    'key' => $feature->key,
                    'name' => $feature->name,
                    'route' => $feature->route,
                    'icon' => $feature->icon,
                    'group' => $feature->group,
                    'group_order' => (int) $feature->group_order,
                    'sort_order' => (int) $feature->sort_order,
                ];
            })
            ->all();
    }

    /**
     * @return array<int, array{id:int,name:string,network_address:string}>
     */
    private function getSuperadminNetworks(): array
    {
        return Network::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'network_address'])
            ->map(static function (Network $network): array {
                return [
                    'id' => (int) $network->id,
                    'name' => $network->name,
                    'network_address' => $network->network_address,
                ];
            })
            ->all();
    }

    /**
     * @return array<int, array{id:int,name:string,network_address:string}>
     */
    private function getRoleNetworks(?int $roleId, int $companyId): array
    {
        if ($roleId === null) {
            return [];
        }

        return Network::query()
            ->select(['networks.id', 'networks.name', 'networks.network_address'])
            ->join('role_networks', 'role_networks.network_id', '=', 'networks.id')
            ->join('company_networks', 'company_networks.network_id', '=', 'networks.id')
            ->where('role_networks.role_id', $roleId)
            ->where('company_networks.company_id', $companyId)
            ->distinct()
            ->orderBy('networks.name')
            ->get(['networks.id', 'networks.name', 'networks.network_address'])
            ->map(static function (Network $network): array {
                return [
                    'id' => (int) $network->id,
                    'name' => $network->name,
                    'network_address' => $network->network_address,
                ];
            })
            ->all();
    }
}
