// src/api/auth.ts
// API functions for authentication endpoints

import axiosClient from "./axiosClient";
import type { AuthResponse, LoginCredentials, MicrosoftRedirectResponse, SetPasswordPayload } from "@/types";

export const login = async (
    credentials: LoginCredentials
): Promise<AuthResponse> => {
    const res = await axiosClient.post<AuthResponse>("/auth/login", credentials);
    return res.data;
};

export const logout = async (): Promise<void> => {
    await axiosClient.post("/auth/logout");
};

export const getMe = async (): Promise<AuthResponse["user"]> => {
    const res = await axiosClient.get<AuthResponse["user"]>("/auth/me");
    return res.data;
};

// Returns the Microsoft OAuth redirect URL for the browser to follow
export const getMicrosoftRedirectUrl = async (): Promise<MicrosoftRedirectResponse> => {
    const res = await axiosClient.get<MicrosoftRedirectResponse>("/auth/microsoft/redirect");
    return res.data;
};

// Used on the /set-password page — called when a new user sets their password via invite link
export const setPassword = async (payload: SetPasswordPayload): Promise<AuthResponse> => {
    const res = await axiosClient.post<AuthResponse>("/auth/set-password", payload);
    return res.data;
};