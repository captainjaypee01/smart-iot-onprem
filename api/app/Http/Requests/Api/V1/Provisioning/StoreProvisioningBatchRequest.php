<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Provisioning;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Validator;

class StoreProvisioningBatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->is_superadmin ?? false;
    }

    public function rules(): array
    {
        return [
            'network_id'          => ['required', 'integer', 'exists:networks,id'],
            'target_node_id'      => ['required', 'string', 'max:10'],
            'is_auto_register'    => ['sometimes', 'boolean'],
            'nodes'               => ['required', 'array', 'min:1', 'max:10'],
            'nodes.*.service_id'  => ['required', 'string', 'max:255'],
            'nodes.*.node_address' => ['required', 'string', 'max:10'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $nodes = $this->input('nodes', []);

            if (! is_array($nodes)) {
                return;
            }

            // Uniqueness of service_ids within the batch
            $serviceIds = array_column($nodes, 'service_id');
            $serviceIds = array_filter($serviceIds, fn ($id) => is_string($id));

            if (count($serviceIds) !== count(array_unique($serviceIds))) {
                $v->errors()->add('nodes', 'All service_id values within the batch must be unique.');
            }

            // None may already exist in nodes.service_id
            $duplicates = DB::table('nodes')->whereIn('service_id', $serviceIds)->exists();
            if ($duplicates) {
                $v->errors()->add('nodes', 'One or more service_id values already exist in the system.');
            }
        });
    }
}
