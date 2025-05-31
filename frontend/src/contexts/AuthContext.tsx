// src/contexts/AuthContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation'; // לניתוב לאחר התנתקות
import { apiCall, API_BASE_URL } from '@/config/api';

// ממשק לפרטי המשתמש (דומה ל-UserBase מה-API)
interface User {
  id: number;
  name: string | null;
  email: string;
  role: string;
  created_at?: string; // אופציונלי, כפי שהוא מגיע מה-API
}

// ממשק למצב הקונטקסט
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean; // לניהול טעינה ראשונית של המצב מה-localStorage
  authError: string | null; // New: אירועי שגיאה
  login: (userData: User, token: string) => void;
  logout: () => void;
  checkAuthStatus: () => Promise<boolean>; // New: בדיקת סטטוס אימות
  clearAuthError: () => void; // New: ניקוי שגיאות
}

// יצירת הקונטקסט עם ערך ברירת מחדל
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// רכיב ה-Provider
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(typeof window === 'undefined' ? false : true); // התחל false בצד השרת
  const [authError, setAuthError] = useState<string | null>(null); // New: שגיאות אימות
  const router = useRouter();

  // New: בדיקת סטטוס אימות
  const checkAuthStatus = async (): Promise<boolean> => {
    const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem('authToken') : null);
    if (!currentToken) {
      setAuthError('לא נמצא טוקן אימות');
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('Auth check failed:', response.status, response.statusText);
        if (response.status === 401 || response.status === 403) {
          setAuthError('הטוקן לא תקף או פג תוקפו');
          logout();
          return false;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const userData = await response.json();
      
      // עדכן מידע משתמש אם השתנה
      if (userData && userData.id !== user?.id) {
        setUser(userData);
        if (typeof window !== 'undefined') {
          localStorage.setItem('userData', JSON.stringify(userData));
        }
      }
      
      setAuthError(null); // ניקוי שגיאות בעת הצלחה
      return true;
    } catch (error) {
      console.error('Auth status check error:', error);
      setAuthError('שגיאה בבדיקת סטטוס אימות');
      logout();
      return false;
    }
  };

  // New: ניקוי שגיאות
  const clearAuthError = () => {
    setAuthError(null);
  };

  useEffect(() => {
    // בדוק שאנחנו בצד הלקוח לפני שנגש ל-localStorage
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    // נסה לטעון טוקן ופרטי משתמש מה-localStorage בעת טעינת האפליקציה
    try {
      const storedToken = localStorage.getItem('authToken');
      const storedUserData = localStorage.getItem('userData');
      
      if (storedToken && storedUserData) {
        setUser(JSON.parse(storedUserData));
        setToken(storedToken);
      }
    } catch (error) {
      console.error("Failed to parse auth data from localStorage", error);
      // אם יש בעיה, נקה את ה-localStorage כדי למנוע לולאות שגיאה
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      }
    } finally {
      console.log('AuthContext: Setting isLoading to false');
      setIsLoading(false); // סיימנו לטעון (או לנסות לטעון)
    }
  }, []); // ה-useEffect הזה רץ פעם אחת בלבד, בעת טעינת הרכיב

  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    setAuthError(null); // ניקוי שגיאות בעת התחברות מוצלחת
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('userData', JSON.stringify(userData));
    }
    // אין צורך בניתוב כאן, הדף שקרא ל-login ידאג לניתוב
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setAuthError(null); // ניקוי שגיאות בעת התנתקות
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
    }
    router.push('/login'); // העבר לדף ההתחברות לאחר התנתקות
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isLoading, 
      authError, 
      login, 
      logout, 
      checkAuthStatus, 
      clearAuthError 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook מותאם אישית לשימוש בקונטקסט
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};