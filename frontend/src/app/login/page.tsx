// src/app/login/page.tsx
"use client"; 

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext'; // <-- ייבוא חדש

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth(); // <-- שימוש ב-hook
  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');

    const apiUrl = 'https://automatic-space-pancake-gr4rjjxpxg5fwj6w-3000.app.github.dev/api/auth/login'; 
    // !!! חשוב: ודא שזהו ה-URL הנכון והפעיל של ה-API שלך !!!

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.user && data.token) {
        login(data.user, data.token); // <-- שימוש בפונקציית login מהקונטקסט

        setMessage('התחברת בהצלחה! מועבר לדף הבית...');
        setEmail('');
        setPassword('');

        setTimeout(() => {
          router.push('/'); 
        }, 1500); 

      } else {
        setMessage(data.error || 'שם משתמש או סיסמה שגויים.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage('אירעה שגיאת רשת. אנא בדוק את החיבור שלך ונסה שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  // ... שאר קוד ה-JSX של הטופס נשאר כפי שהיה ...
  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
      <h1 className="text-3xl font-bold text-center text-slate-700 mb-8">התחברות לבשרומטר</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-slate-700 text-sm font-semibold mb-2">
            כתובת אימייל <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          />
        </div>
        <div className="mb-6">
          <label htmlFor="password" className="block text-slate-700 text-sm font-semibold mb-2">
            סיסמה <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          />
        </div>

        {message && (
          <p className={`mb-4 text-sm p-3 rounded-md ${message.includes('בהצלחה') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline disabled:opacity-50"
        >
          {isLoading ? 'מתחבר...' : 'התחבר'}
        </button>
      </form>
      <p className="text-center text-sm text-slate-600 mt-6">
        אין לך עדיין חשבון?{' '}
        <Link href="/register" className="text-sky-600 hover:text-sky-800 font-semibold">
          הירשם כאן
        </Link>
      </p>
    </div>
  );
}