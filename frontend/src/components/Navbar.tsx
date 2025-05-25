// src/components/Navbar.tsx
"use client";

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

const Navbar = () => {
  const { user, logout, isLoading } = useAuth();

  return (
    <nav className="bg-slate-800 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold hover:text-slate-300">
          בשרומטר 1.0
        </Link>
        <div className="space-x-4 rtl:space-x-reverse">
          <Link href="/" className="hover:text-slate-300">בית</Link>
          <Link href="/products" className="hover:text-slate-300">מוצרים</Link>
          
          {isLoading ? null : user ? (
            <>
              <Link href="/report-price" className="bg-green-500 hover:bg-green-600 px-3 py-1 rounded-md text-sm font-semibold">
                דווח על מחיר
              </Link>
              <span className="text-slate-300 hidden sm:inline">שלום, {user.name || user.email}!</span>
              <button
                onClick={logout}
                className="bg-sky-600 hover:bg-sky-700 px-3 py-1 rounded-md text-sm"
              >
                התנתק
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-slate-300">התחברות</Link>
              <Link href="/register" className="hover:text-slate-300">הרשמה</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;