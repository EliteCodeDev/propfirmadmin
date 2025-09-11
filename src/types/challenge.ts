// Centralized challenge related types
// Origin: src/app/challenges/page.tsx and users/[id]/page.tsx

export interface ChallengeRelationPlan {
  name?: string;
}

export interface ChallengeRelationCategory {
  name?: string;
}

export interface ChallengeBrokerAccount {
  login?: string | null;
  platform?: string | null;
  initialBalance?: number | null;
  innitialBalance?: number | null;
}

export interface ChallengeUserRef {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  id?: string;
  userID?: string;
}

export interface Challenge {
  challengeID: string;
  userID?: string;
  relationID?: string | null;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  numPhase?: number | null;
  dynamicBalance?: number | null;
  status?: string | null;
  isActive?: boolean | null;
  parentID?: string | null;
  brokerAccountID?: string | null;
  // relations
  user?: ChallengeUserRef | null;
  relation?: {
    plan?: ChallengeRelationPlan;
    category?: ChallengeRelationCategory;
  };
  brokerAccount?: ChallengeBrokerAccount | null;
}
