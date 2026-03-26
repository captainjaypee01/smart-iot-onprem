<?php

declare(strict_types=1);

namespace App\Http\Resources\Api\V1\Roles;

use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoleResource extends JsonResource
{
    /**
     * @param Request $request
     * @return array<string, mixed>
     */
    public function toArray($request): array
    {
        /** @var Role $role */
        $role = $this->resource;
        $companies = $role->companies
            ->sortBy('id')
            ->values()
            ->map(static function ($company): array {
                return [
                    'id' => $company->id,
                    'name' => $company->name,
                    'code' => $company->code,
                ];
            })
            ->all();

        // Backward-compatible "company" field: when the client queries by company_id
        // (or when a non-superadmin calls the endpoint), prefer that company as the
        // legacy singular value.
        $requestedCompanyId = $request->query('company_id');
        $requestedCompanyId = $requestedCompanyId !== null && $requestedCompanyId !== ''
            ? (int) $requestedCompanyId
            : null;

        $authCompanyId = $request->user()?->company_id;
        $primaryCompanyId = $requestedCompanyId ?? ($authCompanyId !== null ? (int) $authCompanyId : null);

        $company = null;
        if ($primaryCompanyId !== null) {
            foreach ($companies as $c) {
                if ((int) $c['id'] === $primaryCompanyId) {
                    $company = $c;
                    break;
                }
            }
        }
        if ($company === null) {
            $company = $companies[0] ?? null;
        }

        $features = $role->features
            ->sortBy('sort_order')
            ->values()
            ->map(static function ($feature): array {
                return [
                    'id' => $feature->id,
                    'key' => $feature->key,
                    'name' => $feature->name,
                    'icon' => $feature->icon,
                ];
            })
            ->all();

        $permissions = $role->permissions
            ->values()
            ->map(static function ($permission): array {
                return [
                    'id' => $permission->id,
                    'key' => $permission->key,
                    'display_name' => $permission->display_name,
                ];
            })
            ->all();

        $networks = $role->networks
            ->values()
            ->map(static function ($network): array {
                return [
                    'id' => $network->id,
                    'name' => $network->name,
                    'network_address' => $network->network_address,
                ];
            })
            ->all();

        return [
            'id' => $role->id,
            'name' => $role->name,
            'is_system_role' => (bool) $role->is_system_role,
            'company' => $company,
            'companies' => $companies,
            'features' => $features,
            'permissions' => $permissions,
            'networks' => $networks,
            'features_count' => $role->features->count(),
            'permissions_count' => $role->permissions->count(),
            'networks_count' => $role->networks->count(),
            'users_count' => (int) ($role->users_count ?? $role->users->count()),
            'created_at' => $role->created_at?->toIso8601String(),
            'updated_at' => $role->updated_at?->toIso8601String(),
        ];
    }
}

