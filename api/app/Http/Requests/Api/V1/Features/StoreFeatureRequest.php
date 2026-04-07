<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Features;

use Illuminate\Foundation\Http\FormRequest;

final class StoreFeatureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->is_superadmin ?? false;
    }

    /**
     * @return array<string, array<int, string|int|bool>>
     */
    public function rules(): array
    {
        return [
            'key' => ['required', 'string', 'max:50', 'unique:features,key'],
            'name' => ['required', 'string', 'max:100'],

            // Group is a sidebar section mapping. Allow runtime creation of new groups,
            // but keep `admin` reserved.
            'group' => [
                'required',
                'string',
                'max:50',
                'not_in:admin',
                'regex:/^[a-z][a-z0-9-]*$/',
            ],
            'group_order' => ['required', 'integer', 'min:0'],

            'route' => ['required', 'string', 'max:100', 'unique:features,route'],
            'icon' => ['nullable', 'string', 'max:50'],
            'sort_order' => ['required', 'integer', 'min:0'],
            'is_active' => ['required', 'boolean'],
        ];
    }
}
