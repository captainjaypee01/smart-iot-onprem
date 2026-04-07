<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Features;

use Illuminate\Foundation\Http\FormRequest;

class ReorderGroupsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->is_superadmin ?? false;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'groups' => ['required', 'array', 'min:1'],
            'groups.*.group' => ['required', 'string', 'exists:features,group'],
            'groups.*.group_order' => ['required', 'integer', 'min:0'],
        ];
    }

    /**
     * @param  mixed  $validator
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $groups = $this->input('groups', []);

            if (! is_array($groups)) {
                return;
            }

            foreach ($groups as $index => $group) {
                if (($group['group'] ?? null) === 'admin') {
                    $validator->errors()->add(
                        "groups.$index.group",
                        'The admin group cannot be reordered.'
                    );
                }
            }
        });
    }
}
