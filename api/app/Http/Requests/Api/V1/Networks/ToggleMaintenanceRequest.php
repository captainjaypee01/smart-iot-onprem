<?php

declare(strict_types=1);

// app/Http/Requests/Api/V1/Networks/ToggleMaintenanceRequest.php

namespace App\Http\Requests\Api\V1\Networks;

use Illuminate\Foundation\Http\FormRequest;

class ToggleMaintenanceRequest extends FormRequest
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
            'is_maintenance' => ['required', 'boolean'],
            'maintenance_start_at' => ['nullable', 'required_if:is_maintenance,true', 'date'],
            'maintenance_end_at' => [
                'nullable',
                'required_if:is_maintenance,true',
                'date',
                'after:maintenance_start_at',
            ],
        ];
    }
}
