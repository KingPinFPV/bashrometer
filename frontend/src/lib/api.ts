// lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 
                     (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL + '/api' : null) ||
                     'https://bashrometer-api.onrender.com/api';

const API_HEALTH_URL = process.env.NEXT_PUBLIC_API_URL || 
                       'https://bashrometer-api.onrender.com';

console.log('🔌 API Base URL:', API_BASE_URL);
console.log('🏥 API Health URL:', API_HEALTH_URL);

export const apiClient = {
  baseURL: API_BASE_URL,
  healthURL: API_HEALTH_URL,
  
  async get(endpoint: string, options?: RequestInit) {
    const url = `${this.baseURL}${endpoint}`;
    console.log('📡 GET Request:', url);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Response data:', data);
      return data;
    } catch (error) {
      console.error('❌ Request failed:', error);
      throw error;
    }
  },

  async post(endpoint: string, data?: any, options?: RequestInit) {
    const url = `${this.baseURL}${endpoint}`;
    console.log('📡 POST Request:', url);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        body: data ? JSON.stringify(data) : undefined,
        ...options,
      });

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Response data:', data);
      return data;
    } catch (error) {
      console.error('❌ Request failed:', error);
      throw error;
    }
  },

  // Health check function
  async healthCheck() {
    try {
      console.log('🏥 Checking API health at:', `${this.healthURL}/health`);
      const response = await fetch(`${this.healthURL}/health`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API Health:', data);
        return data;
      } else {
        console.warn('⚠️ API Health check failed:', response.status);
        return null;
      }
    } catch (error) {
      console.error('❌ API Health check error:', error);
      return null;
    }
  }
};

export default apiClient;