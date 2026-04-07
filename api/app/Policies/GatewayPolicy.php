<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Gateway;
use App\Models\User;

/**
 * Gateway policy — role-based, not superadmin-only.
 *
 * Gateway management is restricted to internal platform roles
 * (Platform Admin, Platform Support, etc.) via role_permissions.
 * Company/tenant users never hold gateway.* permission keys so they
 * are denied at the permission level without any superadmin flag check.
 *
 * Superadmins bypass all policy checks automatically via Laravel's
 * built-in `before()` hook (registered in AuthServiceProvider or via
 * the User model's `can()` short-circuit).
 */
class GatewayPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('gateway.view');
    }

    public function view(User $user, Gateway $gateway): bool
    {
        return $user->hasPermission('gateway.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermission('gateway.create');
    }

    public function update(User $user, Gateway $gateway): bool
    {
        return $user->hasPermission('gateway.update');
    }

    public function delete(User $user, Gateway $gateway): bool
    {
        return $user->hasPermission('gateway.delete');
    }

    public function sendCommand(User $user, Gateway $gateway): bool
    {
        return $user->hasPermission('gateway.send_command');
    }
}
