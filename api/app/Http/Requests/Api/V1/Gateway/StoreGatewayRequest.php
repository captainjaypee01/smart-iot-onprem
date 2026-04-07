<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Gateway;

use App\Models\Network;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreGatewayRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('is_test_mode')) {
            $this->merge([
                'is_test_mode' => filter_var($this->input('is_test_mode'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? $this->input('is_test_mode'),
            ]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'network_id' => ['required', 'integer', 'exists:networks,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_test_mode' => ['nullable', 'boolean'],
            'service_id' => ['required', 'string', 'max:100'],
            'asset_id' => ['nullable', 'string', 'max:100'],
            'device_key' => ['nullable', 'string', 'max:100'],
            'location' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            // Only proceed if network_id passed base validation (i.e. the network exists).
            if ($validator->errors()->has('network_id')) {
                return;
            }

            $networkId = (int) $this->input('network_id');
            $network = Network::find($networkId);

            if ($network === null) {
                return;
            }

            // When the network has no gateway_prefix yet, the field is required
            // and must be globally unique uppercase alphanumeric (max 10 chars).
            if ($network->gateway_prefix === null) {
                $gatewayPrefix = $this->input('gateway_prefix');

                if ($gatewayPrefix === null || $gatewayPrefix === '') {
                    $validator->errors()->add(
                        'gateway_prefix',
                        'The gateway prefix is required for the first gateway in this network.'
                    );

                    return;
                }

                if (! is_string($gatewayPrefix) || ! preg_match('/^[A-Z0-9]+$/', $gatewayPrefix)) {
                    $validator->errors()->add(
                        'gateway_prefix',
                        'The gateway prefix may only contain uppercase letters and digits.'
                    );

                    return;
                }

                if (strlen($gatewayPrefix) > 10) {
                    $validator->errors()->add(
                        'gateway_prefix',
                        'The gateway prefix must not exceed 10 characters.'
                    );

                    return;
                }

                $taken = Network::where('gateway_prefix', $gatewayPrefix)->exists();

                if ($taken) {
                    $validator->errors()->add(
                        'gateway_prefix',
                        'The gateway prefix has already been taken by another network.'
                    );
                }
            }
            // When the network already has a prefix the field is silently ignored;
            // no validation error is raised even if a value is supplied.
        });
    }
}
