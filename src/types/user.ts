// Centralized user related types
// Origin: src/app/users/page.tsx and users/[id]/page.tsx

export interface RoleOption {
  roleID: string;
  name: string;
}

export interface Address {
  address1?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  zipCode?: string | null;
}

export interface RoleRef {
  roleID?: string;
  name?: string;
}

export interface User {
  userID?: string;
  id?: string;
  username: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  isVerified?: boolean;
  isConfirmed?: boolean;
  createdAt?: string | Date | null;
  updatedAt?: string | null;
  couponCode?: string | null;
  status?: string | null;
  role?: RoleRef;
  address?: Address | null;
}
