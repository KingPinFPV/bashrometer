// src/contexts/AuthContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation'; // לניתוב לאחר התנתקות

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
  login: (userData: User, token: string) => void;
  logout: () => void;
}

// יצירת הקונטקסט עם ערך ברירת מחדל
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// רכיב ה-Provider
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // מתחיל כ-true עד שנסיים לטעון מה-localStorage
  const router = useRouter();

  useEffect(() => {
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
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
    } finally {
      setIsLoading(false); // סיימנו לטעון (או לנסות לטעון)
    }
  }, []); // ה-useEffect הזה רץ פעם אחת בלבד, בעת טעינת הרכיב

  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('userData', JSON.stringify(userData));
    // אין צורך בניתוב כאן, הדף שקרא ל-login ידאג לניתוב
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    router.push('/login'); // העבר לדף ההתחברות לאחר התנתקות
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
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