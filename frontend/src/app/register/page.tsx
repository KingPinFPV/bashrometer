// src/app/register/page.tsx
"use client";

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // ייבוא ה-Router
// import { useAuth } from '@/contexts/AuthContext'; // <-- ייבוא חדש

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // const { login } = useAuth(); // <-- שימוש ב-hook
  const router = useRouter();  // <-- אתחול ה-Router

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');

    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'https://bashrometer-api.onrender.com'}/api/auth/register`; 
    // !!! חשוב: ודא שזהו ה-URL הנכון והפעיל של ה-API שלך !!!

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name || undefined, email, password }),
      });

      const data = await response.json();

      if (response.ok && data.user && data.token) {
        // אין צורך לקרוא ל-login מהקונטקסט כאן כי הרישום יוצר משתמש אבל לא בהכרח מכניס אותו למערכת מיד.
        // בדרך כלל, לאחר הרשמה, המשתמש מופנה לדף התחברות או מקבל הודעה לאמת אימייל.
        // לצורך הפשטות שלנו כרגע, נציג הודעת הצלחה וניתן לו להתחבר.
        // אם רוצים להכניס אותו מיד: login(data.user, data.token);

        setMessage('ההרשמה בוצעה בהצלחה! אנא התחבר עם פרטיך.');
        setName('');
        setEmail('');
        setPassword('');

        setTimeout(() => {
          router.push('/login'); // העבר לדף ההתחברות
        }, 2000);

      } else if (response.status === 429) {
        // Handle rate limiting error specifically
        const retryAfter = data.retryAfter ? Math.ceil(data.retryAfter / 60) : 5;
        setMessage(`יותר מדי ניסיונות הרשמה. אנא נסה שוב בעוד ${retryAfter} דקות.`);
      } else {
        setMessage(data.error || 'אירעה שגיאה ברישום. אנא נסה שוב.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setMessage('אירעה שגיאת רשת. אנא בדוק את החיבור שלך ונסה שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  const containerStyle = {
    minHeight: 'calc(100vh - 200px)',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
    padding: '3rem 2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
  };

  const overlayStyle = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at 30% 70%, rgba(249, 115, 22, 0.1) 0%, transparent 50%)',
    pointerEvents: 'none' as const,
  };

  const formContainerStyle = {
    maxWidth: '400px',
    width: '100%',
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    padding: '2.5rem',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    position: 'relative' as const,
    zIndex: 10,
  };

  const titleStyle = {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    textAlign: 'center' as const,
    marginBottom: '2rem',
    background: 'linear-gradient(135deg, #f97316 0%, #3b82f6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  };

  const labelStyle = {
    display: 'block',
    color: '#e2e8f0',
    fontSize: '0.875rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    fontSize: '1rem',
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    color: '#ffffff',
    transition: 'all 0.3s ease',
    outline: 'none',
  };

  const buttonStyle = {
    width: '100%',
    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    color: 'white',
    padding: '1rem',
    borderRadius: '12px',
    fontWeight: 'bold',
    fontSize: '1rem',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 14px 0 rgba(249, 115, 22, 0.25)',
    transition: 'all 0.3s ease',
    transform: 'translateY(0)',
  };

  const linkStyle = {
    textAlign: 'center' as const,
    fontSize: '0.875rem',
    color: '#cbd5e1',
    marginTop: '1.5rem',
  };

  const linkTextStyle = {
    color: '#fb923c',
    fontWeight: '600',
    textDecoration: 'none',
  };

  return (
    <div style={containerStyle}>
      <div style={overlayStyle}></div>
      <div style={formContainerStyle}>
        <h1 style={titleStyle}>📝 הרשמה לבשרומטר</h1>
        <form onSubmit={handleSubmit}>
          <div style={{marginBottom: '1.5rem'}}>
            <label htmlFor="name" style={labelStyle}>
              שם (אופציונלי)
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(249, 115, 22, 0.5)';
                e.target.style.boxShadow = '0 0 0 3px rgba(249, 115, 22, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          <div style={{marginBottom: '1.5rem'}}>
            <label htmlFor="email" style={labelStyle}>
              כתובת אימייל <span style={{color: '#f87171'}}>*</span>
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(249, 115, 22, 0.5)';
                e.target.style.boxShadow = '0 0 0 3px rgba(249, 115, 22, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          <div style={{marginBottom: '2rem'}}>
            <label htmlFor="password" style={labelStyle}>
              סיסמה <span style={{color: '#f87171'}}>*</span>
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(249, 115, 22, 0.5)';
                e.target.style.boxShadow = '0 0 0 3px rgba(249, 115, 22, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {message && (
            <div style={{
              marginBottom: '1.5rem',
              padding: '0.75rem',
              borderRadius: '12px',
              fontSize: '0.875rem',
              background: message.includes('בהצלחה') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: message.includes('בהצלחה') ? '#4ade80' : '#f87171',
              border: `1px solid ${message.includes('בהצלחה') ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            }}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              ...buttonStyle,
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px 0 rgba(249, 115, 22, 0.35)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(249, 115, 22, 0.25)';
              }
            }}
          >
            {isLoading ? '⏳ שולח פרטים...' : '✨ הירשם'}
          </button>
        </form>
        <p style={linkStyle}>
          כבר יש לך חשבון?{' '}
          <Link href="/login" style={linkTextStyle}>
            התחבר כאן
          </Link>
        </p>
      </div>
    </div>
  );
}