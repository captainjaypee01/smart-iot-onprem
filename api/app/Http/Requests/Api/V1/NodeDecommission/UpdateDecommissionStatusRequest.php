<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\NodeDecommission;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDecommissionStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Authorization handled by InternalToken middleware at the route level
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'result' => ['required', 'string', 'in:success,error'],
            'command_type' => ['required', 'string', 'in:decommission,verify'],
            'error_message' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'result.required' => 'Result is required.',
            'result.in' => 'Result must be one of: success, error.',
            'command_type.required' => 'Command type is required.',
            'command_type.in' => 'Command type must be one of: decommission, verify.',
        ];
    }
}
