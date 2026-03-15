// src/types/role.ts
// Role type returned by GET /api/v1/roles/options (for dropdowns)

export interface Role {
    id: number;
    name: string;
    is_system_role: boolean;
}
