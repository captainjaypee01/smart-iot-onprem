<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Roles;

use App\Rules\FeatureAssignable;
use App\Rules\NetworkInAnyCompany;
use Illuminate\Foundation\Http\FormRequest;

class UpdateRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        $auth = $this->user();
        if ($auth === null) {
            return false;
        }

        /** @var \App\Models\Role|null $role */
        $role = $this->route('role');
        if ($role === null) {
            return false;
        }

        if ($auth->is_superadmin) {
            return true;
        }

        if (! $auth->hasPermission('role.update')) {
            return false;
        }

        return $role->companies->contains('id', $auth->company_id);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $isSuperadmin = (bool) $this->user()->is_superadmin;
        $auth = $this->user();

        /** @var \App\Models\Role|null $role */
        $role = $this->route('role');

        /** @var int[] $companyIdsForNetworkValidation */
        $companyIdsForNetworkValidation = $isSuperadmin
            ? (
                $this->input('company_ids') !== null
                    ? array_map(static fn ($id): int => (int) $id, (array) $this->input('company_ids'))
                    : ($role?->companies->pluck('id')->all() ?? [])
            )
            : [(int) $auth->company_id];

        // Safety: because role_networks are role-scoped (not company-scoped),
        // prevent non-superadmin from overwriting networks when a role spans multiple companies.
        // They can still update features/permissions/name.
        $roleCompanyCount = $role?->companies->count() ?? 0;
        $allowNetworkIdsUpdate = $isSuperadmin || $roleCompanyCount <= 1;

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'company_id' => ['prohibited'],
            'company_ids' => $isSuperadmin
                ? ['sometimes', 'array', 'min:1']
                : ['prohibited'],
            'company_ids.*' => $isSuperadmin
                ? ['integer', 'exists:companies,id']
                : ['prohibited'],
            'is_system_role' => $isSuperadmin
                ? ['sometimes', 'boolean']
                : ['prohibited'],
            'feature_ids' => ['sometimes', 'array'],
            'feature_ids.*' => ['integer', new FeatureAssignable],
            'permission_ids' => ['sometimes', 'array'],
            'permission_ids.*' => ['integer', 'exists:permissions,id'],
            'network_ids' => $allowNetworkIdsUpdate ? ['sometimes', 'array'] : ['prohibited'],
            'network_ids.*' => $allowNetworkIdsUpdate
                ? ['integer', new NetworkInAnyCompany($companyIdsForNetworkValidation)]
                : ['prohibited'],
        ];
    }
}
