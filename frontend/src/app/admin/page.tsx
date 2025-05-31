// src/app/admin/page.tsx
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect /admin to /admin/dashboard
    router.replace('/admin/dashboard');
  }, [router]);

  return (
    <div className="flex justify-center items-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">מעביר לדשבורד...</p>
      </div>
    </div>
  );
}