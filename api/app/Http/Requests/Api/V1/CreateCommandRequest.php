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
            'device_id' => ['nullable', 'string', 'max:255'],
            'type' => ['required', 'string', 'max:255'],
            'payload' => ['required', 'array'],
        ];
    }

    public function messages(): array
    {
        return [
            'type.required' => 'Command type is required',
            'payload.required' => 'Command payload is required',
            'payload.array' => 'Command payload must be an object',
        ];
    }
}
