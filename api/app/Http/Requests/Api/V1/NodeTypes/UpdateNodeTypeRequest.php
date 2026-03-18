<?php

declare(strict_types=1);

// app/Http/Requests/Api/V1/NodeTypes/UpdateNodeTypeRequest.php

namespace App\Http\Requests\Api\V1\NodeTypes;

use App\Models\NodeType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateNodeTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->is_superadmin ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $nodeTypeId = $this->route('node_type')?->id ?? $this->route('id');

        return [
            'name' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('node_types', 'name')->ignore($nodeTypeId),
            ],
            'area_id' => [
                'sometimes',
                'string',
                'regex:/^[0-9A-Fa-f]{1,10}$/',
                Rule::unique('node_types', 'area_id')->ignore($nodeTypeId),
            ],
            'description' => ['sometimes', 'nullable', 'string'],
            'sensors' => ['sometimes', 'array', 'max:8'],
            'sensors.*.name' => ['required_with:sensors', 'string', 'max:100'],
            'sensors.*.unit' => ['nullable', 'string', 'max:50'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            if ($this->has('area_id')) {
                $areaId = $this->input('area_id');
                $nodeTypeId = $this->route('node_type')?->id ?? $this->route('id');

                if (is_string($areaId)) {
                    $exists = NodeType::query()
                        ->where('area_id', strtoupper($areaId))
                        ->where('id', '!=', $nodeTypeId)
                        ->exists();

                    if ($exists) {
                        $validator->errors()->add(
                            'area_id',
                            'The area id has already been taken.'
                        );
                    }
                }
            }

            if (! $this->has('sensors')) {
                return;
            }

            /** @var array<int, array{name?: string|null}>|null $sensors */
            $sensors = $this->input('sensors');

            if (! is_array($sensors)) {
                return;
            }

            $seenEmpty = false;

            foreach ($sensors as $sensor) {
                $name = $sensor['name'] ?? null;

                if ($name === null || $name === '') {
                    $seenEmpty = true;
                } elseif ($seenEmpty) {
                    $validator->errors()->add(
                        'sensors',
                        'Sensor slots must be contiguous from slot 1 without gaps.'
                    );

                    break;
                }
            }
        });
    }
}

