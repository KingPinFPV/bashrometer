// src/app/page.tsx
"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="px-8 py-12 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-4">בשרומטר 1.0</h1>
      <p className="mb-8 text-lg">
        השוו מחירי בשר בין חנויות, דווחו על הדילים הטובים ביותר וחסכו כסף!
      </p>
      <div className="flex gap-4">
        <Link href="/products">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            מוצרים
          </button>
        </Link>
        <Link href="/report-price">
          <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
            דווח מחיר
          </button>
        </Link>
      </div>
    </main>
  );
}
