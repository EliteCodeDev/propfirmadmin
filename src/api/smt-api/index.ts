import client from "@/api/client";

// Tipos más estrictos (pueden ampliarse cuando el backend defina DTOs específicos)
export interface OpenPosition {
  ticket: string;
  symbol: string;
  volume: number;
  profit: number;
  [key: string]: unknown;
}

export interface ClosedPosition {
  ticket: string;
  symbol: string;
  volume: number;
  profit: number;
  [key: string]: unknown;
}

export interface PositionsResume {
  totalVolume?: number;
  totalProfit?: number;
  [key: string]: unknown;
}

export interface OpenPositionsSet {
  open?: OpenPosition[];
  ResumePositionOpen?: PositionsResume;
}

export interface ClosedPositionsSet {
  closed?: ClosedPosition[];
  ResumePositionClose?: PositionsResume;
}

export interface SmtAccount {
  login: string;
  userID?: string;
  balance?: number;
  equity?: number;
  metaStats?: Record<string, unknown>;
  validation?: Record<string, unknown>;
  openPositions?: OpenPositionsSet;
  closedPositions?: ClosedPositionsSet;
  lastUpdate?: string; // ISO date
}

export type SmtAccountIngestPayload = Partial<
  Omit<SmtAccount, "login" | "lastUpdate">
>;

export const smtApi = {
  listAccounts: async (): Promise<SmtAccount[]> => {
    const { data } = await client.get("/smt-api/accounts");
    return data;
  },
  getAccount: async (accountId: string): Promise<SmtAccount> => {
    const { data } = await client.get(`/smt-api/accounts/${accountId}`);
    return data;
  },
  ingestAccount: async (
    accountId: string,
    payload: SmtAccountIngestPayload
  ): Promise<SmtAccount> => {
    const { data } = await client.post(
      `/smt-api/accounts/${accountId}`,
      payload
    );
    return data;
  },
};

// Server variants (uso en Route Handlers BFF)
export const smtApiServer = {
  listAccounts: async (token: string): Promise<SmtAccount[]> => {
    const { data } = await client.get("/smt-api/accounts", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },
  getAccount: async (token: string, accountId: string): Promise<SmtAccount> => {
    const { data } = await client.get(`/smt-api/accounts/${accountId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },
  ingestAccount: async (
    token: string,
    accountId: string,
    payload: SmtAccountIngestPayload
  ): Promise<SmtAccount> => {
    const { data } = await client.post(
      `/smt-api/accounts/${accountId}`,
      payload,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return data;
  },
};
