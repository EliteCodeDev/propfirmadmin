import client from "@/api/client";
import { PaginatedResponse } from "@/types/pagination";

export interface UserEntity {
  id: string;
  username: string;
  email: string;
  roles?: string[];
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface CreateUserPayload {
  username: string;
  email: string;
  password?: string;
}

export interface UpdateUserPayload {
  username?: string;
  email?: string;
  password?: string;
  status?: string;
}

export const usersApi = {
  create: async (payload: CreateUserPayload): Promise<UserEntity> => {
    const { data } = await client.post("/users", payload);
    return data;
  },
  list: async (
    query: UserQuery = {}
  ): Promise<PaginatedResponse<UserEntity>> => {
    const { data } = await client.get("/users", { params: query });
    return data;
  },
  get: async (id: string): Promise<UserEntity> => {
    const { data } = await client.get(`/users/${id}`);
    return data;
  },
  profile: async (): Promise<UserEntity> => {
    const { data } = await client.get("/users/profile");
    return data;
  },
  updateProfile: async (payload: UpdateUserPayload): Promise<UserEntity> => {
    const { data } = await client.patch("/users/profile", payload);
    return data;
  },
  update: async (
    id: string,
    payload: UpdateUserPayload
  ): Promise<UserEntity> => {
    const { data } = await client.patch(`/users/${id}`, payload);
    return data;
  },
  remove: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await client.delete(`/users/${id}`);
    return data;
  },
};
