import client from "../client";
import type {
  VerificationItem,
  VerificationListResponse,
  VerificationQuery,
  ApproveVerificationPayload,
  RejectVerificationPayload,
  VerificationStats,
} from "@/types";

// Get verifications by user ID (admin endpoint)
export async function getVerificationsByUserId(
  userId: string,
  query?: VerificationQuery
): Promise<VerificationListResponse> {
  const res = await client.get(`/verification/user/${userId}`, {
    params: query,
  });
  return res.data as VerificationListResponse;
}

// Get all verifications (admin endpoint)
export async function getAllVerifications(
  query?: VerificationQuery
): Promise<VerificationListResponse> {
  const res = await client.get("/verification", {
    params: query,
  });
  const raw = res.data as any;
  // Normalize possible shapes:
  // 1) { data: [...], total, page, limit, totalPages }
  // 2) { data: { data: [...], total, page, limit, totalPages } }
  // 3) [ ... ]
  if (raw && Array.isArray(raw.data)) {
    return raw as VerificationListResponse;
  }
  if (raw && raw.data && Array.isArray(raw.data.data)) {
    return raw.data as VerificationListResponse;
  }
  if (Array.isArray(raw)) {
    return {
      data: raw,
      total: raw.length,
      page: 1,
      limit: raw.length,
      totalPages: 1,
    } as VerificationListResponse;
  }
  return {
    data: [],
    total: 0,
    page: Number(query?.page || 1),
    limit: Number(query?.limit || 10),
    totalPages: 1,
  };
}

// Get one verification by id (admin endpoint)
export async function getVerification(id: string): Promise<VerificationItem> {
  const res = await client.get(`/verification/${id}`);
  return res.data as VerificationItem;
}

// Approve verification (admin endpoint)
export async function approveVerification(
  payload: ApproveVerificationPayload
): Promise<VerificationItem> {
  const res = await client.patch(
    `/verification/${payload.verificationID}/approve`
  );
  return res.data as VerificationItem;
}

// Reject verification (admin endpoint)
export async function rejectVerification(
  payload: RejectVerificationPayload
): Promise<VerificationItem> {
  const res = await client.patch(
    `/verification/${payload.verificationID}/reject`,
    {
      rejectionReason: payload.rejectionReason,
    }
  );
  return res.data as VerificationItem;
}

// Get verification statistics (admin endpoint)
export async function getVerificationStats(): Promise<VerificationStats> {
  const res = await client.get("/verification/admin/stats");
  return res.data as VerificationStats;
}

// Verification API object
export const verificationApi = {
  getByUserId: getVerificationsByUserId,
  getAll: getAllVerifications,
  get: getVerification,
  approve: approveVerification,
  reject: rejectVerification,
  getStats: getVerificationStats,
};

export default verificationApi;
