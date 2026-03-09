<?php

// app/Http/Requests/Api/V1/Users/UpdateUserRequest.php
// Validates the payload for updating an existing user
// All fields are optional — only send what needs to change

namespace App\Http\Requests\Api\V1\Users;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        $authUser  = $this->user();
        $targetUser = $this->route('user'); // User model via route model binding

        if ($authUser->is_superadmin) {
            return true;
        }

        // Company admin can only update users within their own company
        return (int) $targetUser->company_id === (int) $authUser->company_id;
    }

    public function rules(): array
    {
        $userId = $this->route('user')->id;

        return [
            'name'    => ['sometimes', 'string', 'max:255'],
            // Ignore the current user's own email when checking uniqueness
            'email'   => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($userId)],
            'role_id' => ['sometimes', 'integer', 'exists:roles,id'],
        ];
    }
}
