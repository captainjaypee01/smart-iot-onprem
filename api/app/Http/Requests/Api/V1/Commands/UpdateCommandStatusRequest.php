<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Commands;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCommandStatusRequest extends FormRequest
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
            'processing_status' => [
                'required',
                'integer',
                'in:1,2,3,4',
            ],
            'message_status' => [
                'nullable',
                'integer',
                'in:1,2,3,4,5,6,7,8,9,10',
            ],
            'error_message' => [
                'nullable',
                'string',
                'max:1000',
            ],
            'acked_at' => [
                'nullable',
                'date',
            ],
            'dispatched_at' => [
                'nullable',
                'date',
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'processing_status.required' => 'Processing status is required.',
            'processing_status.in'       => 'Processing status must be one of: 1 (Pending), 2 (Processing), 3 (Sent), 4 (Failed).',
            'message_status.in'          => 'Message status must be a value between 1 and 10.',
            'error_message.max'          => 'Error message must not exceed 1000 characters.',
        ];
    }
}
