<?php

// app/Http/Requests/Api/V1/Users/CreateUserRequest.php
// Validates admin payload for creating a new user

namespace App\Http\Requests\Api\V1\Users;

use Illuminate\Foundation\Http\FormRequest;

class CreateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Allow superadmin, or company admin acting within their own company
        $user = $this->user();

        if ($user->is_superadmin) {
            return true;
        }

        // Company admin can only create users under their own company
        return (int) $this->company_id === (int) $user->company_id;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'company_id' => ['required', 'integer', 'exists:companies,id'],
            'role_id' => ['required', 'integer', 'exists:roles,id'],
        ];
    }
}
