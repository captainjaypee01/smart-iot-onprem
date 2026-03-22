<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Features;

use Illuminate\Foundation\Http\FormRequest;

class ReorderFeaturesRequest extends FormRequest
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
            'features' => ['required', 'array', 'min:1'],
            'features.*.id' => ['required', 'integer', 'exists:features,id'],
            'features.*.sort_order' => ['required', 'integer', 'min:0'],
        ];
    }
}

