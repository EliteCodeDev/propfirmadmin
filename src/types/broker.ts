// Centralized broker-related types
// Origin: src/app/brokeraccounts/page.tsx

export interface BrokerAccount {
  brokerAccountID: string;
  login: string;
  server?: string | null;
  serverIp?: string | null;
  platform?: string | null;
  isUsed: boolean;
  investorPass?: string | null;
  innitialBalance?: number | null;
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
