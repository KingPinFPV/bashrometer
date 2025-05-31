// הגדרת API base URL נכונה
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://bashrometer-api.onrender.com'
    : 'http://localhost:3000');

// פונקציה עזר לקריאות API
export const apiCall = async (endpoint: string, options?: RequestInit) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  };
  
  const response = await fetch(url, defaultOptions);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
};

// פונקציה עזר לקריאות מאומתות
export const authenticatedApiCall = async (endpoint: string, options?: RequestInit) => {
  const token = localStorage.getItem('authToken'); // תיקון: להשתמש באותו מפתח כמו ב-AuthContext
  
  if (!token) {
    console.error('🔐 No authentication token found in localStorage');
    throw new Error('No authentication token found');
  }
  
  console.log('🔐 Sending authenticated request:', {
    endpoint,
    tokenPresent: !!token,
    tokenLength: token.length,
    tokenStart: token.substring(0, 20) + '...'
  });
  
  return apiCall(endpoint, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
};