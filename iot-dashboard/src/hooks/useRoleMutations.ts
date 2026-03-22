// src/hooks/useRoleMutations.ts
// Mutation wrappers for Role create/update/delete.

import { useCallback } from "react";
import { createRole, updateRole, deleteRole } from "@/api/roles";
import type { StoreRolePayload, UpdateRolePayload } from "@/types/role";
import type { Role } from "@/types/role";

export const useCreateRole = () => {
    const mutate = useCallback(async (payload: StoreRolePayload): Promise<Role> => {
        return createRole(payload);
    }, []);

    return { createRole: mutate };
};

export const useUpdateRole = () => {
    const mutate = useCallback(async (id: number, payload: UpdateRolePayload): Promise<Role> => {
        return updateRole(id, payload);
    }, []);

    return { updateRole: mutate };
};

export const useDeleteRole = () => {
    const remove = useCallback(async (id: number): Promise<void> => {
        return deleteRole(id);
    }, []);

    return { deleteRole: remove };
};

