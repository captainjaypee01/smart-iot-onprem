<?php

declare(strict_types=1);

// app/Http/Requests/Api/V1/Permissions/StorePermissionRequest.php
// Validation + authorization for creating a permission.

namespace App\Http\Requests\Api\V1\Permissions;

use Illuminate\Foundation\Http\FormRequest;

final class StorePermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $authUser = $this->user();
        if ($authUser === null) {
            return false;
        }

        return $authUser->hasPermission('permission.create');
    }

    public function rules(): array
    {
        return [
            'key' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z_]+\.[a-z_]+$/',
                'unique:permissions,key',
            ],
            'display_name' => ['required', 'string', 'max:255'],
            'module' => [
                'required',
                'string',
                'max:255',
                'lowercase',
            ],
            'description' => ['nullable', 'string'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $key = (string) $this->input('key', '');
        $module = (string) $this->input('module', '');

        if ($key !== '' && $module !== '') {
            [$modulePrefix] = explode('.', $key, 2);

            if ($modulePrefix !== $module) {
                $this->merge([
                    'module' => $modulePrefix,
                ]);
            }
        }
    }
}

