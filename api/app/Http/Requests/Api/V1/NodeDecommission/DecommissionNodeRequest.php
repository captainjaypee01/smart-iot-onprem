<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\NodeDecommission;

use Illuminate\Foundation\Http\FormRequest;

class DecommissionNodeRequest extends FormRequest
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
        $user = $this->user();

        $allowedNetworkIds = null;
        if ($user !== null && ! $user->is_superadmin && $user->role !== null) {
            $allowedNetworkIds = $user->role->networks()->pluck('networks.id')->all();
        }

        return [
            'network_id' => [
                'required',
                'integer',
                'exists:networks,id',
                function (string $attribute, mixed $value, \Closure $fail) use ($user, $allowedNetworkIds): void {
                    if ($user === null || $user->is_superadmin) {
                        return;
                    }
                    if ($allowedNetworkIds !== null && ! in_array((int) $value, $allowedNetworkIds, true)) {
                        $fail('The selected network is not accessible to your account.');
                    }
                },
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'network_id.required' => 'A network must be selected.',
            'network_id.exists' => 'The selected network does not exist.',
        ];
    }
}
