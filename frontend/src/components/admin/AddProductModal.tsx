'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Cut {
  id: number;
  name: string;
  hebrew_name: string;
  category: string;
}

interface AddProductModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddProductModal: React.FC<AddProductModalProps> = ({ onClose, onSuccess }) => {
  const { token } = useAuth();
  const [cuts, setCuts] = useState<Cut[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    cut_id: '',
    short_description: '',
    category: '',
    unit_of_measure: 'kg'
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

  useEffect(() => {
    fetchCuts();
  }, []);

  const fetchCuts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/cuts`);
      const data = await response.json();
      
      if (data.success) {
        setCuts(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching cuts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('נא למלא את שם המוצר');
      return;
    }
    
    if (!token) {
      setError('נדרשת התחברות');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const productData = {
        name: formData.name.trim(),
        brand: formData.brand.trim() || null,
        cut_id: formData.cut_id ? parseInt(formData.cut_id) : null,
        short_description: formData.short_description.trim() || null,
        category: formData.category.trim() || null,
        unit_of_measure: formData.unit_of_measure
      };

      const response = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onSuccess();
        onClose();
      } else {
        throw new Error(data.error || 'שגיאה ביצירת מוצר');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      setError('שגיאה בהוספת מוצר: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">הוספת מוצר חדש</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              שם המוצר *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="לדוגמה: חזה עוף טרי"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              מותג
            </label>
            <input
              type="text"
              name="brand"
              value={formData.brand}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="לדוגמה: יום טוב, עוף טוב"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              קטגוריה
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="לדוגמה: עוף, בקר, דגים"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              סוג נתח
            </label>
            <select
              name="cut_id"
              value={formData.cut_id}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">בחר סוג נתח (אופציונלי)</option>
              {cuts.map((cut) => (
                <option key={cut.id} value={cut.id}>
                  {cut.hebrew_name} ({cut.category})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              יחידת מידה
            </label>
            <select
              name="unit_of_measure"
              value={formData.unit_of_measure}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="kg">קילוגרם (kg)</option>
              <option value="g">גרם (g)</option>
              <option value="100g">100 גרם (100g)</option>
              <option value="unit">יחידה (unit)</option>
              <option value="package">חבילה (package)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              תיאור קצר
            </label>
            <textarea
              name="short_description"
              value={formData.short_description}
              onChange={handleInputChange}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="תיאור אופציונלי של המוצר"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                  מוסיף...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 ml-2" />
                  הוסף מוצר
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;