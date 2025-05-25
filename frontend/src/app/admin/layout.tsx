// src/app/admin/layout.tsx
"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext'; //
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, token } = useAuth(); //
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user || !token) {
        // אם המשתמש לא מחובר, הפנה לדף ההתחברות עם פרמטר ניתוב חזרה
        console.log("AdminLayout: User not logged in, redirecting to login.");
        router.replace('/login?redirect=/admin'); 
      } else if (user.role !== 'admin') {
        // אם המשתמש מחובר אבל אינו אדמין, הפנה לדף הבית
        console.log(`AdminLayout: User role is "${user.role}", not admin. Redirecting to home.`);
        router.replace('/'); 
      } else {
        console.log("AdminLayout: User is admin, access granted.");
      }
    }
  }, [user, isLoading, token, router]);

  // בזמן טעינת פרטי המשתמש מהקונטקסט
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-xl">טוען נתוני משתמש...</p>
      </div>
    );
  }

  // אם המשתמש אינו אדמין (או לא מחובר), אל תציג את התוכן של נתיבי האדמין
  // ה-useEffect אמור לבצע את ההפניה לפני שהגענו לכאן במצב תקין.
  // זוהי שכבת הגנה נוספת.
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">גישה נדחתה</h1>
        <p className="text-slate-700 mb-6">
          {user ? 'אין לך הרשאות לגשת לאזור זה.' : 'עליך להתחבר כדי לגשת לאזור זה.'}
        </p>
        <Link href={user ? "/" : "/login?redirect=/admin"} className="text-sky-600 hover:text-sky-700 font-semibold">
          {user ? "חזרה לדף הבית" : "עבור לדף ההתחברות"}
        </Link>
      </div>
    );
  }

  // אם המשתמש הוא אדמין, הצג את התוכן של אזור האדמין
  return (
    <div>
      {/* כאן אפשר להוסיף בעתיד תפריט צד ייעודי לאדמין או כותרת אדמין */}
      {/* <nav className="bg-slate-700 text-white p-4 mb-4">
        <p className="text-lg font-semibold">תפריט ניהול (דוגמה)</p>
        <Link href="/admin/products" className="mr-4 hover:text-slate-300">מוצרים</Link>
        <Link href="/admin/retailers" className="mr-4 hover:text-slate-300">קמעונאים</Link>
        <Link href="/admin/reports" className="hover:text-slate-300">דיווחים</Link>
      </nav>
      */}
      {children}
    </div>
  );
}