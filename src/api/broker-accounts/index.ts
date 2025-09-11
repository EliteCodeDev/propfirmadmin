import client from "@/api/client";
import { PaginatedResponse } from "@/types/pagination";
import {
  BrokerAccount,
  GenerateBrokerAccountDto,
  GenerateBrokerAccountResponse,
} from "@/types/broker";

export interface BrokerAccountQuery {
  page?: number;
  limit?: number;
  search?: string;
  isUsed?: boolean;
}

export interface CreateBrokerAccountPayload {
  login: string;
  server?: string;
  serverIp?: string;
  platform?: string;
  investorPass?: string;
  initialBalance?: number;
  isUsed?: boolean;
}

export interface UpdateBrokerAccountPayload {
  login?: string;
  server?: string;
  serverIp?: string;
  platform?: string;
  investorPass?: string;
  initialBalance?: number;
  isUsed?: boolean;
}

export const brokerAccountsApi = {
  create: async (
    payload: CreateBrokerAccountPayload
  ): Promise<BrokerAccount> => {
    const { data } = await client.post("/broker-accounts", payload);
    return data;
  },
  list: async (
    query: BrokerAccountQuery = {}
  ): Promise<PaginatedResponse<BrokerAccount>> => {
    const { data } = await client.get("/broker-accounts", { params: query });
    return data;
  },
  get: async (id: string): Promise<BrokerAccount> => {
    const { data } = await client.get(`/broker-accounts/${id}`);
    return data;
  },
  update: async (
    id: string,
    payload: UpdateBrokerAccountPayload
  ): Promise<BrokerAccount> => {
    const { data } = await client.patch(`/broker-accounts/${id}`, payload);
    return data;
  },
  remove: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await client.delete(`/broker-accounts/${id}`);
    return data;
  },
  generate: async (
    payload: GenerateBrokerAccountDto
  ): Promise<GenerateBrokerAccountResponse> => {
    const { data } = await client.post("/broker-accounts/generate", payload);
    return data.data.data;
  },
};
