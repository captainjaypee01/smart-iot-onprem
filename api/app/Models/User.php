<?php

declare(strict_types=1);

// app/Models/User.php
// Eloquent model for the users table.
//
// UUID strategy:
//   - `uuid` is auto-generated in booted() on every new record.
//   - It is never exposed as a route key or PK — only surfaced in API responses
//     via UserResource. All internal FK relationships stay on integer `id`.
//   - Use $user->uuid when referencing the user in API responses or invite URLs.

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;

/**
 * @property-read \App\Models\Company|null $company
 * @property-read \App\Models\Role|null $role
 * @property-read \Illuminate\Support\Carbon $created_at
 * @property-read \Illuminate\Support\Carbon|null $last_login_at
 */
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'company_id',
        'role_id',
        'first_name',
        'last_name',
        'middle_name',
        'name',
        'email',
        'username',
        'password',
        'is_superadmin',
        'is_active',
        'status',
        'email_verified_at',
        'last_login_at',
        // uuid is NOT in fillable — it must only ever be set by booted(), never mass-assigned
    ];

    protected $hidden = [
        'id',           // integer PK — never leak this in serialisation
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'is_superadmin' => 'boolean',
            'is_active' => 'boolean',
            'status' => 'string',
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
        ];
    }

    // ─── UUID auto-generation ─────────────────────────────────────────────────

    protected static function booted(): void
    {
        static::creating(function (User $user): void {
            $user->uuid ??= (string) Str::uuid();
        });
    }

    // ─── Relationships ────────────────────────────────────────────────────────

    /**
     * The company this user belongs to.
     * Null for superadmin accounts.
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * The primary role assigned to this user.
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * Social provider accounts linked to this user (Microsoft, Google, etc.).
     */
    public function socialAccounts(): HasMany
    {
        return $this->hasMany(SocialAccount::class);
    }

    /**
     * Check if the user has a permission by key (e.g. 'user.view').
     * Superadmins bypass; otherwise checks role->permissions.
     */
    public function hasPermission(string $key): bool
    {
        if ($this->is_superadmin) {
            return true;
        }

        $role = $this->role;
        if ($role === null) {
            return false;
        }

        return $role->permissions()->where('key', $key)->exists();
    }
}
