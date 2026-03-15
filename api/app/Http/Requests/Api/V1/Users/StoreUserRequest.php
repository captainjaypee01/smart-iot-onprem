<?php

declare(strict_types=1);

// app/Http/Requests/Api/V1/Users/StoreUserRequest.php

namespace App\Http\Requests\Api\V1\Users;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        $authUser = $this->user();

        if (! $authUser->hasPermission('user.create')) {
            return false;
        }

        // use_invite = false (create with password, no invite) is superadmin-only
        if ($this->has('use_invite') && $this->boolean('use_invite') === false && ! $authUser->is_superadmin) {
            return false;
        }

        if ($authUser->is_superadmin) {
            return true;
        }

        return (int) $this->company_id === (int) $authUser->company_id;
    }

    public function rules(): array
    {
        $companyId = (int) $this->input('company_id');
        $useInvite = $this->has('use_invite') ? $this->boolean('use_invite') : true;

        $rules = [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'username' => ['nullable', 'string', 'max:255', 'unique:users,username'],
            'company_id' => ['required', 'integer', 'exists:companies,id'],
            'role_id' => [
                'required',
                'integer',
                'exists:roles,id',
                Rule::exists('role_companies', 'role_id')->where('company_id', $companyId),
            ],
            'use_invite' => ['sometimes', 'boolean'],
        ];

        // When use_invite is false, password is required (superadmin-only path)
        if ($useInvite === false) {
            $rules['password'] = ['required', 'string', Password::min(8)];
        }

        return $rules;
    }
}
