// src/types/user.ts
// User API resource and payload types for the users module (GET/POST/PUT/DELETE /api/v1/users).
// Matches docs/specs/user-module-contract.md exactly.
import type { FeatureSummary } from "./feature";
import type { NetworkSummary } from "./auth";

/** Role names from the API — use this type instead of string literals for role checks. */
export type UserRole = "superadmin" | "admin" | "viewer" | "user";

/** Company as returned in UserResource. */
export interface UserCompany {
    id: number;
    name: string;
    code: string;
}

/** Role as returned in UserResource (id + name only). */
export interface UserRoleRef {
    id: number;
    name: string;
}

/** User resource shape from GET /api/v1/users and GET /api/v1/users/{id} (and GET /auth/me). */
export interface User {
    id: number;
    uuid: string;
    first_name: string;
    last_name: string;
    name: string;
    email: string;
    username: string | null;
    is_superadmin: boolean;
    is_active: boolean;
    status: "active" | "locked" | "disabled";
    company: UserCompany | null;
    role: UserRoleRef | null;
    last_login_at: string | null;
    created_at: string;

    // Populated by GET /api/v1/auth/me (feature registry + network registry).
    // Used by the UI to dynamically render navigation + route guards.
    features: FeatureSummary[];
    networks: NetworkSummary[];
}

/** Payload for POST /api/v1/users (invite user or direct create with password for superadmin). */
export interface StoreUserPayload {
    first_name: string;
    last_name: string;
    email: string;
    username: string | null;
    company_id: number;
    role_id: number;
    /** Optional flag: when false (superadmin-only), API expects password and skips invite flow. Defaults to true when omitted. */
    use_invite?: boolean;
    /** Required when use_invite is false (superadmin-only direct create with password). */
    password?: string;
}

/** Payload for PUT /api/v1/users/{id} (update user). */
export interface UpdateUserPayload {
    first_name?: string;
    last_name?: string;
    email?: string;
    username?: string | null;
    role_id?: number | null;
    company_id?: number | null;
    status?: "active" | "locked" | "disabled";
}
