// Centralized broker-related types
// Origin: src/app/brokeraccounts/page.tsx

import { Challenge } from "./challenge";

export interface BrokerAccount {
  brokerAccountID: string;
  login: string;
  server?: string | null;
  serverIp?: string | null;
  platform?: string | null;
  isUsed: boolean;
  investorPass?: string | null;
  innitialBalance?: number | null;
  challenge?: Challenge & {
    user?: {
      userID: string;
      email: string;
      firstName?: string;
      lastName?: string;
    };
  };
}

// DTO for generating broker accounts
export interface GenerateBrokerAccountDto {
  login: string;
  email: string;
  groupName?: string;
  masterPassword?: string;
  investorPassword?: string;
  initialBalance?: number;
  relationID?: string;
  isActive?: boolean;
}

// Response from generate endpoint
export interface GenerateBrokerAccountResponse {
  challengeID: string;
  login: string;
  server: string;
  isActive: boolean;
}

// DTO para crear broker account
export interface CreateBrokerAccountDto {
  login: string;
  password: string;
  server?: string | null;
  serverIp?: string | null;
  platform?: string | null;
  isUsed?: boolean;
  investorPass?: string | null;
  innitialBalance?: number | null;
}

// DTO para actualizar broker account (excluye brokerAccountID y login)
export interface UpdateBrokerAccountDto {
  login: string;
  server?: string | null;
  serverIp?: string | null;
  platform?: string | null;
  isUsed?: boolean;
  investorPass?: string | null;
  innitialBalance?: number | null;
}
