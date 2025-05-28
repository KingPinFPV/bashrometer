// src/app/admin/layout.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  Package, 
  Store, 
  FileText, 
  BarChart3, 
  Settings, 
  Menu, 
  X, 
  Search,
  Bell,
  LogOut,
  Home,
  AlertCircle
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, isLoading, token, logout } = useAuth();
  const router = useRouter();

  // Fix hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Mock pending reports count - בייצור יבוא מ-API
  const pendingReports = 5;

  const menuItems = [
    { 
      id: 'dashboard', 
      name: 'דשבורד', 
      icon: Home, 
      href: '/admin',
      badge: null
    },
    { 
      id: 'products', 
      name: 'מוצרים', 
      icon: Package, 
      href: '/admin/products',
      badge: null
    },
    { 
      id: 'retailers', 
      name: 'קמעונאים', 
      icon: Store, 
      href: '/admin/retailers',
      badge: null
    },
    { 
      id: 'price-reports', 
      name: 'דיווחי מחיר', 
      icon: FileText, 
      href: '/admin/reports',
      badge: pendingReports > 0 ? pendingReports : null
    },
    { 
      id: 'users', 
      name: 'משתמשים', 
      icon: Users, 
      href: '/admin/users',
      badge: null
    },
    { 
      id: 'analytics', 
      name: 'אנליטיקה', 
      icon: BarChart3, 
      href: '/admin/analytics',
      badge: null
    },
    { 
      id: 'settings', 
      name: 'הגדרות', 
      icon: Settings, 
      href: '/admin/settings',
      badge: null
    },
  ];

  // Get current page from URL
  const getCurrentPage = () => {
    if (typeof window === 'undefined') return 'dashboard';
    const pathname = window.location.pathname;
    
    if (pathname === '/admin') return 'dashboard';
    if (pathname.includes('/admin/products')) return 'products';
    if (pathname.includes('/admin/retailers')) return 'retailers';
    if (pathname.includes('/admin/reports')) return 'price-reports';
    if (pathname.includes('/admin/users')) return 'users';
    if (pathname.includes('/admin/analytics')) return 'analytics';
    if (pathname.includes('/admin/settings')) return 'settings';
    
    return 'dashboard';
  };

  const currentPage = getCurrentPage();
  const currentMenuItem = menuItems.find(item => item.id === currentPage);

  useEffect(() => {
    if (!isLoading) {
      if (!user || !token) {
        console.log("AdminLayout: User not logged in, redirecting to login.");
        router.replace('/login?redirect=/admin'); 
      } else if (user.role !== 'admin') {
        console.log(`AdminLayout: User role is "${user.role}", not admin. Redirecting to home.`);
        router.replace('/'); 
      } else {
        console.log("AdminLayout: User is admin, access granted.");
      }
    }
  }, [user, isLoading, token, router]);

  const handleNavigation = (href: string) => {
    router.push(href);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
  };

  // Show loading during hydration
  if (!mounted) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען ממשק ניהול...</p>
        </div>
      </div>
    );
  }

  // בזמן טעינת פרטי המשתמש מהקונטקסט
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">טוען נתוני משתמש...</p>
        </div>
      </div>
    );
  }

  // אם המשתמש אינו אדמין (או לא מחובר), אל תציג את התוכן של נתיבי האדמין
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600 mb-4">גישה נדחתה</h1>
          <p className="text-gray-700 mb-6">
            {user ? 'אין לך הרשאות לגשת לאזור זה.' : 'עליך להתחבר כדי לגשת לאזור זה.'}
          </p>
          <button
            onClick={() => router.push(user ? "/" : "/login?redirect=/admin")}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            {user ? "חזרה לדף הבית" : "עבור לדף ההתחברות"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 right-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        lg:static lg:inset-0
      `}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">בשרומטר</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === currentPage;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.href)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${isActive 
                      ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-center">
                    <Icon className="ml-3 w-5 h-5" />
                    {item.name}
                  </div>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* User info at bottom */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user.name ? user.name.charAt(0) : 'מ'}
                </span>
              </div>
              <div className="mr-3">
                <p className="text-sm font-medium text-gray-900 truncate max-w-32">
                  {user.name || 'מנהל מערכת'}
                </p>
                <p className="text-xs text-gray-500 truncate max-w-32">{user.email}</p>
              </div>
            </div>
            <button 
              className="p-1 text-gray-400 hover:text-gray-600"
              onClick={handleLogout}
              title="התנתק"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:mr-64">
        {/* Top navigation */}
        <div className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
                >
                  <Menu className="w-5 h-5" />
                </button>

                <div className="lg:hidden mr-4">
                  <h1 className="text-lg font-semibold text-gray-900">
                    {currentMenuItem?.name || 'ממשק ניהול'}
                  </h1>
                </div>

                <div className="hidden lg:block">
                  <div className="flex items-center">
                    <h1 className="text-2xl font-bold text-gray-900 ml-4">
                      {currentMenuItem?.name || 'ממשק ניהול'}
                    </h1>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4 space-x-reverse">
                {/* Search bar */}
                <div className="hidden sm:block">
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Search className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="חיפוש..."
                      className="block w-64 pr-10 pl-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>

                {/* Notifications */}
                <button className="p-2 text-gray-400 hover:text-gray-600 relative">
                  <Bell className="w-5 h-5" />
                  {pendingReports > 0 && (
                    <span className="absolute top-0 left-0 block h-2 w-2 rounded-full bg-red-400"></span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;