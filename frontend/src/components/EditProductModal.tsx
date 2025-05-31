"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

import React, { useState, useEffect } from 'react';
import { authenticatedApiCall } from '@/config/api';
import { X, Save, AlertCircle } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Cut {
  id: number;
  name: string;
  hebrew_name: string;
  category: string;
}

interface ProductSubtype {
  id: number;
  cut_id: number;
  name: string;
  hebrew_description: string;
  purpose?: string;
}

interface EditProductModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: any) => void;
}

const EditProductModal: React.FC<EditProductModalProps> = ({ 
  product, isOpen, onClose, onSave 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    brand: '',
    cut_id: null as number | null,
    product_subtype_id: null as number | null,
    animal_type: '',
    kosher_level: '',
    unit_of_measure: 'kg',
    origin_country: '',
    default_weight_per_unit_grams: null as number | null
  });
  
  const [cuts, setCuts] = useState<Cut[]>([]);
  const [subtypes, setSubtypes] = useState<ProductSubtype[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const categories = ['בקר', 'עוף', 'כבש', 'טלה', 'הודו', 'ברווז', 'אווז', 'עגל', 'עז', 'ארנב', 'איברים'];
  const kosherLevels = ['לא ידוע', 'רגיל', 'מהדרין', 'גלאט', 'ללא', 'אחר'];
  const unitsOfMeasure = ['100g', 'kg', 'g', 'unit', 'package'];
  
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        category: product.category || '',
        description: product.description || '',
        brand: product.brand || '',
        cut_id: product.cut_id || null,
        product_subtype_id: product.product_subtype_id || null,
        animal_type: product.animal_type || '',
        kosher_level: product.kosher_level || 'לא ידוע',
        unit_of_measure: product.unit_of_measure || 'kg',
        origin_country: product.origin_country || '',
        default_weight_per_unit_grams: product.default_weight_per_unit_grams || null
      });
    }
  }, [product]);
  
  // טען נתחים כשהקטגוריה משתנה
  useEffect(() => {
    if (formData.category || formData.animal_type) {
      loadCuts();
    }
  }, [formData.category, formData.animal_type]);
  
  // טען תת-נתחים כשהנתח משתנה
  useEffect(() => {
    if (formData.cut_id) {
      loadSubtypes();
    } else {
      setSubtypes([]);
    }
  }, [formData.cut_id]);
  
  const loadCuts = async () => {
    try {
      setLoading(true);
      const searchCategory = formData.animal_type || formData.category;
      const data = await authenticatedApiCall(`/api/cuts?category=${encodeURIComponent(searchCategory)}`);
      console.log('🔍 EditProductModal - Cuts API response:', data);
      
      let cutsArray = [];
      if (Array.isArray(data)) {
        cutsArray = data;
      } else if (data && Array.isArray(data.cuts)) {
        cutsArray = data.cuts;
      } else if (data && Array.isArray(data.data)) {
        cutsArray = data.data;
      } else {
        console.warn('⚠️ EditProductModal - Unexpected cuts API format:', data);
        cutsArray = [];
      }
      
      setCuts(cutsArray);
    } catch (error) {
      console.error('Error loading cuts:', error);
      setError('שגיאה בטעינת נתחים');
    } finally {
      setLoading(false);
    }
  };
  
  const loadSubtypes = async () => {
    try {
      const data = await authenticatedApiCall(`/api/admin/subtypes`);
      console.log('🏷️ EditProductModal - Subtypes API response:', data);
      
      let allSubtypes = [];
      if (Array.isArray(data)) {
        allSubtypes = data;
      } else if (data && Array.isArray(data.subtypes)) {
        allSubtypes = data.subtypes;
      } else if (data && Array.isArray(data.data)) {
        allSubtypes = data.data;
      } else {
        console.warn('⚠️ EditProductModal - Unexpected subtypes API format:', data);
        allSubtypes = [];
      }
      
      const filteredSubtypes = allSubtypes.filter((st: ProductSubtype) => st.cut_id === formData.cut_id);
      setSubtypes(filteredSubtypes);
    } catch (error) {
      console.error('Error loading subtypes:', error);
      setError('שגיאה בטעינת תת-נתחים');
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('שם המוצר הוא שדה חובה');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      // נקה ערכים ריקים
      const cleanedData = {
        ...formData,
        name: formData.name.trim(),
        brand: formData.brand?.trim() || null,
        description: formData.description?.trim() || null,
        animal_type: formData.animal_type?.trim() || null,
        origin_country: formData.origin_country?.trim() || null
      };
      
      await onSave({ ...product, ...cleanedData });
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      setError('שגיאה בשמירת המוצר');
    } finally {
      setSaving(false);
    }
  };
  
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // אם שינו קטגוריה או סוג בעל חיים, נקה נתח ותת-נתח
      if (field === 'category' || field === 'animal_type') {
        newData.cut_id = null;
        newData.product_subtype_id = null;
      }
      
      // אם שינו נתח, נקה תת-נתח
      if (field === 'cut_id') {
        newData.product_subtype_id = null;
      }
      
      return newData;
    });
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">עריכת מוצר מתקדמת</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
              <span className="text-red-700">{error}</span>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* שם המוצר */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                שם המוצר <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="שם המוצר במלואו"
              />
            </div>
            
            {/* מותג */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">מותג</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="שם המותג"
              />
            </div>
            
            {/* קטגוריה */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                קטגוריה <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">בחר קטגוריה</option>
                {Array.isArray(categories) ? categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                )) : null}
              </select>
            </div>
            
            {/* סוג בעל חיים */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">סוג בעל חיים</label>
              <select
                value={formData.animal_type}
                onChange={(e) => handleInputChange('animal_type', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">בחר סוג</option>
                {Array.isArray(categories) ? categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                )) : null}
              </select>
            </div>
            
            {/* נתח */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">נתח</label>
              <select
                value={formData.cut_id || ''}
                onChange={(e) => handleInputChange('cut_id', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading || cuts.length === 0}
              >
                <option value="">בחר נתח</option>
                {Array.isArray(cuts) ? cuts.map(cut => (
                  <option key={cut.id} value={cut.id}>{cut.hebrew_name}</option>
                )) : null}
              </select>
              {loading && <div className="text-xs text-gray-500 mt-1">טוען נתחים...</div>}
            </div>
            
            {/* תת-נתח */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">תת-נתח</label>
              <select
                value={formData.product_subtype_id || ''}
                onChange={(e) => handleInputChange('product_subtype_id', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!formData.cut_id || subtypes.length === 0}
              >
                <option value="">בחר תת-נתח</option>
                {Array.isArray(subtypes) ? subtypes.map(subtype => (
                  <option key={subtype.id} value={subtype.id}>{subtype.hebrew_description}</option>
                )) : null}
              </select>
            </div>
            
            {/* רמת כשרות */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">רמת כשרות</label>
              <select
                value={formData.kosher_level}
                onChange={(e) => handleInputChange('kosher_level', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.isArray(kosherLevels) ? kosherLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                )) : null}
              </select>
            </div>
            
            {/* יחידת מידה */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                יחידת מידה <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.unit_of_measure}
                onChange={(e) => handleInputChange('unit_of_measure', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {Array.isArray(unitsOfMeasure) ? unitsOfMeasure.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                )) : null}
              </select>
            </div>
            
            {/* ארץ מקור */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ארץ מקור</label>
              <input
                type="text"
                value={formData.origin_country}
                onChange={(e) => handleInputChange('origin_country', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="למשל: ישראל, אוסטרליה"
              />
            </div>
            
            {/* משקל ברירת מחדל */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">משקל ברירת מחדל (גרם)</label>
              <input
                type="number"
                value={formData.default_weight_per_unit_grams || ''}
                onChange={(e) => handleInputChange('default_weight_per_unit_grams', e.target.value ? parseFloat(e.target.value) : null)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="משקל ליחידה בגרמים"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          
          {/* תיאור */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תיאור המוצר</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="תיאור מפורט של המוצר, אופן הכנה, מאפיינים מיוחדים..."
            />
          </div>
          
          {/* כפתורי פעולה */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  שומר...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  שמור שינויים
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 bg-gray-600 text-white py-3 px-4 rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductModal;