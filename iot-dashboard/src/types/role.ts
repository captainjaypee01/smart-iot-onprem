// src/types/role.ts
// Role types for the Role module (list, show, and options dropdowns)

export interface RoleFeature {
    id: number;
    key: string;
    name: string;
    icon: string | null;
}

export interface RolePermission {
    id: number;
    key: string;
    display_name: string;
}

export interface RoleNetwork {
    id: number;
    name: string;
    network_address: string;
}

export interface RoleCompany {
    id: number;
    name: string;
    code: string;
}

export interface Role {
    id: number;
    name: string;
    is_system_role: boolean;
    /**
     * Legacy singular company field (kept for backward compatibility).
     * Prefer `companies`.
     */
    company?: RoleCompany | null;
    /**
     * Companies this role is assigned to via `role_companies`.
     */
    companies?: RoleCompany[];
    features: RoleFeature[];
    permissions: RolePermission[];
    networks: RoleNetwork[];
    features_count: number;
    permissions_count: number;
    networks_count: number;
    users_count: number;
    created_at: string;
    updated_at: string;
}

export interface RoleListResponse {
    data: Role[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    links: {
        first: string;
        next: string | null;
        prev: string | null;
        last: string;
    };
}

// Lightweight dropdown payload: GET /api/v1/roles/options
export interface RoleOption {
    id: number;
    name: string;
    is_system_role: boolean;
}

export interface StoreRolePayload {
    name: string;
    company_id?: number; // legacy superadmin only
    company_ids?: number[]; // superadmin only (multi-company)
    is_system_role?: boolean; // superadmin only
    feature_ids?: number[];
    permission_ids?: number[];
    network_ids?: number[];
}

// Nullable/omitted semantics:
// - omission => skip pivot updates
// - empty array => clear pivot
export interface UpdateRolePayload {
    name?: string;
    is_system_role?: boolean; // superadmin only
    company_ids?: number[]; // superadmin only
    feature_ids?: number[];
    permission_ids?: number[];
    network_ids?: number[];
    // company_id is prohibited on PUT
}
