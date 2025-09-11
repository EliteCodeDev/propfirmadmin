import client from "@/api/client";
import { PaginatedResponse } from "@/types/pagination";

export interface ChallengeEntity {
  id: string;
  userId?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BrokerAccount {
  brokerAccountID: string;
  login: string;
  password: string;
  server: string;
  serverIp: string;
  platform: string;
  isUsed: boolean;
  investorPass: string;
  innitialBalance: string;
}

export interface ChallengeRelation {
  relationID: string;
  categoryID: string;
  planID: string;
  groupName: string | null;
}

export interface ChallengeWithDetails {
  challengeID: string;
  userID: string;
  relationID: string;
  startDate: string;
  endDate: string | null;
  numPhase: number;
  dynamicBalance: string | null;
  status: string;
  isActive: boolean;
  parentID: string | null;
  brokerAccountID: string;
  relation: ChallengeRelation;
  brokerAccount: BrokerAccount;
}

export interface ChallengeDetailedData {
  accountID: string;
  login: string;
  challengeId: string;
  status: string;
  createDateTime: string;
  lastUpdate: string;
  balance: {
    initialBalance: string;
    currentBalance: string;
    dailyBalance: string | null;
  };
  equity: number;
  openPositions: {
    positions: unknown[];
    lenght: number;
  };
  closedPositions: {
    positions: unknown[];
  };
}

export interface ChallengeQuery {
  page?: number;
  limit?: number;
  status?: string;
}

export interface CreateChallengePayload {
  relationId: string;
  planId: string;
  balanceId: string;
}

export interface UpdateChallengePayload {
  status?: string;
}

// Tipos para datos auxiliares (relaciones, categorías y planes disponibles)
export interface ChallengeRelationInfo {
  id: string;
  name: string;
}
export interface ChallengeCategoryInfo {
  id: string;
  name: string;
}
export interface ChallengePlanInfo {
  id: string;
  name: string;
}

export const challengesApi = {
  create: async (payload: CreateChallengePayload): Promise<ChallengeEntity> => {
    const { data } = await client.post("/challenges", payload);
    return data;
  },
  list: async (
    query: ChallengeQuery = {}
  ): Promise<PaginatedResponse<ChallengeEntity>> => {
    const { data } = await client.get("/challenges", { params: query });
    return data;
  },
  myChallenges: async (
    query: ChallengeQuery = {}
  ): Promise<PaginatedResponse<ChallengeEntity>> => {
    const { data } = await client.get("/challenges/my-challenges", {
      params: query,
    });
    return data;
  },
  get: async (id: string): Promise<ChallengeEntity> => {
    const { data } = await client.get(`/challenges/${id}`);
    return data;
  },
  update: async (
    id: string,
    payload: UpdateChallengePayload
  ): Promise<ChallengeEntity> => {
    const { data } = await client.patch(`/challenges/${id}`, payload);
    return data;
  },
  remove: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await client.delete(`/challenges/${id}`);
    return data;
  },
  availableRelations: async (): Promise<ChallengeRelationInfo[]> => {
    const { data } = await client.get("/challenges/templates/relations");
    return data;
  },
  availableCategories: async (): Promise<ChallengeCategoryInfo[]> => {
    const { data } = await client.get("/challenges/templates/categories");
    return data;
  },
  availablePlans: async (): Promise<ChallengePlanInfo[]> => {
    const { data } = await client.get("/challenges/templates/plans");
    return data;
  },
  // New methods for fetching detailed challenge data
  getChallengesWithDetails: async (userId?: string): Promise<{
    success: boolean;
    message: string;
    data: {
      data: ChallengeWithDetails[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> => {
    const params = userId ? { userID: userId, limit: 1000 } : { limit: 1000 };
    const { data } = await client.get("/challenges", { params });
    return data;
  },
  getChallengeDetails: async (challengeId: string): Promise<{
    success: boolean;
    message: string;
    data: ChallengeDetailedData;
  }> => {
    const { data } = await client.get(`/challenges/${challengeId}`);
    return data;
  },
};
