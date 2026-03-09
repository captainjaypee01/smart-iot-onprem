<?php

// app/Http/Requests/Api/V1/Users/StoreUserRequest.php
// Validates the payload for creating a new user
// Replaces the old CreateUserRequest — rename/delete that file

namespace App\Http\Requests\Api\V1\Users;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        $authUser = $this->user();

        if ($authUser->is_superadmin) {
            return true;
        }

        // Company admin can only create users under their own company
        return (int) $this->company_id === (int) $authUser->company_id;
    }

    public function rules(): array
    {
        return [
            'name'       => ['required', 'string', 'max:255'],
            'email'      => ['required', 'email', 'unique:users,email'],
            'company_id' => ['required', 'integer', 'exists:companies,id'],
            'role_id'    => ['required', 'integer', 'exists:roles,id'],
        ];
    }
}
