// src/hooks/useGatewayPermissions.ts
// Gateway module permission helpers.
// Maps to API permission keys defined in gateway-module-contract.md.
// API enforces authoritatively; these helpers drive UX only.

import { usePermission } from '@/hooks/usePermission';

export interface UseGatewayPermissionsReturn {
  /** True if the user can list/view gateways (gateway.view). */
  canView: () => boolean;
  /** True if the user can create gateways (gateway.create). */
  canCreate: () => boolean;
  /** True if the user can update gateways (gateway.update). */
  canUpdate: () => boolean;
  /** True if the user can delete gateways (gateway.delete). */
  canDelete: () => boolean;
  /** True if the user can send gateway commands (gateway.send_command). */
  canSendCommand: () => boolean;
}

export const useGatewayPermissions = (): UseGatewayPermissionsReturn => {
  const { hasPermission } = usePermission();

  return {
    canView: () => hasPermission('gateway.view'),
    canCreate: () => hasPermission('gateway.create'),
    canUpdate: () => hasPermission('gateway.update'),
    canDelete: () => hasPermission('gateway.delete'),
    canSendCommand: () => hasPermission('gateway.send_command'),
  };
};
