// src/types/auth.ts
// TypeScript interfaces for authentication domain.
//
// Note on `id` fields:
//   User.id is a UUID string — the backend exposes the uuid column, not the
//   integer primary key. This prevents enumeration attacks on public-facing IDs.
//   Company.id and Role.id remain numbers as they are not user-enumerable resources.

export interface Company {
    id: number;
    name: string;
    code: string;
}

export interface Role {
    id: number;
    name: string;
    is_system_role: boolean;
    permissions: string[];
}

export interface User {
    id: string;          // UUID — maps to users.uuid, NOT users.id (integer)
    name: string;
    email: string;
    is_superadmin: boolean;
    is_active: boolean;
    company: Company | null;
    role: Role | null;
    last_login_at: string | null;
    created_at: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface AuthResponse {
    user: User;
    token: string;
}

export interface SetPasswordPayload {
    email: string;
    token: string;
    password: string;
    password_confirmation: string;
}

export interface MicrosoftRedirectResponse {
    redirect_url: string;
}

export type SsoError =
    | "sso_failed"
    | "no_email"
    | "account_not_found"
    | "account_disabled";

export interface ApiError {
    message: string;
    errors?: Record<string, string[]>;
}