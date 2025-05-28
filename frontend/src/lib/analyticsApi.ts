// Analytics API functions
export interface PriceTrendData {
  date: string;
  average_price: number;
  min_price: number;
  max_price: number;
  report_count: number;
  normalized_price: number;
}

export interface RetailerAnalytics {
  retailer_name: string;
  average_price: number;
  report_count: number;
  market_share: number;
  price_trend: 'up' | 'down' | 'stable';
}

export interface UserActivityData {
  date: string;
  new_reports: number;
  active_users: number;
  likes_given: number;
}

class AnalyticsAPI {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async getPriceTrends(
    productId?: number, 
    timeRange: '7d' | '30d' | '90d' | '1y' = '30d'
  ): Promise<PriceTrendData[]> {
    const params = new URLSearchParams();
    if (productId) params.append('product_id', productId.toString());
    params.append('range', timeRange);

    const response = await fetch(`${this.baseUrl}/api/analytics/price-trends?${params}`, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) throw new Error('Failed to fetch price trends');
    return response.json();
  }

  async getRetailerComparison(
    categoryId?: number,
    timeRange: '7d' | '30d' | '90d' = '30d'
  ): Promise<RetailerAnalytics[]> {
    const params = new URLSearchParams();
    if (categoryId) params.append('category_id', categoryId.toString());
    params.append('range', timeRange);

    const response = await fetch(`${this.baseUrl}/api/analytics/retailers?${params}`, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) throw new Error('Failed to fetch retailer analytics');
    return response.json();
  }

  async getUserActivity(
    timeRange: '7d' | '30d' | '90d' = '7d'
  ): Promise<UserActivityData[]> {
    const response = await fetch(`${this.baseUrl}/api/analytics/user-activity?range=${timeRange}`, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) throw new Error('Failed to fetch user activity');
    return response.json();
  }

  async getProductAnalytics(productId: number) {
    const response = await fetch(`${this.baseUrl}/api/analytics/products/${productId}`, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) throw new Error('Failed to fetch product analytics');
    return response.json();
  }
}

export const analyticsApi = new AnalyticsAPI();