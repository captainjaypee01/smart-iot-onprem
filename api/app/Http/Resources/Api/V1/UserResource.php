<?php

// app/Http/Resources/Api/V1/UserResource.php
// JSON shape for an authenticated user.
// Must stay in sync with the TypeScript `User` interface in src/types/auth.ts.
//
// TS shape reference:
//   id: string (uuid),  name, email, is_superadmin, is_active,
//   company: { id: string, name, code } | null,
//   role: { id: string, name, is_system_role, permissions: string[] } | null,
//   last_login_at: string | null,
//   created_at: string
//
// Integer primary keys (`id`) are intentionally omitted from all responses.
// Only `uuid` is exposed externally — this prevents enumeration of users,
// companies, and roles through predictable integer sequences.

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * Relationships expected to be loaded before calling:
     *   - company
     *   - role.permissions
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $role = $this->role;

        return [
            // uuid exposed as `id` — the frontend never needs to know the integer PK
            'id'            => $this->uuid,

            'name'          => $this->name,
            'email'         => $this->email,
            'is_superadmin' => (bool) $this->is_superadmin,
            'is_active'     => (bool) $this->is_active,

            'company'       => $this->company ? [
                'id'   => $this->company->id,   // integer fine here — not user-facing enumerable
                'name' => $this->company->name,
                'code' => $this->company->code,
            ] : null,

            'role'          => $role ? [
                'id'             => $role->id,  // integer fine — role list is not sensitive
                'name'           => $role->name,
                'is_system_role' => (bool) $role->is_system_role,
                'permissions'    => $role->permissions
                    ->pluck('key')
                    ->values()
                    ->all(),
            ] : null,

            'last_login_at' => $this->last_login_at?->toISOString(),
            'created_at'    => $this->created_at->toISOString(),
        ];
    }
}