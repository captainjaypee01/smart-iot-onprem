// src/types/permission.ts
// TypeScript types for permission entities and grouped permission responses.

export interface Permission {
    id: number;
    key: string;
    display_name: string;
    module: string;
    description: string | null;
    created_at: string;
}

export interface PermissionGroup {
    module: string;
    label: string;
    permissions: Permission[];
}

export interface PermissionsGroupedResponse {
    data: PermissionGroup[];
}

export interface PermissionOption {
    id: number;
    key: string;
    display_name: string;
    module: string;
}

