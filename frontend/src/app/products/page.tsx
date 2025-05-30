// src/app/products/page.tsx
"use client";

import { useState, useEffect } from 'react';
import ProductCard from '@/components/ProductCard';

interface Product {
  id: number;
  name: string;
  brand?: string | null;
  short_description?: string | null;
  image_url?: string | null;
  category?: string | null;
  unit_of_measure?: string;
  min_price_per_100g?: number | null;
  price?: number | null;
  retailer?: string | null;
  cut_type?: string | null;
  weight?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface ApiResponse {
  products: Product[];
  total_items: number;
  total_pages: number;
  current_page: number;
  items_per_page: number;
  has_next: boolean;
  has_previous: boolean;
}

export default function ProductsPage() {
  console.log("RENDERING: /app/products/page.tsx (All Products List)");

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // View and filtering states
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  
  // Categories for filtering
  const [categories, setCategories] = useState<string[]>([]);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
  const itemsPerPage = 20;

  const fetchProducts = async (
    page: number = 1, 
    search: string = '', 
    category: string = '', 
    sort: string = 'name', 
    order: 'ASC' | 'DESC' = 'ASC'
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const base = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
      
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: ((page - 1) * itemsPerPage).toString(),
        sort_by: sort,
        order: order
      });
      
      if (search.trim()) params.append('name_like', search.trim());
      if (category) params.append('category', category);
      
      const apiUrl = `${base}/api/products?${params.toString()}`;
      console.log("Fetching products from", apiUrl);

      const response = await fetch(apiUrl, {
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      console.log("ProductsPage fetched data:", data);
      console.log("First product details:", data.products?.[0]);
      setProducts(data.products ?? []);
      setTotalPages(data.total_pages || Math.ceil((data.total_items || 0) / itemsPerPage));
      setCurrentPage(page);
    } catch (e: any) {
      console.error("ProductsPage - Failed to fetch products:", e);
      setError(e.message || 'Failed to load products. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch categories for filter dropdown
  const fetchCategories = async () => {
    try {
      const base = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
      const response = await fetch(`${base}/api/categories`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Categories API response:", data);
        
        // Handle the new categories API format
        if (data.categories && Array.isArray(data.categories)) {
          const categoryNames = data.categories.map((cat: any) => cat.name).filter((name: string) => name);
          setCategories(categoryNames.sort());
        } else {
          console.warn("Categories API returned unexpected format:", data);
          setCategories([]);
        }
      } else {
        console.error("Categories API failed:", response.status, response.statusText);
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProducts(1, searchQuery, selectedCategory, sortBy, sortOrder);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedCategory, sortBy, sortOrder]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const containerStyle = {
    minHeight: 'calc(100vh - 200px)',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
    padding: '3rem 2rem',
    position: 'relative' as const,
  };

  const overlayStyle = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at 70% 20%, rgba(249, 115, 22, 0.1) 0%, transparent 50%)',
    pointerEvents: 'none' as const,
  };

  const contentStyle = {
    maxWidth: '1536px',
    margin: '0 auto',
    position: 'relative' as const,
    zIndex: 10,
  };

  const titleStyle = {
    fontSize: '3rem',
    fontWeight: 'bold',
    textAlign: 'center' as const,
    marginBottom: '3rem',
    background: 'linear-gradient(135deg, #3b82f6 0%, #f97316 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
  };

  const loadingStyle = {
    textAlign: 'center' as const,
    padding: '4rem 0',
    color: '#e2e8f0',
    fontSize: '1.25rem',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  };

  const errorStyle = {
    textAlign: 'center' as const,
    padding: '4rem 0',
    color: '#fca5a5',
    fontSize: '1.25rem',
    background: 'rgba(239, 68, 68, 0.1)',
    borderRadius: '16px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '2rem',
    marginTop: '2rem',
  };

  if (isLoading) {
    return (
      <main style={containerStyle}>
        <div style={overlayStyle}></div>
        <div style={contentStyle}>
          <div style={loadingStyle}>
            🔄 טוען מוצרים...
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main style={containerStyle}>
        <div style={overlayStyle}></div>
        <div style={contentStyle}>
          <div style={errorStyle}>
            ❌ שגיאה בטעינת המוצרים: {error}
          </div>
        </div>
      </main>
    );
  }

  if (products.length === 0) {
    return (
      <main style={containerStyle}>
        <div style={overlayStyle}></div>
        <div style={contentStyle}>
          <div style={loadingStyle}>
            📦 לא נמצאו מוצרים
          </div>
        </div>
      </main>
    );
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    fetchProducts(page, searchQuery, selectedCategory, sortBy, sortOrder);
  };

  // Sort options
  const sortOptions = [
    { value: 'name', label: 'שם מוצר (א-ב)', order: 'ASC' },
    { value: 'name', label: 'שם מוצר (ב-א)', order: 'DESC' },
    { value: 'min_price_per_100g', label: 'מחיר (זול לגבוה)', order: 'ASC' },
    { value: 'min_price_per_100g', label: 'מחיר (גבוה לזול)', order: 'DESC' },
    { value: 'brand', label: 'מותג (א-ב)', order: 'ASC' },
    { value: 'category', label: 'קטגוריה', order: 'ASC' },
  ];

  const controlsStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    padding: '1.5rem',
    marginBottom: '2rem',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  };

  const searchStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    fontSize: '1rem',
    outline: 'none',
    backdropFilter: 'blur(10px)',
  };

  const selectStyle = {
    padding: '0.75rem 1rem',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    fontSize: '1rem',
    outline: 'none',
    backdropFilter: 'blur(10px)',
    minWidth: '150px',
  };

  const buttonStyle = (active: boolean) => ({
    padding: '0.75rem 1rem',
    border: `1px solid ${active ? '#3b82f6' : 'rgba(255, 255, 255, 0.3)'}`,
    borderRadius: '12px',
    background: active ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
  });

  const paginationStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '2rem',
    padding: '1rem',
  };

