<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Roles;

use App\Rules\FeatureAssignable;
use Illuminate\Foundation\Http\FormRequest;

class StoreRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        $auth = $this->user();

        if ($auth === null) {
            return false;
        }

        if ($auth->is_superadmin) {
            return true;
        }

        return $auth->hasPermission('role.create');
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $isSuperadmin = (bool) $this->user()->is_superadmin;
        /** @var int[] $companyIdsForNetworkValidation */
        $companyIdsForNetworkValidation = $isSuperadmin
            ? (
                $this->input('company_ids') !== null
                    ? array_map(static fn ($id): int => (int) $id, (array) $this->input('company_ids'))
                    : [(int) $this->input('company_id')]
            )
            : [(int) $this->user()->company_id];

        return [
            'name' => ['required', 'string', 'max:255'],
            'company_ids' => $isSuperadmin
                ? ['sometimes', 'array', 'min:1']
                : ['prohibited'],
            'company_ids.*' => $isSuperadmin
                ? ['integer', 'exists:companies,id']
                : ['prohibited'],
            'company_id' => $isSuperadmin
                ? ['required_without:company_ids', 'integer', 'exists:companies,id']
                : ['prohibited'],
            'is_system_role' => $isSuperadmin
                ? ['sometimes', 'boolean']
                : ['prohibited'],
            'feature_ids' => ['sometimes', 'array'],
            'feature_ids.*' => ['integer', new FeatureAssignable],
            'permission_ids' => ['sometimes', 'array'],
            'permission_ids.*' => ['integer', 'exists:permissions,id'],
            'network_ids' => ['sometimes', 'array'],
            'network_ids.*' => ['integer', new \App\Rules\NetworkInAnyCompany($companyIdsForNetworkValidation)],
        ];
    }
}
