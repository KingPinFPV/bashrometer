// src/app/products/page.tsx
"use client";

import { useState, useEffect } from 'react';
import ProductCard from '@/components/ProductCard';
import ProductSearch from '@/components/ProductSearch';

interface Product {
  id: number;
  name: string;
  brand?: string | null;
  short_description?: string | null;
  image_url?: string | null;
  category?: string | null;
  unit_of_measure?: string;
  min_price_per_1kg?: number | null;
  avg_price_per_1kg?: number | null;
  price?: number | null;
  retailer?: string | null;
  cut_name?: string | null;
  cut_category?: string | null;
  subtype_name?: string | null;
  processing_state?: string | null;
  has_bone?: boolean | null;
  quality_grade?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface ApiResponse {
  data: Product[];
  page_info: {
    total_items: number;
    total_pages: number;
    current_page: number;
    limit: number;
    offset: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export default function ProductsPage() {
  console.log("RENDERING: /app/products/page.tsx (Enhanced Products List with Search)");

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<ApiResponse | null>(null);
  
  // View states
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
  const apiUrl = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;

  // Handle search results from ProductSearch component
  const handleSearchResults = (results: ApiResponse) => {
    console.log('📥 Received search results:', results);
    
    // Validate and filter products
    if (results && results.data && Array.isArray(results.data)) {
      const validProducts = results.data.filter(product => {
        if (!product || !product.id || !product.name) {
          console.warn('⚠️ Filtering out invalid product:', product);
          return false;
        }
        return true;
      });
      
      console.log(`✅ Validated ${validProducts.length}/${results.data.length} products`);
      
      setSearchResults({
        ...results,
        data: validProducts
      });
      setProducts(validProducts);
      setError(null);
    } else {
      console.error('❌ Invalid search results format:', results);
      setError('פורמט תוצאות חיפוש לא תקין');
    }
  };

  // Handle loading state from ProductSearch component
  const handleLoadingState = (loading: boolean) => {
    setIsLoading(loading);
  };

  // Load initial products on mount
  useEffect(() => {
    const loadInitialProducts = async () => {
      console.log('🔄 Loading initial products...');
      setIsLoading(true);
      setError(null);
      
      try {
        const url = `${apiUrl}/api/products?limit=20&offset=0&sort_by=name&order=ASC`;
        console.log('📡 Fetching from:', url);
        
        const response = await fetch(url, {
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`שגיאה בשרת: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📊 Received data:', data);

        let validProducts: Product[] = [];
        let pageInfo = null;

        // Handle different API response formats
        if (data.products && Array.isArray(data.products)) {
          // Old format
          validProducts = data.products.filter((product: any) => {
            if (!product || !product.id || !product.name) {
              console.warn('⚠️ Filtering out invalid product (old format):', product);
              return false;
            }
            return true;
          });
          
          pageInfo = {
            total_items: data.total_items || validProducts.length,
            total_pages: data.total_pages || 1,
            current_page: data.current_page || 1,
            limit: data.items_per_page || 20,
            offset: 0,
            has_next: data.has_next || false,
            has_previous: data.has_previous || false
          };
        } else if (data.data && Array.isArray(data.data)) {
          // New format
          validProducts = data.data.filter((product: any) => {
            if (!product || !product.id || !product.name) {
              console.warn('⚠️ Filtering out invalid product (new format):', product);
              return false;
            }
            return true;
          });
          
          pageInfo = data.page_info || {
            total_items: validProducts.length,
            total_pages: 1,
            current_page: 1,
            limit: 20,
            offset: 0,
            has_next: false,
            has_previous: false
          };
        } else if (Array.isArray(data)) {
          // Direct array format
          validProducts = data.filter((product: any) => {
            if (!product || !product.id || !product.name) {
              console.warn('⚠️ Filtering out invalid product (array format):', product);
              return false;
            }
            return true;
          });
          
          pageInfo = {
            total_items: validProducts.length,
            total_pages: 1,
            current_page: 1,
            limit: 20,
            offset: 0,
            has_next: false,
            has_previous: false
          };
        } else {
          console.error('❌ Unexpected API response format:', data);
          throw new Error('פורמט תגובה לא צפוי מהשרת');
        }

        console.log(`✅ Successfully loaded ${validProducts.length} valid products`);
        
        setProducts(validProducts);
        setSearchResults({
          data: validProducts,
          page_info: pageInfo
        });

      } catch (e: any) {
        console.error("❌ Failed to load initial products:", e);
        setError(e.message || 'שגיאה בטעינת המוצרים. אנא נסה שוב מאוחר יותר.');
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialProducts();
  }, [apiUrl]);

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

  // Get current page info
  const currentPageInfo = searchResults?.page_info || {
    total_items: 0,
    total_pages: 1,
    current_page: 1,
    limit: 20,
    offset: 0,
    has_next: false,
    has_previous: false
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


  return (
    <main style={containerStyle}>
      <div style={overlayStyle}></div>
      <div style={contentStyle}>
        <h1 style={titleStyle}>
          🥩 חיפוש ועיון במוצרים
        </h1>
        
        {/* Enhanced Search Component */}
        <ProductSearch 
          onResults={handleSearchResults}
          onLoading={handleLoadingState}
          apiUrl={apiUrl}
        />

        {/* View Mode Toggle */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          justifyContent: 'flex-end',
          marginBottom: '1rem'
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

        {/* Results Info */}
        <div style={{
          textAlign: 'center',
          color: '#cbd5e1',
          marginTop: '1rem',
          fontSize: '0.875rem'
        }}>
          {currentPageInfo.total_items > 0 ? (
            <>נמצאו {currentPageInfo.total_items} מוצרים • מציג {products.length} תוצאות</>
          ) : (
            searchResults ? 'לא נמצאו מוצרים התואמים לחיפוש' : 'טוען מוצרים...'
          )}
        </div>
      </div>
    </main>
  );
}
