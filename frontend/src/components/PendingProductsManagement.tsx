'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProductCard from './ProductCard';
import LoadingSpinner from './LoadingSpinner';
import { CheckCircle, XCircle, Eye, AlertCircle } from 'lucide-react';

interface PendingProduct {
  id: number;
  name: string;
  category: string;
  brand?: string;
  cut_name?: string;
  cut_category?: string;
  subtype_name?: string;
  hebrew_description?: string;
  status: string;
  created_at: string;
  created_by_name?: string;
  created_by_email?: string;
  description?: string;
  quality_grade?: string;
  processing_state?: string;
  has_bone?: boolean;
  kosher_level?: string;
  origin_country?: string;
}

interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  current_page: number;
  total_pages: number;
  hasMore: boolean;
}

const PendingProductsManagement: React.FC = () => {
  const { token } = useAuth();
  const [pendingProducts, setPendingProducts] = useState<PendingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    limit: 10,
    offset: 0,
    current_page: 1,
    total_pages: 0,
    hasMore: false
  });
  const [selectedProduct, setSelectedProduct] = useState<PendingProduct | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

  useEffect(() => {
    fetchPendingProducts();
  }, [pagination.offset]);

  const fetchPendingProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!token) {
        setError('נדרש אימות');
        return;
      }

      const response = await fetch(
        `${API_URL}/api/products/pending?limit=${pagination.limit}&offset=${pagination.offset}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          setError('אין הרשאות לצפייה במוצרים ממתינים');
        } else if (response.status === 401) {
          setError('נדרש אימות מחדש');
        } else {
          setError(`שגיאה: ${response.status}`);
        }
        return;
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.products)) {
        setPendingProducts(data.products);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else {
        setError('פורמט נתונים לא תקין');
      }

    } catch (error) {
      console.error('Error fetching pending products:', error);
      setError('שגיאה בחיבור לשרת');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (productId: number) => {
    try {
      setActionLoading(productId);

      const response = await fetch(`${API_URL}/api/admin/products/${productId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // הסר את המוצר מהרשימה
        setPendingProducts(prev => prev.filter(p => p.id !== productId));
        // עדכן מונה
        setPagination(prev => ({ ...prev, total: prev.total - 1 }));
        
        // הצג הודעת הצלחה
        alert('המוצר אושר בהצלחה!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'שגיאה באישור המוצר');
      }

    } catch (error) {
      console.error('Error approving product:', error);
      alert('שגיאה באישור המוצר');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (productId: number, reason?: string) => {
    try {
      setActionLoading(productId);

      const response = await fetch(`${API_URL}/api/admin/products/${productId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rejection_reason: reason || 'לא צוין'
        })
      });

      if (response.ok) {
        setPendingProducts(prev => prev.filter(p => p.id !== productId));
        setPagination(prev => ({ ...prev, total: prev.total - 1 }));
        
        alert('המוצר נדחה');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'שגיאה בדחיית המוצר');
      }

    } catch (error) {
      console.error('Error rejecting product:', error);
      alert('שגיאה בדחיית המוצר');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePageChange = (newOffset: number) => {
    setPagination(prev => ({ ...prev, offset: newOffset }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 ml-2" />
          <h3 className="text-red-800 font-medium">שגיאה</h3>
        </div>
        <p className="text-red-700 mt-2">{error}</p>
        <button
          onClick={() => fetchPendingProducts()}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
        >
          נסה שוב
        </button>
      </div>
    );
  }

  return (
    <div className="pending-products-management">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          מוצרים ממתינים לאישור
        </h2>
        <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
          {pagination.total} ממתינים
        </div>
      </div>

      {pendingProducts.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">כל המוצרים אושרו!</h3>
          <p className="text-gray-600">אין מוצרים ממתינים לאישור כרגע</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {pendingProducts.map(product => (
              <div key={product.id} className="relative">
                <ProductCard
                  id={product.id}
                  name={product.name}
                  category={product.category}
                  brand={product.brand}
                  cut_name={product.cut_name}
                  subtype_name={product.subtype_name || product.hebrew_description}
                  status={product.status}
                  created_at={product.created_at}
                  showStatus={true}
                  className="mb-4"
                />
                
                {/* Product Details */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">פרטים נוספים</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    {product.created_by_name && (
                      <div>
                        <span className="font-medium">נוצר על ידי:</span> {product.created_by_name}
                      </div>
                    )}
                    {product.quality_grade && (
                      <div>
                        <span className="font-medium">איכות:</span> {product.quality_grade}
                      </div>
                    )}
                    {product.processing_state && (
                      <div>
                        <span className="font-medium">עיבוד:</span> {product.processing_state}
                      </div>
                    )}
                    {product.has_bone !== undefined && (
                      <div>
                        <span className="font-medium">עצם:</span> {product.has_bone ? 'כן' : 'לא'}
                      </div>
                    )}
                    {product.kosher_level && (
                      <div>
                        <span className="font-medium">כשרות:</span> {product.kosher_level}
                      </div>
                    )}
                    {product.origin_country && (
                      <div>
                        <span className="font-medium">מקור:</span> {product.origin_country}
                      </div>
                    )}
                  </div>
                  {product.description && (
                    <div className="mt-2">
                      <span className="font-medium text-gray-700">תיאור:</span>
                      <p className="text-gray-600 text-sm mt-1">{product.description}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(product.id)}
                    disabled={actionLoading === product.id}
                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {actionLoading === product.id ? (
                      <LoadingSpinner size="sm" className="ml-2" />
                    ) : (
                      <CheckCircle className="w-4 h-4 ml-2" />
                    )}
                    אשר
                  </button>
                  
                  <button
                    onClick={() => {
                      const reason = prompt('סיבת דחייה (אופציונלי):');
                      if (reason !== null) { // User didn't cancel
                        handleReject(product.id, reason);
                      }
                    }}
                    disabled={actionLoading === product.id}
                    className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <XCircle className="w-4 h-4 ml-2" />
                    דחה
                  </button>
                  
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="flex justify-center items-center mt-8 space-x-2 space-x-reverse">
              <button
                onClick={() => handlePageChange(pagination.offset - pagination.limit)}
                disabled={pagination.offset === 0}
                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                הקודם
              </button>
              
              <span className="px-4 py-2 text-sm text-gray-600">
                עמוד {pagination.current_page} מתוך {pagination.total_pages}
              </span>
              
              <button
                onClick={() => handlePageChange(pagination.offset + pagination.limit)}
                disabled={!pagination.hasMore}
                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                הבא
              </button>
            </div>
          )}
        </>
      )}

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">פרטי המוצר</h3>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <ProductCard
                  id={selectedProduct.id}
                  name={selectedProduct.name}
                  category={selectedProduct.category}
                  brand={selectedProduct.brand}
                  cut_name={selectedProduct.cut_name}
                  subtype_name={selectedProduct.subtype_name}
                  status={selectedProduct.status}
                  created_at={selectedProduct.created_at}
                  showStatus={true}
                />
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">מידע מפורט</h4>
                  <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                    {JSON.stringify(selectedProduct, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingProductsManagement;