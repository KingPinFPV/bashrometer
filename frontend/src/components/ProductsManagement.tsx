// src/components/ProductsManagement.tsx
"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AddProductModal from '@/components/admin/AddProductModal';
import PendingProductsManagement from '@/components/PendingProductsManagement';
import TabButtons from '@/components/TabButtons';
import LoadingSpinner from '@/components/LoadingSpinner';
import EditProductModal from '@/components/EditProductModal';
import { authenticatedApiCall } from '@/config/api';
import { 
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  Check,
  X,
  AlertCircle,
  Clock
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
  min_price_per_1kg?: number;
  status?: string;
  cut_name?: string;
  subtype_name?: string;
  created_by_name?: string;
  created_by_email?: string;
  rejection_reason?: string;
}

const ProductsManagement: React.FC = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'approved' | 'pending' | 'all'>('approved');
  const [products, setProducts] = useState<Product[]>([]);
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
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
  const [rejectModal, setRejectModal] = useState<{show: boolean, productId: number, productName: string}>({
    show: false,
    productId: 0,
    productName: ''
  });
  const [rejectReason, setRejectReason] = useState('');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const ITEMS_PER_PAGE = 10;

  const loadPendingProducts = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await authenticatedApiCall('/api/products/pending');
      console.log('⏳ Pending products data received:', data);
      
      // טיפול בפורמטים שונים של response
      let pendingArray = [];
      if (Array.isArray(data)) {
        pendingArray = data;
      } else if (data && Array.isArray(data.products)) {
        pendingArray = data.products;
      } else if (data && Array.isArray(data.data)) {
        pendingArray = data.data;
      } else {
        console.warn('⚠️ Unexpected pending products format:', data);
        pendingArray = [];
      }
      
      setPendingProducts(pendingArray);
      
    } catch (error) {
      console.error('Error loading pending products:', error);
      setError('שגיאה בטעינת מוצרים ממתינים');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveProduct = async (productId: number) => {
    try {
      await authenticatedApiCall(`/api/admin/products/${productId}/approve`, {
        method: 'POST'
      });
      
      setPendingProducts(prev => prev.filter(p => p.id !== productId));
      
    } catch (error) {
      console.error('Error approving product:', error);
      alert('שגיאה באישור המוצר');
    }
  };

  const handleRejectProduct = async (productId?: number) => {
    const targetId = productId || rejectModal.productId;
    if (!targetId) return;
    
    try {
      await authenticatedApiCall(`/api/admin/products/${targetId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: rejectReason || null })
      });
      
      setPendingProducts(prev => prev.filter(p => p.id !== targetId));
      setRejectModal({ show: false, productId: 0, productName: '' });
      setRejectReason('');
      
    } catch (error) {
      console.error('Error rejecting product:', error);
      alert('שגיאה בדחיית המוצר');
    }
  };

  const fetchProducts = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        status: 'approved',
        limit: ITEMS_PER_PAGE.toString(),
        offset: ((currentPage - 1) * ITEMS_PER_PAGE).toString()
      });
      
      if (searchTerm) {
        params.append('name_like', searchTerm);
      }
      
      const data = await authenticatedApiCall(`/api/products?${params.toString()}`);
      console.log('📦 Products data received:', data);
      
      // טיפול בפורמטים שונים של response
      let productsArray = [];
      if (Array.isArray(data)) {
        productsArray = data;
      } else if (data && Array.isArray(data.products)) {
        productsArray = data.products;
      } else if (data && Array.isArray(data.data)) {
        productsArray = data.data;
      } else {
        console.warn('⚠️ Unexpected data format:', data);
        productsArray = [];
      }
      
      setProducts(productsArray);
      
      if (data && data.total_items) {
        setTotalPages(data.total_pages || Math.ceil(data.total_items / ITEMS_PER_PAGE));
      }

    } catch (err) {
      console.error('Error fetching products:', err);
      setError('שגיאה בטעינת המוצרים');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    loadPendingProducts();
  }, [token, currentPage, searchTerm]);

  useEffect(() => {
    if (activeTab === 'pending') {
      loadPendingProducts();
    }
  }, [activeTab]);

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
    fetchProducts();
    loadPendingProducts();
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setShowEditModal(true);
  };

  const handleSaveProduct = async (updatedProduct: any) => {
    try {
      console.log('💾 Saving product:', updatedProduct);
      
      const response = await authenticatedApiCall(`/api/admin/products/${updatedProduct.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedProduct)
      });
      
      console.log('✅ Product save response:', response);
      
      setShowEditModal(false);
      setEditingProduct(null);
      
      // רענן את הרשימות
      await Promise.all([
        fetchProducts(),
        loadPendingProducts()
      ]);
      
      if (response.success && response.message) {
        console.log('✅ Product updated successfully:', response.message);
      }
      
    } catch (error: any) {
      console.error('🚨 Error saving product:', error);
      
      let errorMessage = 'שגיאה בשמירת המוצר';
      
      // Handle detailed error messages from the API
      if (error.response?.data?.details) {
        errorMessage = `שגיאה: ${error.response.data.details}`;
      } else if (error.response?.data?.error) {
        errorMessage = `שגיאה: ${error.response.data.error}`;
      } else if (error.message) {
        errorMessage = `שגיאה: ${error.message}`;
      }
      
      setError(errorMessage);
      
      // Also show alert for immediate user feedback
      alert(errorMessage);
    }
  };

  const getCurrentProducts = () => {
    // הוסף הגנות מפני null/undefined
    const safeProducts = Array.isArray(products) ? products : [];
    const safePendingProducts = Array.isArray(pendingProducts) ? pendingProducts : [];
    
    switch (activeTab) {
      case 'pending':
        return safePendingProducts;
      case 'approved':
        return safeProducts;
      case 'all':
        return [...safeProducts, ...safePendingProducts].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      default:
        return safeProducts;
    }
  };


  if (loading) {
    return (
      <div className="py-12">
        <LoadingSpinner text="טוען מוצרים..." />
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

  const currentProducts = getCurrentProducts();
  console.log('🔍 Current products for display:', {
    activeTab,
    productsCount: products.length,
    pendingProductsCount: pendingProducts.length,
    currentProductsCount: currentProducts.length,
    sampleProduct: currentProducts[0]
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ניהול מוצרים</h1>
          <p className="mt-1 text-gray-600">נהל את רשימת המוצרים במערכת</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 ml-2" />
          הוסף מוצר חדש
        </button>
      </div>

      {/* Tabs */}
      <TabButtons
        tabs={[
          { id: 'approved', label: 'מוצרים מאושרים', count: products.length },
          { id: 'pending', label: 'ממתינים לאישור', count: pendingProducts.length },
          { id: 'all', label: 'כל המוצרים', count: products.length + pendingProducts.length }
        ]}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as 'approved' | 'pending' | 'all')}
        className="mb-6"
      />

      {/* Search - Hide for pending tab since it has its own UI */}
      {activeTab !== 'pending' && (
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
      )}

      {/* Pending Products */}
      {activeTab === 'pending' ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">מוצרים ממתינים לאישור</h2>
          
          {pendingProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              אין מוצרים ממתינים לאישור
            </div>
          ) : (
            pendingProducts.map(product => (
              <div key={product.id} className="border rounded-lg p-4 bg-white shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{product.name}</h3>
                    <p className="text-gray-600">{product.category}</p>
                    {product.cut_name && (
                      <p className="text-sm text-gray-500">נתח: {product.cut_name}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      נוצר ב: {new Date(product.created_at).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                    >
                      ערוך
                    </button>
                    <button
                      onClick={() => handleApproveProduct(product.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                    >
                      אשר
                    </button>
                    <button
                      onClick={() => handleRejectProduct(product.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                    >
                      דחה
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Products Table */
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">מוצר</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">קטגוריה</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">נתח</th>
                {activeTab === 'pending' && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">נוצר על ידי</th>
                )}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">סטטוס</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">תאריך</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">פעולות</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-500">#{product.id}</div>
                    {product.brand && (
                      <div className="text-sm text-gray-500">מותג: {product.brand}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.category || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.cut_name || '-'}
                  </td>
                  {activeTab === 'pending' && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.created_by_name || 'לא ידוע'}</div>
                      <div className="text-sm text-gray-500">{product.created_by_email}</div>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : product.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : product.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : product.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {product.status === 'approved' && (
                        <>
                          <Check className="w-3 h-3 ml-1" />
                          מאושר
                        </>
                      )}
                      {product.status === 'pending' && (
                        <>
                          <AlertCircle className="w-3 h-3 ml-1" />
                          ממתין
                        </>
                      )}
                      {product.status === 'rejected' && (
                        <>
                          <X className="w-3 h-3 ml-1" />
                          נדחה
                        </>
                      )}
                      {!product.status && (
                        <>
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
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(product.created_at).toLocaleDateString('he-IL')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {activeTab === 'pending' && product.status === 'pending' ? (
                      <div className="flex space-x-2 space-x-reverse">
                        <button
                          onClick={() => handleApproveProduct(product.id)}
                          className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                        >
                          אשר
                        </button>
                        <button
                          onClick={() => setRejectModal({ show: true, productId: product.id, productName: product.name })}
                          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                        >
                          דחה
                        </button>
                      </div>
                    ) : (
                      activeTab === 'pending' && product.status === 'pending' ? (
                        <div className="flex space-x-2 space-x-reverse">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          >
                            ערוך
                          </button>
                          <button
                            onClick={() => handleApproveProduct(product.id)}
                            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                          >
                            אשר
                          </button>
                          <button
                            onClick={() => setRejectModal({ show: true, productId: product.id, productName: product.name })}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                          >
                            דחה
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <button
                            onClick={() => setShowActionsMenu(showActionsMenu === product.id ? null : product.id)}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {showActionsMenu === product.id && (
                            <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                              <div className="py-1">
                                <button
                                  onClick={() => handleEditProduct(product)}
                                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <Edit className="w-4 h-4 ml-2" />
                                  ערוך מוצר
                                </button>
                                <a
                                  href={`/products/${product.id}`}
                                  target="_blank"
                                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <Eye className="w-4 h-4 ml-2" />
                                  צפה במוצר
                                </a>
                                {product.status === 'approved' && (
                                  <button
                                    onClick={() => showDeleteModal(product.id, product.name)}
                                    className="w-full flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4 ml-2" />
                                    מחק מוצר
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* הודעה אם אין מוצרים */}
        {getCurrentProducts().length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-lg mb-2">📦</div>
            <div>
              {activeTab === 'approved' && 'אין מוצרים מאושרים'}
              {activeTab === 'pending' && 'אין מוצרים ממתינים לאישור'}
              {activeTab === 'all' && 'אין מוצרים כלל'}
            </div>
          </div>
        )}

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
      )}

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

      {/* Reject Product Modal */}
      {rejectModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">דחיית מוצר</h3>
            <p className="text-gray-600 mb-4">
              אתה עומד לדחות את המוצר &quot;{rejectModal.productName}&quot;. אנא ציין סיבה:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="סיבת הדחיה (אופציונלי)..."
              className="w-full border rounded p-2 h-24 mb-4"
            />
            <div className="flex space-x-3 space-x-reverse">
              <button
                onClick={handleRejectProduct}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                דחה מוצר
              </button>
              <button
                onClick={() => {
                  setRejectModal({ show: false, productId: 0, productName: '' });
                  setRejectReason('');
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && (
        <EditProductModal
          productId={editingProduct?.id || null}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingProduct(null);
          }}
          onSave={handleSaveProduct}
        />
      )}
    </div>
  );
};

export default ProductsManagement;