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
    // Try to get token from localStorage with the correct key
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    
    if (!token) {
      console.error('No authentication token found');
      throw new Error('נדרש אימות למשתמש admin');
    }

    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async getPriceTrends(
    productId?: number, 
    timeRange: '7d' | '30d' | '90d' | '1y' = '30d'
  ): Promise<PriceTrendData[]> {
    try {
      const params = new URLSearchParams();
      if (productId) params.append('product_id', productId.toString());
      params.append('range', timeRange);

      const url = `${this.baseUrl}/api/analytics/price-trends?${params}`;
      console.log('Fetching price trends:', url);

      const response = await fetch(url, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Price trends API error:', response.status, errorText);
        throw new Error(`Failed to fetch price trends: ${response.status} ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.error('Error in getPriceTrends:', error);
      throw error;
    }
  }

  async getRetailerComparison(
    categoryId?: number,
    timeRange: '7d' | '30d' | '90d' = '30d'
  ): Promise<RetailerAnalytics[]> {
    try {
      const params = new URLSearchParams();
      if (categoryId) params.append('category_id', categoryId.toString());
      params.append('range', timeRange);

      const url = `${this.baseUrl}/api/analytics/retailers?${params}`;
      console.log('Fetching retailer analytics:', url);

      const response = await fetch(url, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Retailer analytics API error:', response.status, errorText);
        throw new Error(`Failed to fetch retailer analytics: ${response.status} ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.error('Error in getRetailerComparison:', error);
      throw error;
    }
  }

  async getUserActivity(
    timeRange: '7d' | '30d' | '90d' = '7d'
  ): Promise<UserActivityData[]> {
    try {
      const url = `${this.baseUrl}/api/analytics/user-activity?range=${timeRange}`;
      console.log('Fetching user activity:', url);

      const response = await fetch(url, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('User activity API error:', response.status, errorText);
        throw new Error(`Failed to fetch user activity: ${response.status} ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.error('Error in getUserActivity:', error);
      throw error;
    }
  }

  async getProductAnalytics(productId: number) {
    try {
      const url = `${this.baseUrl}/api/analytics/products/${productId}`;
      console.log('Fetching product analytics:', url);

      const response = await fetch(url, {
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Product analytics API error:', response.status, errorText);
        throw new Error(`Failed to fetch product analytics: ${response.status} ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.error('Error in getProductAnalytics:', error);
      throw error;
    }
  }
}

export const analyticsApi = new AnalyticsAPI();