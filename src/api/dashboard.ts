import client from './client';
import { DashboardStats, DashboardAnalytics, TopSellingPlan, ApiResponse } from '@/types/dashboard';

class DashboardApi {
  /**
   * Get dashboard statistics
   */
  static async getStats(): Promise<DashboardStats> {
    try {
      const response = await client.get<ApiResponse<DashboardStats>>('/dashboard/stats');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get dashboard analytics data
   */
  static async getAnalytics(): Promise<DashboardAnalytics> {
    try {
      const response = await client.get<ApiResponse<DashboardAnalytics>>('/dashboard/analytics');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      throw error;
    }
  }

  /**
   * Get top selling plans
   */
  static async getTopPlans(): Promise<TopSellingPlan[]> {
    try {
      const response = await client.get<ApiResponse<TopSellingPlan[]>>('/dashboard/top-plans');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching top plans:', error);
      throw error;
    }
  }

  /**
   * Get complete dashboard overview
   */
  static async getOverview(): Promise<{
    stats: DashboardStats;
    analytics: DashboardAnalytics;
    topPlans: TopSellingPlan[];
  }> {
    try {
      const response = await client.get<ApiResponse<{
        stats: DashboardStats;
        analytics: DashboardAnalytics;
        topPlans: TopSellingPlan[];
      }>>('/dashboard/overview');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
      throw error;
    }
  }
}

export default DashboardApi;