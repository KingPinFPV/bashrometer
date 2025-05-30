// src/components/Navbar.tsx
"use client";

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

const Navbar = () => {
  const { user, logout, isLoading } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const navStyle = {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 4px 32px rgba(0, 0, 0, 0.25)',
    padding: '1rem 0',
    position: 'sticky' as const,
    top: 0,
    zIndex: 50,
  };

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 2rem',
  };

  const logoStyle = {
    fontSize: '1.75rem',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #3b82f6 0%, #f97316 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textDecoration: 'none',
    transition: 'all 0.3s ease',
    transform: 'scale(1)',
  };

  const menuStyle = {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'center',
    direction: 'rtl' as const,
  };

  const linkStyle = {
    color: '#e2e8f0',
    textDecoration: 'none',
    fontWeight: '500',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    position: 'relative' as const,
  };

  const primaryButtonStyle = {
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    color: 'white',
    padding: '0.75rem 1.5rem',
    borderRadius: '12px',
    fontWeight: '600',
    fontSize: '0.9rem',
    textDecoration: 'none',
    display: 'inline-block',
    boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.25)',
    transition: 'all 0.3s ease',
    transform: 'translateY(0)',
    border: 'none',
    cursor: 'pointer',
  };

  const secondaryButtonStyle = {
    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    color: 'white',
    padding: '0.75rem 1.5rem',
    borderRadius: '12px',
    fontWeight: '600',
    fontSize: '0.9rem',
    textDecoration: 'none',
    display: 'inline-block',
    boxShadow: '0 4px 14px 0 rgba(249, 115, 22, 0.25)',
    transition: 'all 0.3s ease',
    transform: 'translateY(0)',
    border: 'none',
    cursor: 'pointer',
  };

  const logoutButtonStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#e2e8f0',
    padding: '0.75rem 1.5rem',
    borderRadius: '12px',
    fontWeight: '500',
    fontSize: '0.9rem',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    cursor: 'pointer',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
    transform: 'translateY(0)',
  };

  const userGreetingStyle = {
    color: '#cbd5e1',
    fontSize: '0.9rem',
    fontWeight: '500',
  };

  return (
    <nav style={navStyle}>
      <div style={containerStyle}>
        <Link 
          href="/" 
          style={logoStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          🥩 בשרומטר 2.0
        </Link>
        
        <div style={menuStyle}>
          <Link 
            href="/" 
            style={linkStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = '#60a5fa';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#e2e8f0';
            }}
          >
            🏠 בית
          </Link>
          
          <Link 
            href="/products" 
            style={linkStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = '#fb923c';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#e2e8f0';
            }}
          >
            📦 מוצרים
          </Link>

          <Link 
            href="/compare" 
            style={linkStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = '#a78bfa';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#e2e8f0';
            }}
          >
            📊 השוואת מחירים
          </Link>
          
          {isClient && !isLoading && user ? (
            <>
              <Link 
                href="/report-price" 
                style={primaryButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px 0 rgba(59, 130, 246, 0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(59, 130, 246, 0.25)';
                }}
              >
                💰 דווח מחיר
              </Link>
              
              <span style={userGreetingStyle} className="hidden sm:inline">
                👋 שלום, {user.name || user.email}!
              </span>
              
              <Link 
                href="/settings" 
                style={linkStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = '#fbbf24';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#e2e8f0';
                }}
              >
                ⚙️ הגדרות
              </Link>
              
              <button
                onClick={logout}
                style={logoutButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                🚪 התנתק
              </button>
            </>
          ) : isClient && !isLoading && !user ? (
            <>
              <Link 
                href="/login" 
                style={linkStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = '#60a5fa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#e2e8f0';
                }}
              >
                🔐 התחברות
              </Link>
              
              <Link 
                href="/register" 
                style={secondaryButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px 0 rgba(249, 115, 22, 0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(249, 115, 22, 0.25)';
                }}
              >
                📝 הרשמה
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;