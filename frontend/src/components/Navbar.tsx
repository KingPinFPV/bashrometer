// src/components/Navbar.tsx
"use client";

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

const Navbar = () => {
  const { user, logout, isLoading } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const navStyle = {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 4px 32px rgba(0, 0, 0, 0.25)',
    position: 'sticky' as const,
    top: 0,
    zIndex: 50,
  };

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 0.5rem',
    '@media (min-width: 640px)': {
      padding: '0 1rem',
    }
  };

  const navRowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '3rem',
    gap: '0.5rem',
    '@media (min-width: 640px)': {
      height: '4rem',
      gap: '1rem',
    }
  };

  const leftLinksStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    '@media (min-width: 640px)': {
      gap: '1rem',
    }
  };

  const linkStyle = {
    color: '#e2e8f0',
    textDecoration: 'none',
    padding: '0.5rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    minHeight: '2rem',
    '@media (min-width: 640px)': {
      padding: '0.75rem 1rem',
      fontSize: '0.875rem',
      minHeight: '2.5rem',
    }
  };

  const logoStyle = {
    fontSize: '0.875rem',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #3b82f6 0%, #f97316 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textDecoration: 'none',
    transition: 'all 0.3s ease',
    '@media (min-width: 640px)': {
      fontSize: '1.25rem',
    }
  };

  const authButtonStyle = {
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '600',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    border: 'none',
    cursor: 'pointer',
    minHeight: '2rem',
    '@media (min-width: 640px)': {
      padding: '0.75rem 1rem',
      fontSize: '0.875rem',
      minHeight: '2.5rem',
    }
  };

  const loginButtonStyle = {
    ...authButtonStyle,
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    color: 'white',
    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)',
  };

  const logoutButtonStyle = {
    ...authButtonStyle,
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)',
  };

  const userGreetingStyle = {
    color: '#cbd5e1',
    fontSize: '0.75rem',
    fontWeight: '500',
    display: 'none',
    '@media (min-width: 768px)': {
      display: 'block',
      fontSize: '0.875rem',
    }
  };

  return (
    <nav style={navStyle}>
      <div style={containerStyle}>
        <div style={navRowStyle}>
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '3px',
              padding: '0.5rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              minHeight: '44px',
              minWidth: '44px',
            }}
            className="md:hidden"
          >
            <span style={{
              width: '20px',
              height: '2px',
              background: '#e2e8f0',
              transition: 'all 0.3s ease',
              transform: isMobileMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none'
            }}></span>
            <span style={{
              width: '20px',
              height: '2px',
              background: '#e2e8f0',
              transition: 'all 0.3s ease',
              opacity: isMobileMenuOpen ? 0 : 1
            }}></span>
            <span style={{
              width: '20px',
              height: '2px',
              background: '#e2e8f0',
              transition: 'all 0.3s ease',
              transform: isMobileMenuOpen ? 'rotate(-45deg) translate(7px, -6px)' : 'none'
            }}></span>
          </button>

          {/* Desktop Navigation Links */}
          <div style={leftLinksStyle} className="hidden md:flex">
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
              <span className="sm:hidden">🏠</span>
              <span className="hidden sm:inline">🏠 בית</span>
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
              <span className="sm:hidden">🥩</span>
              <span className="hidden sm:inline">🥩 מוצרים</span>
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
              <span className="sm:hidden">📊</span>
              <span className="hidden sm:inline">📊 השוואה</span>
            </Link>

            <Link 
              href="/add-product" 
              style={linkStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = '#34d399';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#e2e8f0';
              }}
            >
              <span className="sm:hidden">➕</span>
              <span className="hidden sm:inline">➕ הוסף מוצר</span>
            </Link>

            <Link 
              href="/report-price" 
              style={linkStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = '#10b981';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#e2e8f0';
              }}
            >
              <span className="sm:hidden">💰</span>
              <span className="hidden sm:inline">💰 מחירים</span>
            </Link>

            {/* Admin Links */}
            {isClient && !isLoading && user?.role === 'admin' && (
              <>
                <Link 
                  href="/admin/dashboard" 
                  style={linkStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.color = '#f59e0b';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#e2e8f0';
                  }}
                >
                  <span className="sm:hidden">📊</span>
                  <span className="hidden sm:inline">📊 דשבורד</span>
                </Link>
                
                <Link 
                  href="/admin/products" 
                  style={linkStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.color = '#8b5cf6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#e2e8f0';
                  }}
                >
                  <span className="sm:hidden">📦</span>
                  <span className="hidden sm:inline">📦 ניהול מוצרים</span>
                </Link>
                
              </>
            )}
          </div>

          {/* Center - Logo */}
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
            <span className="sm:hidden">🥩 בשרומטר</span>
            <span className="hidden sm:inline">🥩 בשרומטר 2.0</span>
          </Link>

          {/* Right side - Auth buttons (Desktop) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }} className="hidden md:flex">
            {isClient && !isLoading && user ? (
              <>
                <span style={userGreetingStyle}>
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
                  <span className="sm:hidden">⚙️</span>
                  <span className="hidden sm:inline">⚙️ הגדרות</span>
                </Link>
                <button
                  onClick={logout}
                  style={logoutButtonStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(239, 68, 68, 0.35)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.25)';
                  }}
                >
                  <span className="sm:hidden">יציאה</span>
                  <span className="hidden sm:inline">🚪 התנתק</span>
                </button>
              </>
            ) : isClient && !isLoading && !user ? (
              <>
                <Link 
                  href="/register" 
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
                  <span className="sm:hidden">📝</span>
                  <span className="hidden sm:inline">📝 הרשמה</span>
                </Link>
                <Link 
                  href="/login" 
                  style={loginButtonStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(59, 130, 246, 0.35)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.25)';
                  }}
                >
                  <span className="sm:hidden">כניסה</span>
                  <span className="hidden sm:inline">🔐 התחברות</span>
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: '3rem',
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          zIndex: 40,
        }}
        className="md:hidden"
        onClick={() => setIsMobileMenuOpen(false)}
        >
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
            padding: '2rem 1rem',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Navigation Links */}
            <Link 
              href="/" 
              style={{
                color: '#e2e8f0',
                textDecoration: 'none',
                padding: '1rem',
                fontSize: '1rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                minHeight: '44px'
              }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              🏠 בית
            </Link>
            
            <Link 
              href="/products" 
              style={{
                color: '#e2e8f0',
                textDecoration: 'none',
                padding: '1rem',
                fontSize: '1rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                minHeight: '44px'
              }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              🥩 מוצרים
            </Link>

            <Link 
              href="/compare" 
              style={{
                color: '#e2e8f0',
                textDecoration: 'none',
                padding: '1rem',
                fontSize: '1rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                minHeight: '44px'
              }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              📊 השוואה
            </Link>

            <Link 
              href="/report-price" 
              style={{
                color: '#e2e8f0',
                textDecoration: 'none',
                padding: '1rem',
                fontSize: '1rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                minHeight: '44px'
              }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              💰 מחירים
            </Link>

            {/* Mobile Admin Links */}
            {isClient && !isLoading && user?.role === 'admin' && (
              <>
                <Link 
                  href="/admin/dashboard" 
                  style={{
                    color: '#f59e0b',
                    textDecoration: 'none',
                    padding: '1rem',
                    fontSize: '1rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: '44px',
                    fontWeight: 'bold'
                  }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  📊 דשבורד אדמין
                </Link>
                
                <Link 
                  href="/admin/products" 
                  style={{
                    color: '#8b5cf6',
                    textDecoration: 'none',
                    padding: '1rem',
                    fontSize: '1rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: '44px',
                    fontWeight: 'bold'
                  }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  📦 ניהול מוצרים
                </Link>
                
              </>
            )}

            {/* Mobile Auth Section */}
            <div style={{
              marginTop: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {isClient && !isLoading && user ? (
                <>
                  <div style={{
                    color: '#cbd5e1',
                    fontSize: '1rem',
                    padding: '1rem',
                    textAlign: 'center',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    👋 שלום, {user.name || user.email}!
                  </div>
                  <Link 
                    href="/settings" 
                    style={{
                      color: '#e2e8f0',
                      textDecoration: 'none',
                      padding: '1rem',
                      fontSize: '1rem',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      minHeight: '44px'
                    }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    ⚙️ הגדרות
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '1rem',
                      fontSize: '1rem',
                      width: '100%',
                      marginTop: '1rem',
                      cursor: 'pointer',
                      minHeight: '44px'
                    }}
                  >
                    🚪 התנתק
                  </button>
                </>
              ) : isClient && !isLoading && !user ? (
                <>
                  <Link 
                    href="/register" 
                    style={{
                      color: '#e2e8f0',
                      textDecoration: 'none',
                      padding: '1rem',
                      fontSize: '1rem',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      minHeight: '44px'
                    }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    📝 הרשמה
                  </Link>
                  <Link 
                    href="/login" 
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '1rem',
                      fontSize: '1rem',
                      width: '100%',
                      marginTop: '1rem',
                      textAlign: 'center',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '44px'
                    }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    🔐 התחברות
                  </Link>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;