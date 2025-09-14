// Challenge Template specific interfaces

// Challenge Table
export type ChallengeItem = {
  id: number;
  name: string;
  originalId?: string;
  precio?: number;
  description?: string;
}

export type ChallengeTableProps = {
  title: string;
  data: ChallengeItem[];
  pageSize: number;
  onCreate: () => void;
  onEdit: (item: ChallengeItem) => void;
  showPrice?: boolean;
  isLoading?: boolean;
}

// User Edit Modal
export type BasicUser = {
  userID: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  country?: string;
  city?: string;
  address?: string;
  zipCode?: string;
  birthDate?: string;
  isActive: boolean;
  roleRef: {
    roleID: string;
    name: string;
  };
}

export type ChallengeCategory = {
  categoryID: string;
  name: string;
}

export type ChallengePlan = {
  planID: string;
  name: string;
  isActive: boolean;
  wooID?: number;
}

export type ChallengeBalance = {
  balanceID: string;
  name: string;
  isActive: boolean;
  hasDiscount: boolean;
  discount?: string;
  balance?: number;
  relationBalances?: RelationBalance[];
}
export type RelationBalance = {
  relationBalanceID: string;
  relationID: string;
  balanceID: string;
  price: number;
  discount?: string;
  isActive?: boolean;
  wooID?: number;
  hasDiscount?: boolean;
}

export type ChallengeRelation = {
  relationID: string;
  categoryID: string;
  planID: string;
  groupName?: string;
  category?: ChallengeCategory;
  plan?: ChallengePlan;
  stages?: RelationStage[];
  balances?: RelationBalance[];
  addons?: RelationAddon[];
  withdrawalRules?: Array<{
    ruleID: string;
    relationID: string;
    value: string;
    rule?: WithdrawalRule;
    relation?: ChallengeRelation;
  }>;
}

export type ChallengeStage = {
  stageID: string;
  name: string;
}
export type StageRule = {
  ruleID: string;
  slugRule: string;
  ruleType: string;
  ruleName?: string;
  descriptionRule?: string;
}

export type WithdrawalRule = {
  ruleID: string;
  nameRule: string;
  slugRule?: string;
  descriptionRule?: string;
  ruleType: string;
}

export type RelationStage = {
  relationStageID: string;
  stageID: string;
  relationID: string;
  numPhase?: number;
  stage?: ChallengeStage;
  relation?: ChallengeRelation;
  parameters?: StageParameter[];
}

export type StageParameter = {
  ruleID: string;
  relationStageID: string;
  ruleValue: string;
  isActive?: boolean;
}

// Addons
export type Addon = {
  addonID: string;
  name: string;
  slugRule?: string;
  valueType?: "number" | "boolean" | "percentage";
  isActive: boolean;
  hasDiscount: boolean;
  discount?: number;
}

export type RelationAddon = {
  addonID: string;
  relationID: string;
  value: number | boolean | null;
  isActive: boolean;
  hasDiscount: boolean;
  discount?: number;
  wooID?: number;
  addon?: Addon;
  relation?: ChallengeRelation;
}
