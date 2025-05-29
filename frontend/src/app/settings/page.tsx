"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function SettingsPage() {
  const { user, token } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!user || !token) {
      router.push('/login');
    }
  }, [user, token, router]);

  if (!user || !token) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">מפנה להתחברות...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">הגדרות חשבון</h1>
            
            {/* User Info Section */}
            <div className="mb-8 pb-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 mb-4">פרטי החשבון</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">שם:</span>
                  <span className="ml-2 text-sm text-gray-900">{user.name || 'לא הוגדר'}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">אימייל:</span>
                  <span className="ml-2 text-sm text-gray-900">{user.email}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">תפקיד:</span>
                  <span className="ml-2 text-sm text-gray-900">
                    {user.role === 'admin' ? 'מנהל' : user.role === 'editor' ? 'עורך' : 'משתמש'}
                  </span>
                </div>
              </div>
            </div>

            {/* Settings Menu */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900 mb-4">הגדרות</h2>
              
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Profile Settings */}
                <Link
                  href="/settings/profile"
                  className="relative block p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">עריכת פרופיל</h3>
                      <p className="text-sm text-gray-500">עדכון שם ואימייל</p>
                    </div>
                  </div>
                </Link>

                {/* Password Settings */}
                <Link
                  href="/settings/password"
                  className="relative block p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">שינוי סיסמה</h3>
                      <p className="text-sm text-gray-500">עדכון סיסמת החשבון</p>
                    </div>
                  </div>
                </Link>

                {/* Notifications (Disabled for now) */}
                <div className="relative block p-6 bg-gray-50 border border-gray-200 rounded-lg opacity-50 cursor-not-allowed">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM8.9 14.1L12 17.2l3.1-3.1M7 8h10M7 12h4" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-500">התראות</h3>
                      <p className="text-sm text-gray-400">בקרוב...</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Back to Home */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                חזרה לדף הבית
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}