<?php

declare(strict_types=1);

// app/Http/Requests/Api/V1/Networks/UpdateNetworkRequest.php

namespace App\Http\Requests\Api\V1\Networks;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateNetworkRequest extends FormRequest
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
        $networkId = $this->route('network')?->id ?? $this->route('id');

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'network_address' => [
                'sometimes',
                'string',
                'regex:/^[0-9A-Fa-f]{6}$/',
                Rule::unique('networks', 'network_address')->ignore($networkId),
            ],
            'description' => ['sometimes', 'nullable', 'string'],
            'remarks' => ['sometimes', 'nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'diagnostic_interval' => ['sometimes', 'integer', Rule::in([5, 10, 30])],
            'alarm_threshold' => ['sometimes', 'integer', 'min:1'],
            'alarm_threshold_unit' => ['sometimes', 'string', Rule::in(['minutes', 'hours'])],
            'wirepas_version' => ['sometimes', 'nullable', 'string', Rule::in(['5.2', '5.1', '5.0', '4.0'])],
            'commissioned_date' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'is_maintenance' => ['sometimes', 'boolean'],
            'maintenance_start_at' => ['sometimes', 'nullable', 'required_if:is_maintenance,true', 'date'],
            'maintenance_end_at' => [
                'sometimes',
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

