// Verification/KYC types aligned with backend enums
export enum DocumentType {
  DNI = 'dni',
  PASSPORT = 'passport',
  DRIVER_LICENSE = 'driver_license',
  OTHER = 'other',
}

export enum VerificationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface MediaItem {
  mediaID: string;
  url: string;
  type: 'image' | 'document' | string;
  createdAt: string;
  scope: string;
  verificationID: string;
}

export interface VerificationUser {
  userID: string;
  username: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  confirmationToken?: string | null;
  isConfirmed: boolean;
  isBlocked: boolean;
  isVerified: boolean;
  phone?: string | null;
  googleId?: string | null;
  provider?: string | null;
  avatar?: string | null;
  createdAt: string;
  updatedAt: string;
  refAffiliateID?: string | null;
}

export interface VerificationItem {
  verificationID: string;
  userID: string;
  status: VerificationStatus;
  documentType: DocumentType;
  numDocument?: string | null;
  rejectionReason?: string | null;
  submittedAt: string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  user?: VerificationUser;
  media?: MediaItem[];
}

export interface VerificationListData {
  data: VerificationItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface VerificationListResponse {
  success: boolean;
  message: string;
  data: VerificationListData;
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