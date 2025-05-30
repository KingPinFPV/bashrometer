// src/app/page.tsx
"use client";

import Link from "next/link";
import ApiHealthCheck from '@/components/ApiHealthCheck';

export default function HomePage() {
  const containerStyle = {
    minHeight: 'calc(100vh - 200px)',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
    padding: '3rem 2rem',
    position: 'relative' as const,
    overflow: 'hidden',
  };

  const overlayStyle = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
    pointerEvents: 'none' as const,
  };

  const contentStyle = {
    maxWidth: '1024px',
    margin: '0 auto',
    position: 'relative' as const,
    zIndex: 10,
    textAlign: 'center' as const,
  };

  const titleStyle = {
    fontSize: '4rem',
    fontWeight: 'bold',
    marginBottom: '2rem',
    background: 'linear-gradient(135deg, #3b82f6 0%, #f97316 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
    lineHeight: '1.2',
  };

  const subtitleStyle = {
    fontSize: '1.5rem',
    marginBottom: '3rem',
    color: '#e2e8f0',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
    lineHeight: '1.6',
    maxWidth: '600px',
    margin: '0 auto 3rem auto',
  };

  const buttonContainerStyle = {
    display: 'flex',
    gap: '1.5rem',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
  };

  const primaryButtonStyle = {
    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    color: 'white',
    padding: '1rem 2rem',
    borderRadius: '12px',
    fontWeight: 'bold',
    fontSize: '1.1rem',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
    boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'translateY(0)',
    position: 'relative' as const,
    overflow: 'hidden',
  };

  const secondaryButtonStyle = {
    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    color: 'white',
    padding: '1rem 2rem',
    borderRadius: '12px',
    fontWeight: 'bold',
    fontSize: '1.1rem',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
    boxShadow: '0 4px 14px 0 rgba(249, 115, 22, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'translateY(0)',
    position: 'relative' as const,
    overflow: 'hidden',
  };

  return (
    <main style={containerStyle}>
      <div style={overlayStyle}></div>
      
      {/* Debug Info */}
      <div className="mb-4 p-4 bg-gray-900 bg-opacity-50 rounded-lg backdrop-blur-sm border border-gray-700">
        <h3 className="font-semibold text-gray-200 mb-2">🔧 Debug Information</h3>
        <div className="space-y-1 text-sm text-gray-300">
          <div>Environment: {process.env.NODE_ENV}</div>
          <div>API URL: {process.env.NEXT_PUBLIC_API_URL || 'Not set'}</div>
          <div>API Base: {process.env.NEXT_PUBLIC_API_BASE_URL || 'Not set'}</div>
          <ApiHealthCheck />
        </div>
      </div>
      
      <div style={contentStyle}>
        <h1 
          style={titleStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          בשרומטר 2.0
        </h1>
        <p style={subtitleStyle}>
          השוו מחירי בשר בין חנויות, דווחו על הדילים הטובים ביותר וחסכו כסף!
          <br />
          הפלטפורמה החדשה והמתקדמת לחיסכון חכם בקניות בשר
        </p>
        <div style={buttonContainerStyle}>
          <Link href="/products" style={{textDecoration: 'none'}}>
            <button 
              style={primaryButtonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px 0 rgba(59, 130, 246, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(59, 130, 246, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)';
              }}
            >
              🥩 מוצרים
            </button>
          </Link>
          <Link href="/report-price" style={{textDecoration: 'none'}}>
            <button 
              style={secondaryButtonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px 0 rgba(249, 115, 22, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(249, 115, 22, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)';
              }}
            >
              💰 דווח מחיר
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}
