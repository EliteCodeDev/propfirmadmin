import client from "@/api/client";
import type { BrokerAccount, CreateBrokerAccountDto, UpdateBrokerAccountDto, PageResponse } from "@/types";

export interface BrokerAccountQuery {
  page?: number;
  limit?: number;
  isUsed?: boolean;
  login?: string;
}

export const brokerAccountsApi = {
  list: async (
    query: BrokerAccountQuery = {}
  ): Promise<PageResponse<BrokerAccount>> => {
    const { data } = await client.get("/broker-accounts", { params: query });
    return data;
  },
  
  get: async (id: string): Promise<BrokerAccount> => {
    const { data } = await client.get(`/broker-accounts/${id}`);
    return data;
  },
  
  create: async (payload: CreateBrokerAccountDto): Promise<BrokerAccount> => {
    const { data } = await client.post("/broker-accounts", payload);
    return data;
  },
  
  update: async (
    id: string,
    payload: UpdateBrokerAccountDto
  ): Promise<BrokerAccount> => {
    const { data } = await client.patch(`/broker-accounts/${id}`, payload);
    return data;
  },
  
  remove: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await client.delete(`/broker-accounts/${id}`);
    return data;
  },
};