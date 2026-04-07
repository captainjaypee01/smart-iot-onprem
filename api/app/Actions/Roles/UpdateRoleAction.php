<?php

declare(strict_types=1);

namespace App\Actions\Roles;

use App\DTO\Roles\UpdateRoleDTO;
use App\Models\Role;
use Illuminate\Support\Facades\DB;

class UpdateRoleAction
{
    public function execute(Role $role, UpdateRoleDTO $dto): Role
    {
        return DB::transaction(function () use ($role, $dto): Role {
            $updates = [];

            if ($dto->name !== null) {
                $updates['name'] = $dto->name;
            }

            if ($dto->isSystemRole !== null) {
                $updates['is_system_role'] = $dto->isSystemRole;
            }

            if (! empty($updates)) {
                $role->update($updates);
            }

            // Only sync when explicitly present (non-null = was in the request)
            if ($dto->featureIds !== null) {
                $role->features()->sync($dto->featureIds);
            }

            if ($dto->permissionIds !== null) {
                $role->permissions()->sync($dto->permissionIds);
            }

            if ($dto->networkIds !== null) {
                $role->networks()->sync($dto->networkIds);
            }

            if ($dto->companyIds !== null) {
                $role->companies()->sync($dto->companyIds);
            }

            return $role->load(['companies', 'features', 'permissions', 'networks']);
        });
    }
}
