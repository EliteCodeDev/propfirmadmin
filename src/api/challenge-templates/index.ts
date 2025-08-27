import client from "@/api/client";

// Tipos basados en las entidades del backend
import {
  ChallengeCategory,
  ChallengePlan,
  ChallengeBalance,
  ChallengeRelation,
  ChallengeStage,
  StageRule,
  StageParameter,
  RelationStage,
} from "@/types/challenge-template";

// Payloads genéricos

// Tipos para crear y actualizar basados en los DTOs del backend
export interface CreateCategoryPayload {
  name: string;
}
export type UpdateCategoryPayload = Partial<CreateCategoryPayload>;

export interface CreatePlanPayload {
  name: string;
  isActive?: boolean;
  wooID?: number;
}
export type UpdatePlanPayload = Partial<CreatePlanPayload>;

export interface CreateBalancePayload {
  name: string;
  isActive?: boolean;
  hasDiscount?: boolean;
  discount?: string;
  balance?: number;
}
export type UpdateBalancePayload = Partial<CreateBalancePayload>;

export interface CreateRelationPayload {
  categoryID?: string;
  planID: string;
}
export type UpdateRelationPayload = Partial<CreateRelationPayload>;

export interface CreateStagePayload {
  name: string;
}
export type UpdateStagePayload = Partial<CreateStagePayload>;
export interface CreateRulePayload {
  ruleType: "number" | "percentage" | "boolean" | "string";
  ruleName?: string;
  ruleSlug: string;
  ruleDescription?: string;
}
export type UpdateRulePayload = Partial<CreateRulePayload>;

export interface CreateParameterPayload {
  ruleID: string;
  relationStageID: string;
  ruleValue: number | string | boolean;
  isActive?: boolean;
}
export type UpdateParameterPayload = Partial<CreateParameterPayload>;
export interface CreateRelationStagePayload {
  stageID: string;
  relationID: string;
  numPhase?: number;
}
export type UpdateRelationStagePayload = Partial<CreateRelationStagePayload>;

export interface CreateStageRuleForRelationPayload {
  ruleID: string;
  ruleName: string;
  ruleValue: string;
}

export interface CreateStageForRelationPayload {
  stageID: string;
  stageName: string;
  // isActive: boolean;
  rules: CreateStageRuleForRelationPayload[];
}

export interface CreateRelationStagesPayload {
  challengeRelationID: string;
  stages: CreateStageForRelationPayload[];
}
export interface CreateRelationBalancePayload {
  balanceID: string;
  relationID: string;
  price: number;
  isActive?: boolean;
  hasDiscount?: boolean;
  discount?: string;
  wooID?: number;
}
export interface balanceForRelationPayload {
  challengeBalanceID: string;
  price: number;
  isActive?: boolean;
  hasDiscount?: boolean;
  discount?: string;
  wooID?: number;
}
export type UpdateRelationBalancePayload =
  Partial<CreateRelationBalancePayload>;
