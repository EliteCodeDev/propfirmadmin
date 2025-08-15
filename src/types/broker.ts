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
