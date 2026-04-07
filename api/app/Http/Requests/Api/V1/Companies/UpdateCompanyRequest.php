<?php

declare(strict_types=1);

// app/Http/Requests/Api/V1/Companies/UpdateCompanyRequest.php

namespace App\Http\Requests\Api\V1\Companies;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCompanyRequest extends FormRequest
{
    public function authorize(): bool
    {
        $authUser = $this->user();

        if ($authUser?->is_superadmin) {
            return true;
        }

        if (! $authUser?->hasPermission('company.update')) {
            return false;
        }

        $company = $this->route('company');

        return $company !== null && (int) $authUser->company_id === (int) $company->id;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $authUser = $this->user();
        $isSuperadmin = (bool) $authUser?->is_superadmin;

        $rules = [
            'code' => ['prohibited'],
            'name' => ['sometimes', 'string', 'max:255'],
            'address' => ['sometimes', 'nullable', 'string'],
            'contact_email' => ['sometimes', 'nullable', 'email'],
            'contact_phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'timezone' => ['sometimes', 'string', Rule::in(\timezone_identifiers_list())],
            'login_attempts' => ['sometimes', 'integer', 'min:1', 'max:10'],
            'is_2fa_enforced' => ['sometimes', 'boolean'],
        ];

        $restrictedFields = [
            'is_demo',
            'is_active',
            'is_active_zone',
            'custom_alarm_threshold',
            'custom_alarm_threshold_unit',
            'network_ids',
        ];

        if ($isSuperadmin) {
            $rules['is_demo'] = ['sometimes', 'boolean'];
            $rules['is_active'] = ['sometimes', 'boolean'];
            $rules['is_active_zone'] = ['sometimes', 'boolean'];
            $rules['custom_alarm_threshold'] = [
                'sometimes',
                'nullable',
                'integer',
                'min:1',
                'required_with:custom_alarm_threshold_unit',
            ];
            $rules['custom_alarm_threshold_unit'] = [
                'sometimes',
                'nullable',
                'string',
                Rule::in(['minutes', 'hours']),
                'required_with:custom_alarm_threshold',
            ];
            $rules['network_ids'] = ['sometimes', 'array'];
            $rules['network_ids.*'] = ['integer', 'exists:networks,id'];
        } else {
            foreach ($restrictedFields as $field) {
                $rules[$field] = ['prohibited'];
            }
        }

        return $rules;
    }
}
