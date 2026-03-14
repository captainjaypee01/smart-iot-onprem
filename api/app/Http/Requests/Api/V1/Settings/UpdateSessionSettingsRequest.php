<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Settings;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateSessionSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'session_lifetime_minutes' => ['required', 'string', 'max:32'],
            'company_id' => ['nullable', 'integer', 'exists:companies,id'],
        ];
    }

    /**
     * Configure the validator: superadmin must provide company_id; session_lifetime_minutes must be 1–5256000 or "unlimited".
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $user = $this->user();
            if ($user === null) {
                return;
            }
            if ($user->is_superadmin && $this->filled('company_id') === false) {
                $validator->errors()->add(
                    'company_id',
                    'company_id is required when updating session settings as a superadmin.'
                );
            }

            $v = $this->input('session_lifetime_minutes');
            if (! is_string($v) || $v === '') {
                return;
            }
            $normalized = strtolower(trim($v));
            if ($normalized === 'unlimited' || $normalized === 'forever') {
                return;
            }
            $minutes = (int) $v;
            if ($minutes < 1 || $minutes > 5256000) {
                $validator->errors()->add(
                    'session_lifetime_minutes',
                    'The session lifetime must be between 1 and 5256000 minutes, or "unlimited".'
                );
            }
        });
    }

    public function messages(): array
    {
        return [
            'session_lifetime_minutes.required' => 'Session duration is required.',
            'session_lifetime_minutes.string' => 'Session duration must be a string (e.g. "120" or "unlimited").',
        ];
    }
}
