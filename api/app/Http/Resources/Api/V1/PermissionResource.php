<?php

declare(strict_types=1);

// app/Http/Resources/Api/V1/PermissionResource.php
// JSON shape for Permission entities.

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property int $id
 * @property string $key
 * @property string $display_name
 * @property string $module
 * @property string|null $description
 * @property \Illuminate\Support\Carbon $created_at
 */
final class PermissionResource extends JsonResource
{
    /**
     * @return array<string,mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'key' => $this->key,
            'display_name' => $this->display_name,
            'module' => $this->module,
            'description' => $this->description,
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
