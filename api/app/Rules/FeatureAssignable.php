<?php

declare(strict_types=1);

namespace App\Rules;

use App\Models\Feature;
use Illuminate\Contracts\Validation\Rule;

class FeatureAssignable implements Rule
{
    public function passes($attribute, $value): bool
    {
        return Feature::query()
            ->where('id', (int) $value)
            ->where('is_active', true)
            ->where('group', '!=', 'admin')
            ->exists();
    }

    public function message(): string
    {
        return 'The selected feature is not available for role assignment.';
    }
}
