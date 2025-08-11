import client from "@/api/client";

// Tipos base aproximados (deberían refinarse según DTOs reales si se exponen al front)
export interface ChallengeCategory {
  id: string;
  name: string;
  description?: string;
}
export interface ChallengePlan {
  id: string;
  name: string;
  description?: string;
}
export interface ChallengeBalance {
  id: string;
  amount: number;
  description?: string;
}
export interface ChallengeRelation {
  id: string;
  name: string;
  description?: string;
}
export interface ChallengeStage {
  id: string;
  name: string;
  order?: number;
  description?: string;
}
export interface StageRule {
  id: string;
  code: string;
  description?: string;
}
export interface StageParameter {
  ruleId: string;
  relationStageId: string;
  value: string | number;
}
export interface RelationStage {
  id: string;
  relationId?: string;
  stageId?: string;
}

// Payloads genéricos

//omit es para no incluir el campo "id"
//partial es para hacer todos los campos opcionales
export type CreateCategoryPayload = Omit<ChallengeCategory, "id">;
export type UpdateCategoryPayload = Partial<CreateCategoryPayload>;
export type CreatePlanPayload = Omit<ChallengePlan, "id">;
export type UpdatePlanPayload = Partial<CreatePlanPayload>;
export type CreateBalancePayload = Omit<ChallengeBalance, "id">;
export type UpdateBalancePayload = Partial<CreateBalancePayload>;
export type CreateRelationPayload = Omit<ChallengeRelation, "id">;
export type UpdateRelationPayload = Partial<CreateRelationPayload>;
export type CreateStagePayload = Omit<ChallengeStage, "id">;
export type UpdateStagePayload = Partial<CreateStagePayload>;
export type CreateRulePayload = Omit<StageRule, "id">;
export type UpdateRulePayload = Partial<CreateRulePayload>;
export type CreateParameterPayload = Omit<StageParameter, "value"> & {
  value: string | number;
};
export type UpdateParameterPayload = Partial<CreateParameterPayload>;
export type CreateRelationStagePayload = Omit<RelationStage, "id">;
export type UpdateRelationStagePayload = Partial<CreateRelationStagePayload>;

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
    return data;
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
    return data;
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
    return data;
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
    return data;
  },
  getRelation: async (id: string): Promise<ChallengeRelation> => {
    const { data } = await client.get(`/challenge-templates/relations/${id}`);
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
    return data;
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
    return data;
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
    return data;
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
  listRelationStages: async (): Promise<RelationStage[]> => {
    const { data } = await client.get("/challenge-templates/relation-stages");
    return data;
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
