"use client";

import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function EditProfilePage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  // Initialize form with current user data
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    // Client-side validation
    if (!email) {
      setError('כתובת אימייל נדרשת');
      setIsLoading(false);
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('כתובת אימייל לא תקינה');
      setIsLoading(false);
      return;
    }

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/update-profile`;
      
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim() || null,
          email: email.trim()
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('הפרופיל עודכן בהצלחה!');
        
        // Update the auth context with new user data
        if (data.user) {
          // This would require updating the AuthContext to have an updateUser function
          // For now, we'll just show success and redirect
          setTimeout(() => {
            router.push('/settings');
          }, 2000);
        }
      } else {
        setError(data.error || 'אירעה שגיאה בעדכון הפרופיל');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('שגיאת רשת - נסה שוב מאוחר יותר');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          עריכת פרופיל
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                שם מלא
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="הזן את שמך המלא"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                השם יוצג בדוחות המחירים שלך (אופציונלי)
              </p>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                כתובת אימייל <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  dir="ltr"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                כתובת האימייל שלך להתחברות ולקבלת עדכונים
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-700">
                    <strong>תפקיד:</strong> {user?.role === 'admin' ? 'מנהל' : user?.role === 'editor' ? 'עורך' : 'משתמש'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    לשינוי תפקיד, פנה למנהל המערכת
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}

            {message && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="text-sm text-green-800">{message}</div>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'שומר...' : 'שמור שינויים'}
              </button>
              
              <button
                type="button"
                onClick={() => router.push('/settings')}
                className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                ביטול
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              <p><strong>חשבון נוצר:</strong> {new Date(user?.created_at || '').toLocaleDateString('he-IL')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}