<?php

declare(strict_types=1);

// app/Http/Requests/Api/V1/Companies/StoreCompanyRequest.php

namespace App\Http\Requests\Api\V1\Companies;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCompanyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->is_superadmin ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'code' => [
                'required',
                'string',
                'max:20',
                'unique:companies,code',
                'regex:/^[A-Z0-9_-]+$/i',
            ],
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'contact_email' => ['nullable', 'email'],
            'contact_phone' => ['nullable', 'string', 'max:30'],
            'timezone' => ['required', 'string', Rule::in(\timezone_identifiers_list())],
            'login_attempts' => ['sometimes', 'integer', 'min:1', 'max:10'],
            'is_2fa_enforced' => ['sometimes', 'boolean'],
            'is_demo' => ['sometimes', 'boolean'],
            'is_active_zone' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'custom_alarm_threshold' => [
                'nullable',
                'integer',
                'min:1',
                'required_with:custom_alarm_threshold_unit',
            ],
            'custom_alarm_threshold_unit' => [
                'nullable',
                'string',
                Rule::in(['minutes', 'hours']),
                'required_with:custom_alarm_threshold',
            ],
            'network_ids' => ['sometimes', 'array'],
            'network_ids.*' => ['integer', 'exists:networks,id'],
        ];
    }
}

