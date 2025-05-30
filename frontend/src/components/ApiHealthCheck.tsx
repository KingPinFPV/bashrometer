'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api';

interface ApiHealthStatus {
  status: string;
  timestamp: string;
  api_url: string;
  responsive: boolean;
}

export default function ApiHealthCheck() {
  const [health, setHealth] = useState<ApiHealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkApiHealth();
    
    // Check every 30 seconds
    const interval = setInterval(checkApiHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkApiHealth = async () => {
    try {
      const healthData = await apiClient.healthCheck();
      
      setHealth({
        status: healthData ? 'OK' : 'ERROR',
        timestamp: new Date().toISOString(),
        api_url: apiClient.baseURL,
        responsive: !!healthData
      });
      
    } catch (error) {
      setHealth({
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        api_url: apiClient.baseURL,
        responsive: false
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
        <span className="text-sm">Checking API...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${
        health?.responsive ? 'bg-green-500' : 'bg-red-500'
      }`}></div>
      <span className={`text-sm ${
        health?.responsive ? 'text-green-600' : 'text-red-600'
      }`}>
        API {health?.responsive ? 'Connected' : 'Disconnected'}
      </span>
      {!health?.responsive && (
        <button 
          onClick={checkApiHealth}
          className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      )}
    </div>
  );
}