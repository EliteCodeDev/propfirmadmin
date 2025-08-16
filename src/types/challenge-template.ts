// Challenge Template specific interfaces

// Challenge Table
export interface ChallengeItem {
    id: number;
    name: string;
    originalId?: string;
    precio?: number;
    description?: string;
}

export interface ChallengeTableProps {
    title: string;
    data: ChallengeItem[];
    pageSize: number;
    onCreate: () => void;
    onEdit: (item: ChallengeItem) => void;
    showPrice?: boolean;
    isLoading?: boolean;
}

// User Edit Modal
export interface BasicUser {
    userID: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    country?: string;
    city?: string;
    address?: string;
    zipCode?: string;
    birthDate?: string;
    isActive: boolean;
    roleRef: {
        roleID: string;
        name: string;
    };
}

export interface EditUserModalProps {
    user: BasicUser | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (userData: Partial<BasicUser>) => Promise<void>;
}