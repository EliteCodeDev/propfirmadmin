// Enums que coinciden exactamente con el backend
export enum VerificationStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export enum DocumentType {
  DNI = "dni",
  PASSPORT = "passport",
  DRIVER_LICENSE = "driver_license",
  OTHER = "other",
}

// Tipos para compatibilidad
export type VerificationStatusType = "pending" | "approved" | "rejected";
export type DocumentTypeType = "dni" | "passport" | "driver_license" | "other";

export interface MediaItem {
  mediaID: string;
  url: string;
  type: string;
  createdAt: string;
  scope?: string;
  verificationID?: string;
}

export interface UserAccount {
  userID: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  country?: string;
  city?: string;
  address?: string;
  postalCode?: string;
  birthDate?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VerificationItem {
  verificationID: string;
  userID: string;
  status: VerificationStatusType;
  documentType: DocumentTypeType;
  numDocument?: string;
  rejectionReason?: string;
  submittedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  media: MediaItem[];
  user: UserAccount;
}

// Backend response structure matches the service return type
export interface VerificationListResponse {
  data: VerificationItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface VerificationDetailsProps {
  verification: VerificationItem;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  rejectionReason: string;
  setRejectionReason: (reason: string) => void;
  actionLoading: boolean;
}

// Admin-specific verification types
export interface VerificationQuery {
  page?: number;
  limit?: number;
  status?: VerificationStatus;
  userID?: string;
  documentType?: DocumentType;
}

export interface ApproveVerificationPayload {
  verificationID: string;
}

export interface RejectVerificationPayload {
  verificationID: string;
  rejectionReason: string;
}

export interface VerificationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}
