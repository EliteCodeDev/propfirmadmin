// Challenge Template specific interfaces

// Challenge Table
export interface ChallengeItem {
  id: number;
  name: string;
  originalId?: string;
  precio?: number;
  description?: string;
}

export interface ChallengeTableProps {
  title: string;
  data: ChallengeItem[];
  pageSize: number;
  onCreate: () => void;
  onEdit: (item: ChallengeItem) => void;
  showPrice?: boolean;
  isLoading?: boolean;
}

// User Edit Modal
export interface BasicUser {
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

export interface ChallengeCategory {
  categoryID: string;
  name: string;
}

export interface ChallengePlan {
  planID: string;
  name: string;
  isActive: boolean;
  wooID?: number;
}

export interface ChallengeBalance {
  balanceID: string;
  name: string;
  isActive: boolean;
  hasDiscount: boolean;
  discount?: string;
  balance?: number;
}
export interface RelationBalance {
  relationBalanceID: string;
  relationID: string;
  balanceID: string;
  price: number;
  discount?: string;
  isActive?: boolean;
  wooID?: number;
  hasDiscount?: boolean;
}

export interface ChallengeRelation {
  relationID: string;
  categoryID: string;
  planID: string;
  category?: ChallengeCategory;
  plan?: ChallengePlan;
  stages?: RelationStage[];
  balances?: RelationBalance[];
}

export interface ChallengeStage {
  stageID: string;
  name: string;
}
export interface StageRule {
  ruleID: string;
  ruleSlug: string;
  ruleType: string;
  ruleName?: string;
  ruleDescription?: string;
}

export interface RelationStage {
  relationStageID: string;
  stageID: string;
  relationID: string;
  numPhase?: number;
  stage?: ChallengeStage;
  relation?: ChallengeRelation;
  parameters?: StageParameter[];
}

export interface StageParameter {
  ruleID: string;
  relationStageID: string;
  ruleValue: string;
  isActive?: boolean;
}
