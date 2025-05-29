"use client";

import { useState, FormEvent } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    if (!email) {
      setError('נדרש להזין כתובת אימייל');
      setIsLoading(false);
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('כתובת אימייל לא תקינה');
      setIsLoading(false);
      return;
    }

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setEmailSent(true);
        setEmail('');
      } else {
        setError(data.error || 'אירעה שגיאה בשליחת האימייל');
      }
    } catch (err) {
      console.error('Error sending forgot password email:', err);
      setError('שגיאת רשת - נסה שוב מאוחר יותר');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          שכחתי סיסמה
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          או{' '}
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            חזור לדף התחברות
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {!emailSent ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  כתובת אימייל
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="הזן את כתובת האימייל שלך"
                    dir="ltr"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  נשלח לך קישור לאיפוס הסיסמה לכתובת האימייל הרשומה
                </p>
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

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'שולח...' : 'שלח קישור לאיפוס סיסמה'}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">האימייל נשלח!</h3>
              <p className="mt-2 text-sm text-gray-500">
                בדוק את תיבת הדואר שלך ולחץ על הקישור לאיפוס הסיסמה.
              </p>
              <p className="mt-2 text-xs text-gray-400">
                הקישור יפוג תוך שעה אחת.
              </p>
              <div className="mt-6">
                <Link
                  href="/login"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  חזרה לדף התחברות
                </Link>
              </div>
            </div>
          )}

          {!emailSent && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">או</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Link
                  href="/register"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  אין לך חשבון? הירשם כעת
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}