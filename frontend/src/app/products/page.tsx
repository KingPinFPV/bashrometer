// src/app/products/page.tsx
"use client";

import { useState, useEffect } from 'react';
import ProductCard from '@/components/ProductCard';

interface Product {
  id: number;
  name: string;
  brand: string | null;
  short_description: string | null;
  image_url: string | null;
  category: string | null;
  unit_of_measure: string;
  min_price_per_100g: number | null;
}

interface ApiResponse {
  data: Product[];
  page_info: {
    limit: number;
    offset: number;
    total_items?: number;
    current_page_count?: number;
  };
}

export default function ProductsPage() {
  console.log("RENDERING: /app/products/page.tsx (All Products List)");

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const base = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
      const apiUrl = `${base}/api/products?limit=50`;
      console.log("Fetching products from", apiUrl);

      const response = await fetch(apiUrl, {
        credentials: 'include',
        cache: 'no-store',
      });
      console.log("ProductsPage fetch response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      console.log("ProductsPage fetched data:", data);
      setProducts(data.data ?? []);
    } catch (e: any) {
      console.error("ProductsPage - Failed to fetch products:", e);
      setError(e.message || 'Failed to load products. Please try again later.');
    } finally {
      setIsLoading(false);
      console.log("ProductsPage: Finished fetching products.");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (isLoading) {
    return (
      <div className="text-center py-10">
        טוען מוצרים... (מתוך /products/page.tsx)
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-600">
        שגיאה בטעינת המוצרים (מתוך /products/page.tsx): {error}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-10">
        לא נמצאו מוצרים. (מתוך /products/page.tsx)
      </div>
    );
  }

  return (
    <main className="px-8 py-12 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-700 mb-8">
        רשימת מוצרים (מתוך /products/page.tsx)
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  );
}
