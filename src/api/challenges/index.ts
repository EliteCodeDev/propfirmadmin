import client from "@/api/client";
import { PaginatedResponse } from "@/types/pagination";

export interface ChallengeEntity {
  id: string;
  userId?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
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
};
