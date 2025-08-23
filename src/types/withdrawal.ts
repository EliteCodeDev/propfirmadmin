// Centralized withdrawal related types
// Origin: src/app/withdrawals/page.tsx

export type WithdrawalStatus = "pending" | "approved" | "paid" | "rejected";

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

// Payload para actualización de estado (backend espera enum en minúsculas)
export interface UpdateWithdrawalStatusPayload {
  status: "pending" | "approved" | "paid" | "rejected";
  rejectionDetail?: string;
  observation?: string;
}
