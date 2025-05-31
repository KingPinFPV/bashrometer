// src/components/ProductsManagement.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AddProductModal from '@/components/admin/AddProductModal';
import { 
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  Check,
  X,
  AlertCircle
} from 'lucide-react';

interface Product {
  id: number;
  name: string;
  category?: string;
  brand?: string;
  kosher_level?: string;
  animal_type?: string;
  cut_type?: string;
  unit_of_measure: string;
  is_active: boolean;
  created_at: string;
  min_price_per_100g?: number;
}

const ProductsManagement: React.FC = () => {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showActionsMenu, setShowActionsMenu] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{show: boolean, productId: number, productName: string}>({
    show: false,
    productId: 0,
    productName: ''
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const fetchProducts = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const offset = (currentPage - 1) * ITEMS_PER_PAGE;
        const searchQuery = searchTerm ? `&name_like=${encodeURIComponent(searchTerm)}` : '';
        
        const response = await fetch(
          `${API_URL}/api/products?limit=${ITEMS_PER_PAGE}&offset=${offset}${searchQuery}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        if (!response.ok) {
          throw new Error('שגיאה בטעינת המוצרים');
        }

        const data = await response.json();
        setProducts(data.products || []);
        
        if (data.total_items) {
          setTotalPages(data.total_pages || Math.ceil(data.total_items / ITEMS_PER_PAGE));
        }

      } catch (err) {
        console.error('Error fetching products:', err);
        setError('שגיאה בטעינת המוצרים');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [token, API_URL, currentPage, searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
  };

  const showDeleteModal = (productId: number, productName: string) => {
    setDeleteModal({
      show: true,
      productId,
      productName
    });
    setShowActionsMenu(null); // Close actions menu
  };

  const hideDeleteModal = () => {
    setDeleteModal({
      show: false,
      productId: 0,
      productName: ''
    });
  };

  const handleDeleteProduct = async () => {
    if (!token || !deleteModal.productId) return;
    
    setIsDeleting(true);

    try {
      const response = await fetch(`${API_URL}/api/products/${deleteModal.productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setProducts(products.filter(p => p.id !== deleteModal.productId));
        hideDeleteModal();
        // You could add a toast notification here instead of alert
      } else {
        throw new Error('שגיאה במחיקת המוצר');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('שגיאה במחיקת המוצר');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleProductAdded = () => {
    // Refresh the products list after adding a new product
    const fetchProducts = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const offset = (currentPage - 1) * ITEMS_PER_PAGE;
        const searchQuery = searchTerm ? `&name_like=${encodeURIComponent(searchTerm)}` : '';
        
        const response = await fetch(
          `${API_URL}/api/products?limit=${ITEMS_PER_PAGE}&offset=${offset}${searchQuery}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
          
          if (data.total_items) {
            setTotalPages(data.total_pages || Math.ceil(data.total_items / ITEMS_PER_PAGE));
          }
        }
      } catch (err) {
        console.error('Error refreshing products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען מוצרים...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <div className="mr-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ניהול מוצרים</h1>
          <p className="mt-1 text-gray-600">נהל את רשימת המוצרים במערכת ({products.length} מוצרים)</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 ml-2" />
          הוסף מוצר חדש
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="חיפוש מוצרים לפי שם..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            חפש
          </button>
        </form>
      </div>

      {/* Products Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">מוצר</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">קטגוריה</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">מותג</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">יחידת מידה</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">מחיר מינימלי</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">סטטוס</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">פעולות</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-500">#{product.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.category || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.brand || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.unit_of_measure}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.min_price_per_100g ? `₪${product.min_price_per_100g}/100g` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {product.is_active ? (
                        <>
                          <Check className="w-3 h-3 ml-1" />
                          פעיל
                        </>
                      ) : (
                        <>
                          <X className="w-3 h-3 ml-1" />
                          לא פעיל
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                    <button
                      onClick={() => setShowActionsMenu(showActionsMenu === product.id ? null : product.id)}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    
                    {showActionsMenu === product.id && (
                      <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                        <div className="py-1">
                          <a
                            href={`/admin/products/edit/${product.id}`}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Edit className="w-4 h-4 ml-2" />
                            ערוך מוצר
                          </a>
                          <a
                            href={`/products/${product.id}`}
                            target="_blank"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Eye className="w-4 h-4 ml-2" />
                            צפה במוצר
                          </a>
                          <button
                            onClick={() => showDeleteModal(product.id, product.name)}
                            className="w-full flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 ml-2" />
                            מחק מוצר
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                עמוד {currentPage} מתוך {totalPages}
              </div>
              <div className="flex space-x-2 space-x-reverse">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  הקודם
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  הבא
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <AddProductModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleProductAdded}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-500 ml-3" />
              <h3 className="text-lg font-medium text-gray-900">אישור מחיקת מוצר</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              האם אתה בטוח שברצונך למחוק את המוצר{' '}
              <span className="font-semibold text-gray-900">&quot;{deleteModal.productName}&quot;</span>?
              <br />
              <span className="text-sm text-red-600 mt-2 block">
                פעולה זו אינה ניתנת לביטול ותמחק את כל המחירים הקשורים למוצר זה.
              </span>
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={hideDeleteModal}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={handleDeleteProduct}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                    מוחק...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 ml-2" />
                    מחק מוצר
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsManagement;