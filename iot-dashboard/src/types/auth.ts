// src/types/auth.ts
// TypeScript interfaces for authentication domain.
// User shape matches UserResource from docs/specs/user-module-contract.md (re-exported from user.ts).

import type { User } from "./user";
export type { User } from "./user";

export interface Company {
    id: number;
    name: string;
    code: string;
}

export interface Role {
    id: number;
    name: string;
    is_system_role: boolean;
    permissions?: string[];
}

export interface LoginCredentials {
    email: string;
    password: string;
}

/** API auth responses (cookie-based: no token in response). */
export interface AuthResponse {
    user: User;
    /** Permission keys for the current user (e.g. 'user.view', 'user.create'). Included in /auth/me, login, set-password. */
    permissions?: string[];
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