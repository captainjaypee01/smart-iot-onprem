// src/api/auth.ts
// API functions for authentication endpoints

import axiosClient from "./axiosClient";
import type { AuthResponse, LoginCredentials } from "@/types";

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