export const challengeTemplatesApi = {
  // Categories
  createCategory: async (
    payload: CreateCategoryPayload
  ): Promise<ChallengeCategory> => {
    const { data } = await client.post(
      "/challenge-templates/categories",
      payload
    );
    return data;
  },
  listCategories: async (): Promise<ChallengeCategory[]> => {
    const { data } = await client.get("/challenge-templates/categories");
    return data.data;
  },
  getCategory: async (id: string): Promise<ChallengeCategory> => {
    const { data } = await client.get(`/challenge-templates/categories/${id}`);
    return data;
  },
  updateCategory: async (
    id: string,
    payload: UpdateCategoryPayload
  ): Promise<ChallengeCategory> => {
    const { data } = await client.patch(
      `/challenge-templates/categories/${id}`,
      payload
    );
    return data;
  },
  deleteCategory: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await client.delete(
      `/challenge-templates/categories/${id}`
    );
    return data;
  },

  // Plans
  createPlan: async (payload: CreatePlanPayload): Promise<ChallengePlan> => {
    const { data } = await client.post("/challenge-templates/plans", payload);
    return data;
  },
  listPlans: async (): Promise<ChallengePlan[]> => {
    const { data } = await client.get("/challenge-templates/plans");
    return data.data;
  },
  getPlan: async (id: string): Promise<ChallengePlan> => {
    const { data } = await client.get(`/challenge-templates/plans/${id}`);
    return data;
  },
  updatePlan: async (
    id: string,
    payload: UpdatePlanPayload
  ): Promise<ChallengePlan> => {
    const { data } = await client.patch(
      `/challenge-templates/plans/${id}`,
      payload
    );
    return data;
  },
  deletePlan: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await client.delete(`/challenge-templates/plans/${id}`);
    return data;
  },

  // Balances
  createBalance: async (
    payload: CreateBalancePayload
  ): Promise<ChallengeBalance> => {
    const { data } = await client.post(
      "/challenge-templates/balances",
      payload
    );
    return data;
  },
  listBalances: async (): Promise<ChallengeBalance[]> => {
    const { data } = await client.get("/challenge-templates/balances");
    return data.data;
  },
  getBalance: async (id: string): Promise<ChallengeBalance> => {
    const { data } = await client.get(`/challenge-templates/balances/${id}`);
    return data;
  },
  updateBalance: async (
    id: string,
    payload: UpdateBalancePayload
  ): Promise<ChallengeBalance> => {
    const { data } = await client.patch(
      `/challenge-templates/balances/${id}`,
      payload
    );
    return data;
  },
  deleteBalance: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await client.delete(`/challenge-templates/balances/${id}`);
    return data;
  },

  // Relations
  createRelation: async (
    payload: CreateRelationPayload
  ): Promise<ChallengeRelation> => {
    const { data } = await client.post(
      "/challenge-templates/relations",
      payload
    );
    return data;
  },
  listRelations: async (): Promise<ChallengeRelation[]> => {
    const { data } = await client.get("/challenge-templates/relations");
    return data.data;
  },
  getRelation: async (id: string): Promise<ChallengeRelation> => {
    const { data } = await client.get(`/challenge-templates/relations/${id}`);
    return data;
  },
  createBalancesForRelation: async (
    relationId: string,
    payload: balanceForRelationPayload[]
  ): Promise<ChallengeBalance> => {
    const { data } = await client.post(
      `/challenge-templates/relation-balances/create`,
      {
        challengeRelationID: relationId,
        relationBalances: payload,
      }
    );
    return data;
  },
  updateRelation: async (
    id: string,
    payload: UpdateRelationPayload
  ): Promise<ChallengeRelation> => {
    const { data } = await client.patch(
      `/challenge-templates/relations/${id}`,
      payload
    );
    return data;
  },
  deleteRelation: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await client.delete(
      `/challenge-templates/relations/${id}`
    );
    return data;
  },

  // Stages
  createStage: async (payload: CreateStagePayload): Promise<ChallengeStage> => {
    const { data } = await client.post("/challenge-templates/stages", payload);
    return data;
  },
  listStages: async (): Promise<ChallengeStage[]> => {
    const { data } = await client.get("/challenge-templates/stages");
    return data.data;
  },
  getStage: async (id: string): Promise<ChallengeStage> => {
    const { data } = await client.get(`/challenge-templates/stages/${id}`);
    return data;
  },
  updateStage: async (
    id: string,
    payload: UpdateStagePayload
  ): Promise<ChallengeStage> => {
    const { data } = await client.patch(
      `/challenge-templates/stages/${id}`,
      payload
    );
    return data;
  },
  deleteStage: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await client.delete(`/challenge-templates/stages/${id}`);
    return data;
  },

  // Rules
  createRule: async (payload: CreateRulePayload): Promise<StageRule> => {
    const { data } = await client.post("/challenge-templates/rules", payload);
    return data;
  },
  listRules: async (): Promise<StageRule[]> => {
    const { data } = await client.get("/challenge-templates/rules");
    return data.data;
  },
  getRule: async (id: string): Promise<StageRule> => {
    const { data } = await client.get(`/challenge-templates/rules/${id}`);
    return data;
  },
  updateRule: async (
    id: string,
    payload: UpdateRulePayload
  ): Promise<StageRule> => {
    const { data } = await client.patch(
      `/challenge-templates/rules/${id}`,
      payload
    );
    return data;
  },
  deleteRule: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await client.delete(`/challenge-templates/rules/${id}`);
    return data;
  },

  // Parameters
  createParameter: async (
    payload: CreateParameterPayload
  ): Promise<StageParameter> => {
    const { data } = await client.post(
      "/challenge-templates/parameters",
      payload
    );
    return data;
  },
  listParameters: async (): Promise<StageParameter[]> => {
    const { data } = await client.get("/challenge-templates/parameters");
    return data.data;
  },
  listParametersByRelationStage: async (
    relationStageID: string
  ): Promise<StageParameter[]> => {
    const { data } = await client.get(
      `/challenge-templates/parameters/by-relation-stage/${relationStageID}`
    );
    return data.data || data;
  },
  getParameter: async (
    ruleId: string,
    relationStageId: string
  ): Promise<StageParameter> => {
    const { data } = await client.get(
      `/challenge-templates/parameters/${ruleId}/${relationStageId}`
    );
    return data;
  },
  updateParameter: async (
    ruleId: string,
    relationStageId: string,
    payload: UpdateParameterPayload
  ): Promise<StageParameter> => {
    const { data } = await client.patch(
      `/challenge-templates/parameters/${ruleId}/${relationStageId}`,
      payload
    );
    return data;
  },
  deleteParameter: async (
    ruleId: string,
    relationStageId: string
  ): Promise<{ success: boolean }> => {
    const { data } = await client.delete(
      `/challenge-templates/parameters/${ruleId}/${relationStageId}`
    );
    return data;
  },

  // Relation Stages
  createRelationStage: async (
    payload: CreateRelationStagePayload
  ): Promise<RelationStage> => {
    const { data } = await client.post(
      "/challenge-templates/relation-stages",
      payload
    );
    return data;
  },
  createRelationStages: async (
    payload: CreateRelationStagesPayload
  ): Promise<RelationStage[]> => {
    const { data } = await client.post(
      "/challenge-templates/relation-stages/create",
      payload
    );
    return data;
  },
  listRelationStages: async (relationID?: string): Promise<RelationStage[]> => {
    const url = relationID
      ? `/challenge-templates/relation-stages/by-relation/${relationID}`
      : "/challenge-templates/relation-stages";
    const { data } = await client.get(url);
    return data.data || data;
  },
  getRelationStage: async (id: string): Promise<RelationStage> => {
    const { data } = await client.get(
      `/challenge-templates/relation-stages/${id}`
    );
    return data;
  },
  updateRelationStage: async (
    id: string,
    payload: UpdateRelationStagePayload
  ): Promise<RelationStage> => {
    const { data } = await client.patch(
      `/challenge-templates/relation-stages/${id}`,
      payload
    );
    return data;
  },
  deleteRelationStage: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await client.delete(
      `/challenge-templates/relation-stages/${id}`
    );
    return data;
  },
};
