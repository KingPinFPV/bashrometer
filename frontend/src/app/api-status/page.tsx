'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api';

interface EndpointStatus {
  endpoint: string;
  status: 'OK' | 'ERROR' | 'LOADING';
  responseTime?: number;
  error?: string;
}

export default function ApiStatusPage() {
  const [endpoints, setEndpoints] = useState<EndpointStatus[]>([
    { endpoint: '/health', status: 'LOADING' },
    { endpoint: '/api/products?limit=1', status: 'LOADING' },
    { endpoint: '/api/cuts/stats', status: 'LOADING' },
    { endpoint: '/api/cuts/test-mapping?name=test', status: 'LOADING' },
  ]);

  useEffect(() => {
    testAllEndpoints();
  }, []);

  const testEndpoint = async (endpoint: string): Promise<EndpointStatus> => {
    const startTime = Date.now();
    
    try {
      if (endpoint === '/health') {
        await apiClient.healthCheck();
      } else {
        await apiClient.get(endpoint);
      }
      
      const responseTime = Date.now() - startTime;
      return { endpoint, status: 'OK', responseTime };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return { 
        endpoint, 
        status: 'ERROR', 
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const testAllEndpoints = async () => {
    const results = await Promise.all(
      endpoints.map(({ endpoint }) => testEndpoint(endpoint))
    );
    setEndpoints(results);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">API Status Dashboard</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Endpoint Tests</h2>
          <button
            onClick={testAllEndpoints}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Tests
          </button>
        </div>
        
        <div className="space-y-3">
          {endpoints.map((endpoint) => (
            <div 
              key={endpoint.endpoint}
              className="flex items-center justify-between p-3 border rounded"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  endpoint.status === 'OK' ? 'bg-green-500' :
                  endpoint.status === 'ERROR' ? 'bg-red-500' : 'bg-yellow-500'
                }`}></div>
                <span className="font-mono text-sm">{endpoint.endpoint}</span>
              </div>
              
              <div className="flex items-center space-x-4 text-sm">
                {endpoint.responseTime && (
                  <span className="text-gray-600">{endpoint.responseTime}ms</span>
                )}
                <span className={`font-semibold ${
                  endpoint.status === 'OK' ? 'text-green-600' :
                  endpoint.status === 'ERROR' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {endpoint.status}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        {endpoints.some(e => e.error) && (
          <div className="mt-6 p-4 bg-red-50 rounded">
            <h3 className="font-semibold text-red-800 mb-2">Errors:</h3>
            <div className="space-y-1 text-sm text-red-700">
              {endpoints.filter(e => e.error).map(endpoint => (
                <div key={endpoint.endpoint}>
                  <strong>{endpoint.endpoint}:</strong> {endpoint.error}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-6 p-4 bg-gray-50 rounded text-sm">
          <h3 className="font-semibold mb-2">Connection Info:</h3>
          <div>API Base URL: {apiClient.baseURL}</div>
          <div>Frontend URL: {typeof window !== 'undefined' ? window.location.origin : 'Server'}</div>
          <div>Environment: {process.env.NODE_ENV}</div>
        </div>
      </div>
    </div>
  );
}