<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Commands;

use App\Models\Network;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateSendDataCommandRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Policy authorization is handled in the controller via $this->authorize()
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $user = $this->user();

        // Build the list of network IDs the user is allowed to send to
        $allowedNetworkIds = null;
        if ($user !== null && ! $user->is_superadmin && $user->role !== null) {
            $allowedNetworkIds = $user->role->networks()->pluck('networks.id')->all();
        }

        return [
            'network_id' => [
                'required',
                'integer',
                Rule::exists('networks', 'id'),
                // Non-superadmins are restricted to their accessible networks
                function (string $attribute, mixed $value, \Closure $fail) use ($user, $allowedNetworkIds): void {
                    if ($user === null) {
                        return;
                    }
                    if ($user->is_superadmin) {
                        return;
                    }
                    if ($allowedNetworkIds !== null && ! in_array((int) $value, $allowedNetworkIds, true)) {
                        $fail('The selected network is not accessible to your account.');
                    }
                },
            ],
            'node_address' => [
                'required',
                'string',
                'max:10',
                'regex:/^[0-9A-Fa-f]+$/',
            ],
            'source_ep' => [
                'nullable',
                'integer',
                'min:1',
                'max:255',
            ],
            'dest_ep' => [
                'nullable',
                'integer',
                'min:1',
                'max:255',
            ],
            'payload' => [
                'nullable',
                'string',
                'regex:/^[0-9A-Fa-f]*$/',
            ],
            'include_tracking_id' => [
                'required',
                'string',
                Rule::in(['auto', 'manual', 'none']),
            ],
            'packet_id' => [
                'nullable',
                'string',
                'regex:/^[0-9A-Fa-f]{4}$/',
                'required_if:include_tracking_id,manual',
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
            'node_address.required' => 'Node address is required.',
            'node_address.regex' => 'Node address must contain only hexadecimal characters (0-9, A-F).',
            'node_address.max' => 'Node address must not exceed 10 characters.',
            'source_ep.integer' => 'Source endpoint must be an integer.',
            'source_ep.min' => 'Source endpoint must be at least 1.',
            'source_ep.max' => 'Source endpoint must not exceed 255.',
            'dest_ep.integer' => 'Destination endpoint must be an integer.',
            'dest_ep.min' => 'Destination endpoint must be at least 1.',
            'dest_ep.max' => 'Destination endpoint must not exceed 255.',
            'payload.regex' => 'Payload must contain only hexadecimal characters.',
            'include_tracking_id.required' => 'The include_tracking_id field is required.',
            'include_tracking_id.in' => 'Tracking ID mode must be one of: auto, manual, none.',
            'packet_id.regex' => 'Packet ID must be exactly 4 hexadecimal characters.',
            'packet_id.required_if' => 'Packet ID is required when tracking mode is manual.',
        ];
    }
}
