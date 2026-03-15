<?php

declare(strict_types=1);

// app/Models/Role.php
// Eloquent model for the roles table.

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Role extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'is_system_role',
    ];

    /**
     * Permissions attached to this role.
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(
            Permission::class,
            'role_permissions',
            'role_id',
            'permission_id'
        );
    }

    /**
     * Companies this role is assigned to (via role_companies).
     */
    public function companies(): BelongsToMany
    {
        return $this->belongsToMany(
            Company::class,
            'role_companies',
            'role_id',
            'company_id'
        );
    }

    /**
     * Scope: roles available for a given company (exist in role_companies).
     * Requires role_companies to be populated (e.g. run RoleSeeder or db:seed).
     */
    public function scopeForCompany(Builder $query, int $companyId): Builder
    {
        return $query->whereExists(function ($q) use ($companyId): void {
            $q->selectRaw('1')
                ->from('role_companies')
                ->whereColumn('role_companies.role_id', 'roles.id')
                ->where('role_companies.company_id', $companyId);
        });
    }
}
