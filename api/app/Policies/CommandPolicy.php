<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Command;
use App\Models\User;

class CommandPolicy
{
    /**
     * View the command history list.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermission('command.view');
    }

    /**
     * View a single command record.
     * Non-superadmins may only view commands on networks accessible to their role.
     */
    public function view(User $user, Command $command): bool
    {
        if (! $user->hasPermission('command.view')) {
            return false;
        }

        if ($user->is_superadmin) {
            return true;
        }

        $networkIds = $user->role?->networks()->pluck('networks.id')->all() ?? [];

        return in_array($command->network_id, $networkIds, true);
    }

    /**
     * Create (send) a new send_data command.
     */
    public function create(User $user): bool
    {
        return $user->hasPermission('command.create');
    }

    /**
     * Resend an existing send_data command.
     * User must have command.create AND be the original creator (or superadmin).
     */
    public function resend(User $user, Command $command): bool
    {
        if (! $user->hasPermission('command.create')) {
            return false;
        }

        // Superadmins may resend any command
        if ($user->is_superadmin) {
            return true;
        }

        // Regular users may only resend their own commands
        return $command->created_by === $user->id;
    }
}
