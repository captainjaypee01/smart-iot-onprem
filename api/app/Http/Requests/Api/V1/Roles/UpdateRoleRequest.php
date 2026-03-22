<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Roles;

use App\Rules\FeatureAssignable;
use App\Rules\NetworkInCompany;
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

        /** @var \App\Models\Role|null $role */
        $role = $this->route('role');

        $companyId = $role?->companies->first()?->id ?? (int) $this->user()->company_id;
        $companyId = (int) $companyId;

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'company_id' => ['prohibited'],
            'is_system_role' => $isSuperadmin
                ? ['sometimes', 'boolean']
                : ['prohibited'],
            'feature_ids' => ['sometimes', 'array'],
            'feature_ids.*' => ['integer', new FeatureAssignable()],
            'permission_ids' => ['sometimes', 'array'],
            'permission_ids.*' => ['integer', 'exists:permissions,id'],
            'network_ids' => ['sometimes', 'array'],
            'network_ids.*' => ['integer', new NetworkInCompany($companyId)],
        ];
    }
}

