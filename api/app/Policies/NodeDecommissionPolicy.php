<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\User;

/**
 * NodeDecommission policy — permission-key based.
 *
 * Superadmins bypass all checks via Laravel's before() hook,
 * which is invoked automatically by the framework when the User model
 * implements the before-hook pattern (see User::before or policy registration).
 */
class NodeDecommissionPolicy
{
    /**
     * Before hook — superadmins bypass all checks.
     */
    public function before(User $user): ?bool
    {
        return $user->is_superadmin ? true : null;
    }

    /**
     * Gate for listing nodes and viewing decommission history.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('node_decommission.view');
    }

    /**
     * Gate for sending a decommission command.
     */
    public function decommission(User $user): bool
    {
        return $user->hasPermission('node_decommission.decommission');
    }

    /**
     * Gate for resending a decommission command and sending a verification command.
     */
    public function verify(User $user): bool
    {
        return $user->hasPermission('node_decommission.verify');
    }

    /**
     * Gate for manually marking a node as decommissioned.
     */
    public function manualDecommission(User $user): bool
    {
        return $user->hasPermission('node_decommission.manual_decommission');
    }
}
