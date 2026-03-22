<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Features;

use Illuminate\Foundation\Http\FormRequest;

final class DeleteFeatureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->is_superadmin ?? false;
    }

    /**
     * No validation rules — Feature route model binding provides the target.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [];
    }
}

