import client from "@/api/client";

export interface SendMailPayload {
  to: string;
  subject: string;
  html?: string;
  template?: string;
  context?: Record<string, unknown>;
}

export interface SendAdminMailPayload {
  to: string;
  subject: string;
  title?: string;
  body: string;
}

export const mailerApi = {
  send: async (payload: SendMailPayload): Promise<{ success: boolean }> => {
    const { data } = await client.post("/mailer/send", payload);
    return data;
  },
  
  sendAdmin: async (payload: SendAdminMailPayload): Promise<{ success: boolean }> => {
    const { data } = await client.post("/mailer/send-admin", payload);
    return data;
  },
};