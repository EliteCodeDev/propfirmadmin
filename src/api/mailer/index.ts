import client from "@/api/client";

export interface SendMailPayload {
  to: string;
  subject: string;
  html?: string;
  template?: string;
  context?: Record<string, unknown>;
}

export const mailerApi = {
  send: async (payload: SendMailPayload): Promise<{ success: boolean }> => {
    const { data } = await client.post("/mailer/send", payload);
    return data;
  },
};