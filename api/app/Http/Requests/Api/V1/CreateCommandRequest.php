<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class CreateCommandRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled by Sanctum middleware
    }

    public function rules(): array
    {
        return [
            'network_id' => ['required', 'integer', 'exists:networks,id'],
            'device_id' => ['nullable', 'string', 'max:255'],
            'type' => ['required', 'string', 'max:255'],
            'payload' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'network_id.required' => 'Network is required',
            'network_id.exists' => 'The selected network does not exist',
            'type.required' => 'Command type is required',
        ];
    }
}
