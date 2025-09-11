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
