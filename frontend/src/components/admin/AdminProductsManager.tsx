'use client';

import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Product {
  id: number;
  name: string;
  brand?: string;
  cut_id?: number;
  cut_name?: string;
  cut_hebrew_name?: string;
  cut_category?: string;
  short_description?: string;
  created_at: string;
  updated_at: string;
}

interface Cut {
  id: number;
  name: string;
  hebrew_name: string;
  category: string;
}

const AdminProductsManager: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cuts, setCuts] = useState<Cut[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // טופס מוצר חדש
  const [newProduct, setNewProduct] = useState({
    name: '',
    brand: '',
    cut_id: '',
    short_description: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setError(null);
      const [productsRes, cutsRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/cuts')
      ]);
      
      const [productsData, cutsData] = await Promise.all([
        productsRes.json(),
        cutsRes.json()
      ]);
      
      console.log('Products data:', productsData);
      console.log('Cuts data:', cutsData);
      
      if (productsData.products || productsData.data) {
        setProducts(productsData.products || productsData.data || []);
      }
      if (cutsData.success) {
        setCuts(cutsData.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('שגיאה בטעינת נתונים');
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newProduct.name.trim()) {
      alert('נא למלא את שם המוצר');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const productData = {
        name: newProduct.name.trim(),
        brand: newProduct.brand.trim() || null,
        cut_id: newProduct.cut_id ? parseInt(newProduct.cut_id) : null,
        short_description: newProduct.short_description.trim() || null
      };

      console.log('Creating product:', productData);

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData)
      });

      const data = await response.json();
      console.log('Create product response:', data);

      if (response.ok && data.success) {
        setProducts([...products, data.data]);
        setNewProduct({ name: '', brand: '', cut_id: '', short_description: '' });
        setShowAddForm(false);
        alert('מוצר נוסף בהצלחה!');
      } else {
        throw new Error(data.error || 'שגיאה ביצירת מוצר');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      alert('שגיאה בהוספת מוצר: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingProduct.name,
          brand: editingProduct.brand || null,
          cut_id: editingProduct.cut_id || null,
          short_description: editingProduct.short_description || null
        })
      });

      const data = await response.json();

      if (response.ok) {
        setProducts(products.map(p => p.id === editingProduct.id ? {...editingProduct, ...data} : p));
        setEditingProduct(null);
        alert('מוצר עודכן בהצלחה!');
      } else {
        throw new Error(data.error || 'שגיאה בעדכון מוצר');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert('שגיאה בעדכון מוצר: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק מוצר זה?')) return;

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setProducts(products.filter(p => p.id !== id));
        alert('מוצר נמחק בהצלחה!');
      } else {
        const data = await response.json();
        throw new Error(data.error || 'שגיאה במחיקת מוצר');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('שגיאה במחיקת מוצר: ' + (error as Error).message);
    }
  };

  const getCutDisplay = (product: Product) => {
    if (product.cut_hebrew_name) {
      return `${product.cut_hebrew_name} (${product.cut_category})`;
    }
    return 'לא מוגדר';
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">ניהול מוצרים</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-600"
        >
          <PlusIcon className="w-5 h-5" />
          הוסף מוצר חדש
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* טופס הוספת מוצר */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">הוספת מוצר חדש</h2>
            
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">שם המוצר: *</label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                  placeholder="לדוגמה: חזה עוף טרי"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">מותג:</label>
                <input
                  type="text"
                  value={newProduct.brand}
                  onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="לדוגמה: יום טוב"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">סוג נתח:</label>
                <select
                  value={newProduct.cut_id}
                  onChange={(e) => setNewProduct({...newProduct, cut_id: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="">בחר נתח</option>
                  {cuts.map((cut) => (
                    <option key={cut.id} value={cut.id}>
                      {cut.hebrew_name} ({cut.category})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">תיאור קצר:</label>
                <textarea
                  value={newProduct.short_description}
                  onChange={(e) => setNewProduct({...newProduct, short_description: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                  rows={3}
                  placeholder="תיאור אופציונלי"
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
                >
                  {loading ? 'מוסיף...' : 'הוסף מוצר'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* רשימת מוצרים */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">מוצרים קיימים ({products.length})</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  מוצר
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  מותג
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  סוג נתח
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  תיאור
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    אין מוצרים עדיין
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {product.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.brand || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getCutDisplay(product)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {product.short_description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* טופס עריכת מוצר */}
      {editingProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">עריכת מוצר</h2>
            
            <form onSubmit={handleEditProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">שם המוצר: *</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">מותג:</label>
                <input
                  type="text"
                  value={editingProduct.brand || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, brand: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">סוג נתח:</label>
                <select
                  value={editingProduct.cut_id || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, cut_id: e.target.value ? parseInt(e.target.value) : undefined})}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="">בחר נתח</option>
                  {cuts.map((cut) => (
                    <option key={cut.id} value={cut.id}>
                      {cut.hebrew_name} ({cut.category})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">תיאור קצר:</label>
                <textarea
                  value={editingProduct.short_description || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, short_description: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:bg-gray-400"
                >
                  {loading ? 'שומר...' : 'שמור שינויים'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductsManager;