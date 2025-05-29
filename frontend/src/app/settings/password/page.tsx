"use client";

import { useState, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { user, token } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated
  if (!user || !token) {
    router.push('/login');
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    // Client-side validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('כל השדות נדרשים');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('הסיסמאות החדשות אינן תואמות');
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError('הסיסמה החדשה חייבת להכיל לפחות 8 תווים');
      setIsLoading(false);
      return;
    }

    // Check password complexity
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      setError('הסיסמה חייבת להכיל לפחות אות גדולה, אות קטנה וספרה');
      setIsLoading(false);
      return;
    }

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/change-password`;
      
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('הסיסמה שונתה בהצלחה!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        setTimeout(() => {
          router.push('/settings');
        }, 2000);
      } else {
        setError(data.error || 'אירעה שגיאה בשינוי הסיסמה');
      }
    } catch (err) {
      console.error('Error changing password:', err);
      setError('שגיאת רשת - נסה שוב מאוחר יותר');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          שינוי סיסמה
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                סיסמה נוכחית
              </label>
              <div className="mt-1">
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                סיסמה חדשה
              </label>
              <div className="mt-1">
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  dir="ltr"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                לפחות 8 תווים, כולל אות גדולה, אות קטנה וספרה
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                אישור סיסמה חדשה
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  dir="ltr"
                />
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
                {isLoading ? 'שומר...' : 'שמור סיסמה חדשה'}
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
        </div>
      </div>
    </div>
  );
}