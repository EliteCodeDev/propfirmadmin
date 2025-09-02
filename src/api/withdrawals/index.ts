import client from "@/api/client";
import type { PageResponse } from "@/types/pagination";
import type { Withdrawal, UpdateWithdrawalStatusPayload } from "@/types";

export interface WithdrawalQuery {
  page?: number;
  limit?: number;
  status?: string; // backend acepta mayúsculas PENDING|APPROVED|REJECTED
  email?: string; // si se soporta filtrado por email en backend
}

export interface UpdateWithdrawalPayload {
  wallet?: string;
  observation?: string;
}

export const withdrawalsApi = {
  list: async (
    query: WithdrawalQuery = {}
  ): Promise<PageResponse<Withdrawal>> => {
    const { data } = await client.get("/withdrawals", { params: query });
    return data;
  },
  mine: async (
    query: WithdrawalQuery = {}
  ): Promise<PageResponse<Withdrawal>> => {
    const { data } = await client.get("/withdrawals/my-withdrawals", {
      params: query,
    });
    return data;
  },
  get: async (id: string): Promise<Withdrawal> => {
    const { data } = await client.get(`/withdrawals/${id}`);
    return data;
  },
  update: async (
    id: string,
    payload: UpdateWithdrawalPayload
  ): Promise<Withdrawal> => {
    const { data } = await client.patch(`/withdrawals/${id}`, payload);
    return data;
  },
  updateStatus: async (
    id: string,
    payload: UpdateWithdrawalStatusPayload
  ): Promise<Withdrawal> => {
    const { data } = await client.patch(`/withdrawals/${id}/status`, payload);
    return data;
  },
  remove: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await client.delete(`/withdrawals/${id}`);
    return data;
  },
};