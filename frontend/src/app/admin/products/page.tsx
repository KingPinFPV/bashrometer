// src/app/admin/products/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import AdminPagination from '@/components/AdminPagination'; 

interface Product {
  id: number;
  name: string;
  brand: string | null;
  category: string | null;
  unit_of_measure: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  data: Product[];
  page_info?: {
    total_items?: number;
    limit?: number;
    offset?: number;
    current_page_count?: number;
    total_pages?: number;
  };
}

export default function AdminProductsPage() {
  console.log("AdminProductsPage.tsx - RENDERING - V7 (Checking JSX condition)"); 

  const { token, user, isLoading: authIsLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<Record<number, boolean>>({});
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const ITEMS_PER_PAGE = 10; 

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      if (currentPage !== 1) { 
          setCurrentPage(1);
      }
    }, 500); 

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);


  const fetchAdminProducts = useCallback(async (pageToFetch = 1, currentSearchTerm = debouncedSearchTerm) => {
    if (!token || !user || user.role !== 'admin') {
      setError("אין לך הרשאה לצפות בדף זה או שאינך מחובר.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    
    const offset = (pageToFetch - 1) * ITEMS_PER_PAGE;
    let apiUrl = `https://automatic-space-pancake-gr4rjjxpxg5fwj6w-3000.app.github.dev/api/products?limit=${ITEMS_PER_PAGE}&offset=${offset}`;
    
    if (currentSearchTerm.trim() !== '') {
      apiUrl += `&name_like=${encodeURIComponent(currentSearchTerm.trim())}`;
    }
    
    console.log("fetchAdminProducts: Fetching from URL:", apiUrl);
    try {
      const response = await fetch(apiUrl, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to parse error JSON" }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data: ApiResponse = await response.json();
      setProducts(data.data || []);
      if (data.page_info && data.page_info.total_items !== undefined && data.page_info.limit !== undefined) {
        const calculatedTotalPages = Math.ceil(data.page_info.total_items / data.page_info.limit);
        setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 0); // מנע totalPages שלילי או אפס אם אין פריטים
      } else if (data.data && data.data.length > 0 && (!data.page_info || data.page_info.total_items === undefined)) {
        setTotalPages(1);
      } else { 
        setTotalPages(0); 
      }
      setCurrentPage(pageToFetch);
    } catch (e: any) {
      console.error("Failed to fetch admin products:", e);
      setError(e.message || 'Failed to load products.');
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  }, [token, user, ITEMS_PER_PAGE, debouncedSearchTerm]); 

  useEffect(() => {
    if (!authIsLoading) { 
      if (user && token) { 
          fetchAdminProducts(currentPage, debouncedSearchTerm); 
      } else {
          setError("יש להתחבר כאדמין כדי לצפות בדף זה.");
          setIsLoading(false); 
      }
    }
  }, [authIsLoading, user, token, currentPage, debouncedSearchTerm, fetchAdminProducts]); 

  const handleDeleteProduct = async (productId: number, productName: string) => {
    if (!token || (user && user.role !== 'admin')) { return; }
    const confirmDelete = window.confirm(`האם אתה בטוח שברצונך למחוק את המוצר "${productName}" (ID: ${productId})?`);
    if (!confirmDelete) return;
    setActionMessage(null); 
    setIsDeleting(prev => ({ ...prev, [productId]: true })); 
    const apiUrl = `https://automatic-space-pancake-gr4rjjxpxg5fwj6w-3000.app.github.dev/api/products/${productId}`;
    try {
      const response = await fetch(apiUrl, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }});
      if (response.status === 204 || response.ok) { 
        setActionMessage(`המוצר "${productName}" נמחק בהצלחה.`);
        if (products.length === 1 && currentPage > 1) {
            fetchAdminProducts(currentPage - 1, debouncedSearchTerm);
        } else {
            fetchAdminProducts(currentPage, debouncedSearchTerm); 
        }
      } else { 
        const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
        setActionMessage(errorData.error || 'אירעה שגיאה במחיקת המוצר.');
      }
    } catch (e: any) { setActionMessage(`שגיאת רשת במחיקת המוצר: ${e.message}`); } 
    finally { setIsDeleting(prev => ({ ...prev, [productId]: false })); }
  };
  
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && (totalPages === 0 || newPage <= totalPages) && newPage !== currentPage) {
      setCurrentPage(newPage);
    }
  };

  if (authIsLoading || (isLoading && products.length === 0 && currentPage === 1 && !debouncedSearchTerm)) { 
    return <div className="text-center py-10">טוען נתונים...</div>;
  }
  if (error) {
    return <div className="text-center py-10 text-red-600">שגיאה: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-slate-800">ניהול מוצרים</h1>
        <div className="w-full sm:w-auto">
          <input
            type="text"
            placeholder="חפש מוצר לפי שם..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm w-full sm:w-64"
          />
        </div>
        <Link
          href="/admin/products/new"
          className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition-colors w-full sm:w-auto text-center"
        >
          הוסף מוצר חדש
        </Link>
      </div>

      {actionMessage && (
        <div className={`p-4 mb-4 text-sm rounded-md ${actionMessage.includes('בהצלחה') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {actionMessage}
        </div>
      )}

      {products.length === 0 && !isLoading && !error ? (
        <p className="text-slate-600">
          {debouncedSearchTerm ? `לא נמצאו מוצרים התואמים לחיפוש "${debouncedSearchTerm}".` : "לא נמצאו מוצרים במערכת."}
        </p>
      ) : (
        products.length > 0 && !isLoading && // הוספתי !isLoading כאן כדי למנוע ריצוד אם הרשימה מתרוקנת ואז מתמלאת
        <>
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100">
                <tr>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">שם מוצר</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">מותג</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">קטגוריה</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">פעיל?</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">פעולות</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{product.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{product.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{product.brand || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{product.category || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.is_active ? 'כן' : 'לא'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/admin/products/edit/${product.id}`} className="text-sky-600 hover:text-sky-800 mr-3 rtl:ml-3 rtl:mr-0">
                        ערוך
                      </Link>
                      <button 
                        onClick={() => handleDeleteProduct(product.id, product.name)}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isDeleting[product.id] || isLoading} 
                      >
                        {isDeleting[product.id] ? 'מוחק...' : 'מחק'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <AdminPagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                onPageChange={handlePageChange} 
              />
            </div>
          )}
        </>
      )}
      {/* הצג הודעת "מעדכן..." אם isLoading הוא true אבל יש כבר מוצרים (כלומר, זה רענון ולא טעינה ראשונית) */}
      {isLoading && products.length > 0 && <div className="text-center py-4 text-slate-500">מעדכן רשימת מוצרים...</div>}
    </div>
  );
}