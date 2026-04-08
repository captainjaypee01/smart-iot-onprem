// src/hooks/useNodeDecommissionPermissions.ts
// Node Decommission module permission helpers.
// Maps to API permission keys defined in node-decommission-module-contract.md.
// API enforces authoritatively; these helpers drive UX only.

import { usePermission } from '@/hooks/usePermission';

export interface UseNodeDecommissionPermissionsReturn {
  /** True if the user can view the node decommission page and lists (node_decommission.view). */
  canViewNodeDecommission: () => boolean;
  /** True if the user can send a decommission command (node_decommission.decommission). */
  canDecommissionNode: () => boolean;
  /** True if the user can send verify/resend commands (node_decommission.verify). */
  canVerifyDecommission: () => boolean;
  /** True if the user can manually mark a node decommissioned (node_decommission.manual_decommission). */
  canManualDecommission: () => boolean;
}

export const useNodeDecommissionPermissions = (): UseNodeDecommissionPermissionsReturn => {
  const { hasPermission } = usePermission();

  return {
    canViewNodeDecommission: () => hasPermission('node_decommission.view'),
    canDecommissionNode: () => hasPermission('node_decommission.decommission'),
    canVerifyDecommission: () => hasPermission('node_decommission.verify'),
    canManualDecommission: () => hasPermission('node_decommission.manual_decommission'),
  };
};
