// src/hooks/useCommandPermissions.ts
// Command Console module permission helpers.
// Maps to API permission keys defined in the command-module-contract.md.
// API enforces authoritatively; these helpers drive UX only.

import { usePermission } from '@/hooks/usePermission';

export interface UseCommandPermissionsReturn {
    /** True if the user can view command history (command.view). */
    canViewCommands: () => boolean;
    /** True if the user can send or resend commands (command.create). */
    canCreateCommand: () => boolean;
}

export const useCommandPermissions = (): UseCommandPermissionsReturn => {
    const { hasPermission } = usePermission();

    return {
        canViewCommands: () => hasPermission('command.view'),
        canCreateCommand: () => hasPermission('command.create'),
    };
};
