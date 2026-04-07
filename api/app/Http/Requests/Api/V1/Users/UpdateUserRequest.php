<?php

declare(strict_types=1);

// app/Http/Requests/Api/V1/Users/UpdateUserRequest.php

namespace App\Http\Requests\Api\V1\Users;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        $authUser = $this->user();
        $targetUser = $this->route('user');

        if (! $authUser->hasPermission('user.update')) {
            return false;
        }

        if ($authUser->is_superadmin) {
            return true;
        }

        return (int) $targetUser->company_id === (int) $authUser->company_id;
    }

    public function rules(): array
    {
        $user = $this->route('user');
        $userId = $user->id;
        $authUser = $this->user();

        // For superadmin, when company_id is being changed, validation for role_id
        // must use the *new* company_id (so we can assign a company and role in one request).
        $companyId = $authUser->is_superadmin
            ? (int) ($this->input('company_id', $user->company_id))
            : (int) $user->company_id;

        $rules = [
            'first_name' => ['sometimes', 'string', 'max:255'],
            'last_name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($userId)],
            'username' => ['sometimes', 'nullable', 'string', 'max:255', Rule::unique('users', 'username')->ignore($userId)],
            'role_id' => [
                'sometimes',
                'integer',
                'exists:roles,id',
                Rule::exists('role_companies', 'role_id')->where('company_id', $companyId),
            ],
        ];

        // company_id and status: only superadmin with specific permissions can send these.
        if ($authUser->is_superadmin && $authUser->hasPermission('user.change_company')) {
            $rules['company_id'] = ['sometimes', 'integer', 'exists:companies,id'];
        } else {
            $rules['company_id'] = ['prohibited'];
        }
        if ($authUser->is_superadmin && $authUser->hasPermission('user.change_status')) {
            $rules['status'] = ['sometimes', 'string', Rule::in(['active', 'locked', 'disabled'])];
        } else {
            $rules['status'] = ['prohibited'];
        }

        return $rules;
    }
}
