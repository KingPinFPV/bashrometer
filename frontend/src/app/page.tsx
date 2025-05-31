// src/app/page.tsx
"use client";

import Link from "next/link";

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
    fontSize: '2.5rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
    background: 'linear-gradient(135deg, #3b82f6 0%, #f97316 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
    lineHeight: '1.2',
    '@media (min-width: 640px)': {
      fontSize: '3rem',
      marginBottom: '2rem',
    },
    '@media (min-width: 768px)': {
      fontSize: '4rem',
    }
  };

  const subtitleStyle = {
    fontSize: '1.125rem',
    marginBottom: '2rem',
    color: '#e2e8f0',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
    lineHeight: '1.6',
    maxWidth: '500px',
    margin: '0 auto 2rem auto',
    padding: '0 1rem',
    '@media (min-width: 640px)': {
      fontSize: '1.25rem',
      marginBottom: '2.5rem',
      maxWidth: '600px',
    },
    '@media (min-width: 768px)': {
      fontSize: '1.5rem',
      marginBottom: '3rem',
      padding: '0',
    }
  };

  const buttonContainerStyle = {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
    flexDirection: 'column' as const,
    alignItems: 'center',
    '@media (min-width: 640px)': {
      flexDirection: 'row',
      gap: '1.5rem',
    }
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

  const tertiaryButtonStyle = {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    padding: '1rem 2rem',
    borderRadius: '12px',
    fontWeight: 'bold',
    fontSize: '1.1rem',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
    boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'translateY(0)',
    position: 'relative' as const,
    overflow: 'hidden',
  };

  return (
    <main style={containerStyle}>
      <div style={overlayStyle}></div>
      
      
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

        {/* הסבר על השימוש */}
        <div style={{
          maxWidth: '800px',
          margin: '0 auto 2rem auto',
          textAlign: 'center' as const,
          padding: '0 1rem'
        }}>
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '1rem',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#60a5fa',
              marginBottom: '1rem',
              '@media (min-width: 640px)': {
                fontSize: '1.5rem'
              }
            }}>
              💡 איך להשתמש במערכת?
            </h3>
            <p style={{
              color: '#e2e8f0',
              lineHeight: '1.6',
              fontSize: '1rem',
              margin: '0'
            }}>
              השוו מחירי בשר בין הרשתות המובילות בישראל. חפשו מוצרים ספציפיים, 
              צפו במחירי מבצע עדכניים, וקבלו את המידע הכי מדויק על מחירים ל-1 ק״ג.
              דווחו על מחירים חדשים ועזרו לקהילה לחסוך כסף!
            </p>
          </div>

          {/* אזהרה על התחברות */}
          <div style={{
            background: 'rgba(249, 115, 22, 0.1)',
            border: '1px solid rgba(249, 115, 22, 0.3)',
            borderRadius: '16px',
            padding: '1.5rem',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: 'bold',
              color: '#fb923c',
              marginBottom: '1rem',
              '@media (min-width: 640px)': {
                fontSize: '1.25rem'
              }
            }}>
              ⚠️ הודעה חשובה
            </h3>
            <p style={{
              color: '#e2e8f0',
              lineHeight: '1.6',
              fontSize: '0.9rem',
              margin: '0',
              '@media (min-width: 640px)': {
                fontSize: '1rem'
              }
            }}>
              על מנת למנוע תקלות במערכת, מומלץ להתחבר למערכת. 
              לא כל הפונקציות זמינות למשתמשים שלא מחוברים. 
              אם נתקלתם בבעיות, נסו להתנתק ולהתחבר מחדש.
            </p>
          </div>
        </div>

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
          <Link href="/add-product" style={{textDecoration: 'none'}}>
            <button 
              style={secondaryButtonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px 0 rgba(34, 197, 94, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(34, 197, 94, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)';
              }}
            >
              ➕ הוסף מוצר
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
          <Link href="/compare" style={{textDecoration: 'none'}}>
            <button 
              style={tertiaryButtonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px 0 rgba(16, 185, 129, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(16, 185, 129, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)';
              }}
            >
              📊 השוואת מוצרים
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}
