<?php

declare(strict_types=1);

// app/Http/Requests/Api/V1/Networks/StoreNetworkRequest.php

namespace App\Http\Requests\Api\V1\Networks;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreNetworkRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'network_address' => [
                'required',
                'string',
                'regex:/^[0-9A-Fa-f]{6}$/',
                'unique:networks,network_address',
            ],
            'description' => ['nullable', 'string'],
            'remarks' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'diagnostic_interval' => ['required', 'integer', Rule::in([5, 10, 30])],
            'alarm_threshold' => ['required', 'integer', 'min:1'],
            'alarm_threshold_unit' => ['required', 'string', Rule::in(['minutes', 'hours'])],
            'wirepas_version' => ['nullable', 'string', Rule::in(['5.2', '5.1', '5.0', '4.0'])],
            'commissioned_date' => ['nullable', 'date_format:Y-m-d'],
            'is_maintenance' => ['sometimes', 'boolean'],
            'maintenance_start_at' => ['nullable', 'required_if:is_maintenance,true', 'date'],
            'maintenance_end_at' => [
                'nullable',
                'required_if:is_maintenance,true',
                'date',
                'after:maintenance_start_at',
            ],
            'has_monthly_report' => ['sometimes', 'boolean'],
            'node_types' => ['sometimes', 'array'],
            'node_types.*' => ['integer', 'exists:node_types,id'],
        ];
    }
}

