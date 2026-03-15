// src/api/users.ts
// API functions for user management (CRUD, resend invite, disable). Uses axiosClient only; CSRF before state-changing methods.
// Paths use user id (number) for Laravel route model binding.

import axiosClient from "./axiosClient";
import { getCsrfCookie } from "./auth";
import type { User, StoreUserPayload, UpdateUserPayload } from "@/types/user";
import type { PaginatedResponse } from "@/types";

type UsersListResponse = PaginatedResponse<User>;

export const getUsers = async (
    page: number,
    perPage: number = 15
): Promise<UsersListResponse> => {
    const res = await axiosClient.get<UsersListResponse>("/users", {
        params: { page, per_page: perPage },
    });
    return res.data;
};

/** @param id User id (number) for Laravel route binding */
export const getUserById = async (id: number): Promise<User> => {
    const res = await axiosClient.get<{ data: User }>(`/users/${id}`);
    return res.data.data;
};

export const storeUser = async (payload: StoreUserPayload): Promise<User> => {
    await getCsrfCookie();
    const res = await axiosClient.post<User>("/users", payload);
    // UserController@store returns new UserResource($user) directly, not wrapped
    return res.data;
};

/** @param id User id (number) for Laravel route binding */
export const updateUser = async (
    id: number,
    payload: UpdateUserPayload
): Promise<User> => {
    await getCsrfCookie();
    const res = await axiosClient.put<User>(`/users/${id}`, payload);
    // UserController@update returns new UserResource($user) directly, not wrapped
    return res.data;
};

/** @param id User id (number) for Laravel route binding */
export const deleteUser = async (id: number): Promise<void> => {
    await getCsrfCookie();
    await axiosClient.delete(`/users/${id}`);
};

/** @param id User id (number) for Laravel route binding */
export const resendInvite = async (id: number): Promise<void> => {
    await getCsrfCookie();
    await axiosClient.post(`/users/${id}/resend-invite`);
};

/** @param id User id (number) for Laravel route binding */
export const disableUser = async (id: number): Promise<void> => {
    await getCsrfCookie();
    await axiosClient.post(`/users/${id}/disable`);
};
