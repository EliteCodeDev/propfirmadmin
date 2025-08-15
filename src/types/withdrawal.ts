// Centralized withdrawal related types
// Origin: src/app/withdrawals/page.tsx

export type WithdrawalStatus = "pending" | "approved" | "rejected";

export interface WithdrawalUserRef {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface WithdrawalChallengeRef {
  name?: string;
  accountLogin?: string;
}

export interface Withdrawal {
  withdrawalID: string;
  userID: string;
  wallet: string;
  amount: number;
  observation?: string | null;
  status: WithdrawalStatus | string;
  createdAt: string;
  challengeID?: string | null;
  user?: WithdrawalUserRef;
  challenge?: WithdrawalChallengeRef;
}
