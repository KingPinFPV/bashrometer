import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // צבעי העיצוב המקוריים
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // כחול ראשי
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316', // כתום ראשי
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        // צבעי רקע
        background: {
          primary: '#0f172a',   // כהה
          secondary: '#1e293b', // כהה בינוני
          card: '#334155',      // כהה בהיר
          light: '#f8fafc',     // בהיר
        },
        // צבעי טקסט - כאן התיקון העיקרי
        text: {
          primary: '#1e293b',   // כהה לרקע בהיר - קריא!
          secondary: '#64748b', // אפור - קריא!
          light: '#f1f5f9',     // בהיר לרקע כהה
          muted: '#94a3b8',     // אפור בהיר
        },
        // צבעי גבול
        border: '#e2e8f0',
        // צבעי מצב
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      // גרדיאנטים יפים
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        'gradient-accent': 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        'gradient-hero': 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      },
      // צללים מקצועיים
      boxShadow: {
        'primary': '0 4px 14px 0 rgba(59, 130, 246, 0.15)',
        'accent': '0 4px 14px 0 rgba(249, 115, 22, 0.15)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      // אנימציות
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;