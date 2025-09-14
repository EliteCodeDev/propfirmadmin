// Centralized challenge related types
// Origin: src/app/challenges/page.tsx and users/[id]/page.tsx

import { ChallengeRelation } from "@/api/challenges";

export type ChallengeRelationPlan = {
  name?: string;
};

export type ChallengeRelationCategory = {
  name?: string;
};

export type ChallengeBrokerAccount = {
  login?: string | null;
  platform?: string | null;
  initialBalance?: number | null;
  innitialBalance?: number | null;
};

export type ChallengeUserRef = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  id?: string;
  userID?: string;
};

export type Challenge = {
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
  relation?: ChallengeRelation;
  brokerAccount?: ChallengeBrokerAccount | null;
};
