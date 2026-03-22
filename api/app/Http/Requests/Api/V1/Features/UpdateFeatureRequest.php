<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Features;

use Illuminate\Foundation\Http\FormRequest;

class UpdateFeatureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->is_superadmin ?? false;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:100'],
            'icon' => ['sometimes', 'nullable', 'string', 'max:50'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],

            // Immutable/coupled fields
            'key' => ['prohibited'],
            'route' => ['prohibited'],
            'group' => ['prohibited'],
            'group_order' => ['prohibited'],
        ];
    }
}

