// src/api/commands.ts
// API functions for the Command Console module endpoints

import axiosClient from './axiosClient';
import type {
    CommandFilters,
    CommandListResponse,
    CommandRecord,
    SendCommandPayload,
} from '@/types/command';

/**
 * POST /api/v1/commands
 * Send a new send_data command to a node.
 * Requires command.create permission.
 */
export const sendCommand = async (
    payload: SendCommandPayload,
): Promise<CommandRecord> => {
    const res = await axiosClient.post('/v1/commands', payload);
    return (res.data as { data: CommandRecord }).data;
};

/**
 * GET /api/v1/commands
 * Fetch paginated command history, scoped to the user's accessible networks.
 * Requires command.view permission.
 */
export const getCommands = async (
    filters?: CommandFilters & { page?: number; per_page?: number },
): Promise<CommandListResponse> => {
    const res = await axiosClient.get('/v1/commands', { params: filters });
    return res.data as CommandListResponse;
};

/**
 * GET /api/v1/commands/{id}
 * Fetch a single command by ID.
 */
export const getCommand = async (id: string): Promise<CommandRecord> => {
    const res = await axiosClient.get(`/v1/commands/${id}`);
    return (res.data as { data: CommandRecord }).data;
};

/**
 * POST /api/v1/commands/{id}/resend
 * Resend an existing send_data command.
 * Requires command.create permission + ownership (or superadmin).
 */
export const resendCommand = async (id: string): Promise<CommandRecord> => {
    const res = await axiosClient.post(`/v1/commands/${id}/resend`);
    return (res.data as { data: CommandRecord }).data;
};
