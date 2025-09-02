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
  return res.data as VerificationListResponse;
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