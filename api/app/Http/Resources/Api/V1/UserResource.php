<?php

declare(strict_types=1);

// app/Http/Resources/Api/V1/UserResource.php
// JSON shape for an authenticated user.
// Must stay in sync with the TypeScript `User` interface in src/types/auth.ts.
// Never expose: password, remember_token, or any token.

namespace App\Http\Resources\Api\V1;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     * Shape per docs/specs/user-module-contract.md. Never expose password, remember_token, tokens.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var User $user */
        $user = $this->resource;

        return [
            'id' => $user->id,
            'uuid' => $user->uuid,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'name' => $user->name,
            'email' => $user->email,
            'username' => $user->username,
            'is_superadmin' => (bool) $user->is_superadmin,
            'is_active' => (bool) $user->is_active,
            'status' => $user->status,
            'company' => $this->whenLoaded('company', fn () => $user->company ? [
                'id' => $user->company->id,
                'name' => $user->company->name,
                'code' => $user->company->code,
            ] : null),
            'role' => $this->whenLoaded('role', fn () => $user->role ? [
                'id' => $user->role->id,
                'name' => $user->role->name,
            ] : null),
            'last_login_at' => $user->last_login_at?->toIso8601String(),
            'created_at' => $user->created_at->toIso8601String(),
        ];
    }
}