  const pageButtonStyle = (active: boolean) => ({
    padding: '0.5rem 1rem',
    border: `1px solid ${active ? '#3b82f6' : 'rgba(255, 255, 255, 0.3)'}`,
    borderRadius: '8px',
    background: active ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    minWidth: '40px',
    textAlign: 'center' as const,
  });

  const renderPagination = () => {
    const pages = [];
    const showPages = Math.min(5, totalPages);
    const startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
    const endPage = Math.min(totalPages, startPage + showPages - 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          style={pageButtonStyle(i === currentPage)}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }

    return (
      <div style={paginationStyle}>
        {currentPage > 1 && (
          <button
            style={pageButtonStyle(false)}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            ◀
          </button>
        )}
        {pages}
        {currentPage < totalPages && (
          <button
            style={pageButtonStyle(false)}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            ▶
          </button>
        )}
      </div>
    );
  };

  return (
    <main style={containerStyle}>
      <div style={overlayStyle}></div>
      <div style={contentStyle}>
        <h1 style={titleStyle}>
          🥩 רשימת מוצרים
        </h1>
        
        {/* Controls Panel */}
        <div style={controlsStyle}>
          {/* Search and Filters Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto auto',
            gap: '1rem',
            marginBottom: '1rem',
            alignItems: 'center'
          }}>
            <input
              type="text"
              placeholder="🔍 חפש מוצרים..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={searchStyle}
            />
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={selectStyle}
            >
              <option value="">כל הקטגוריות</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order as 'ASC' | 'DESC');
              }}
              style={selectStyle}
            >
              {sortOptions.map((option, index) => (
                <option key={index} value={`${option.value}-${option.order}`}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            justifyContent: 'flex-end'
          }}>
            <button
              style={buttonStyle(viewMode === 'grid')}
              onClick={() => setViewMode('grid')}
            >
              🔲 רשת
            </button>
            <button
              style={buttonStyle(viewMode === 'list')}
              onClick={() => setViewMode('list')}
            >
              📋 רשימה
            </button>
          </div>
        </div>

        {/* Products Display */}
        <div style={{
          ...gridStyle,
          gridTemplateColumns: viewMode === 'list' 
            ? '1fr' 
            : 'repeat(auto-fill, minmax(280px, 1fr))',
        }}>
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              viewMode={viewMode}
            />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && renderPagination()}

        {/* Results Info */}
        <div style={{
          textAlign: 'center',
          color: '#cbd5e1',
          marginTop: '1rem',
          fontSize: '0.875rem'
        }}>
          עמוד {currentPage} מתוך {totalPages} • {products.length} מוצרים
        </div>
      </div>
    </main>
  );
}
