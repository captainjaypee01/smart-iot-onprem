<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Gateway;

use App\Enums\GatewayCommandType;
use App\Enums\GatewayDiagnosticType;
use App\Enums\GatewayServiceName;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SendGatewayCommandRequest extends FormRequest
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
            'type' => [
                'required',
                'string',
                Rule::in(array_column(GatewayCommandType::cases(), 'value')),
            ],
            'diagnostic_type' => [
                Rule::requiredIf(fn () => $this->input('type') === GatewayCommandType::Diagnostic->value),
                'nullable',
                'string',
                Rule::in(array_column(GatewayDiagnosticType::cases(), 'value')),
            ],
            'service_name' => [
                Rule::requiredIf(fn () => $this->input('diagnostic_type') === GatewayDiagnosticType::ServiceRestart->value),
                'nullable',
                'string',
                Rule::in(array_column(GatewayServiceName::cases(), 'value')),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'type.required' => 'A command type is required.',
            'type.in' => 'The selected command type is not valid.',
            'diagnostic_type.required' => 'A diagnostic type is required when the command type is diagnostic.',
            'diagnostic_type.in' => 'The selected diagnostic type is not valid.',
            'service_name.required' => 'A service name is required when the diagnostic type is service_restart.',
            'service_name.in' => 'The selected service name is not valid.',
        ];
    }
}
