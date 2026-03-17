<?php

declare(strict_types=1);

// app/Http/Requests/Api/V1/Permissions/UpdatePermissionRequest.php
// Validation + authorization for updating a permission.

namespace App\Http\Requests\Api\V1\Permissions;

use Illuminate\Foundation\Http\FormRequest;

final class UpdatePermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $authUser = $this->user();
        if ($authUser === null) {
            return false;
        }

        return $authUser->hasPermission('permission.update');
    }

    public function rules(): array
    {
        return [
            'key' => ['prohibited'],
            'module' => ['prohibited'],
            'display_name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
        ];
    }
}

