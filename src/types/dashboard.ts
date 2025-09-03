// Dashboard data types
export interface StatCard {
  label: string;
  value: string;
  variant: 'indigo' | 'blue' | 'emerald' | 'gray';
  delay: number;
  icon?: React.ReactNode;
  delta?: string;
  deltaColor?: 'green' | 'red';
  deltaDirection?: 'up' | 'down';
}

export interface ActivityItem {
  id: string;
  type: 'user_registration' | 'order_created' | 'withdrawal_request';
  description: string;
  timestamp: string;
  user?: string;
}

export interface QuickAction {
  id: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
}

export interface DashboardData {
  stats: StatCard[];
  recentActivity: ActivityItem[];
  quickActions: QuickAction[];
}

// API Response types
export interface GrowthData {
  percentage: number;
  direction: 'up' | 'down';
}

export interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalSales: number;
  monthlyUsers: number;
  monthlyOrders: number;
  monthlySales: number;
  withdrawableProfits: number;
  payouts: number;
  userGrowth?: GrowthData;
  orderGrowth?: GrowthData;
  salesGrowth?: GrowthData;
}

export interface DashboardAnalytics {
  userRegistrations: Array<{
    date: string;
    count: number;
  }>;
  orderVolume: Array<{
    date: string;
    count: number;
    amount: number;
  }>;
  withdrawalRequests: Array<{
    date: string;
    count: number;
    amount: number;
  }>;
}

export interface TopSellingPlan {
  id: string;
  name: string;
  sales: number;
  revenue: number;
  description?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface DashboardApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface DashboardApiData {
  stats: DashboardStats;
  analytics: DashboardAnalytics;
  topPlans: TopSellingPlan[];
}