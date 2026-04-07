<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Gateway;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGatewayRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'is_test_mode' => ['sometimes', 'boolean'],
            'service_id' => ['sometimes', 'required', 'string', 'max:100'],
            'asset_id' => ['sometimes', 'nullable', 'string', 'max:100'],
            'device_key' => ['sometimes', 'nullable', 'string', 'max:100'],
            'location' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }
}
