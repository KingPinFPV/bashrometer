// src/app/admin/page.tsx
"use client";

import React from 'react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">לוח בקרה ניהולי</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* קישור לניהול מוצרים (נוסיף בעתיד) */}
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold text-slate-700 mb-2">ניהול מוצרים</h2>
          <p className="text-slate-600 mb-4">הצג, הוסף, ערוך ומחק מוצרים במערכת.</p>
          <Link 
            href="/admin/products" 
            className="text-sky-600 hover:text-sky-700 font-medium"
          >
            עבור לניהול מוצרים &rarr;
          </Link>
        </div>

        {/* קישור לניהול קמעונאים (נוסיף בעתיד) */}
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold text-slate-700 mb-2">ניהול קמעונאים</h2>
          <p className="text-slate-600 mb-4">נהל את רשימת הקמעונאים במערכת.</p>
          <Link 
            href="/admin/retailers" 
            className="text-sky-600 hover:text-sky-700 font-medium"
          >
            עבור לניהול קמעונאים &rarr;
          </Link>
        </div>

        {/* קישור לניהול דיווחי מחירים (נוסיף בעתיד) */}
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold text-slate-700 mb-2">ניהול דיווחי מחירים</h2>
          <p className="text-slate-600 mb-4">אשר, דחה או ערוך דיווחי מחירים מהמשתמשים.</p>
          <Link 
            href="/admin/reports" 
            className="text-sky-600 hover:text-sky-700 font-medium"
          >
            עבור לניהול דיווחים &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}