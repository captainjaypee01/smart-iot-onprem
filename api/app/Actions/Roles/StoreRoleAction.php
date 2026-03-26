<?php

declare(strict_types=1);

namespace App\Actions\Roles;

use App\DTO\Roles\StoreRoleDTO;
use App\Models\Role;
use Illuminate\Support\Facades\DB;

class StoreRoleAction
{
    public function execute(StoreRoleDTO $dto): Role
    {
        return DB::transaction(function () use ($dto): Role {
            $role = Role::create([
                'name' => $dto->name,
                'is_system_role' => $dto->isSystemRole,
            ]);

            $role->companies()->attach($dto->companyIds);
            $role->features()->sync($dto->featureIds);
            $role->permissions()->sync($dto->permissionIds);
            $role->networks()->sync($dto->networkIds);

            return $role->load(['companies', 'features', 'permissions', 'networks']);
        });
    }
}

