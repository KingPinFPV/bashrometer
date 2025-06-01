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
  productId: number | null;  // Changed from product object to product ID
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: any) => void;
}

const EditProductModal: React.FC<EditProductModalProps> = ({ 
  productId, isOpen, onClose, onSave 
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
    default_weight_per_unit_grams: null as number | null,
    short_description: '',
    image_url: '',
    processing_state: '',
    has_bone: false,
    quality_grade: '',
    is_active: true
  });
  
  const [cuts, setCuts] = useState<Cut[]>([]);
  const [subtypes, setSubtypes] = useState<ProductSubtype[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productData, setProductData] = useState<any>(null);
  const [submissionInfo, setSubmissionInfo] = useState<any>(null);
  
  const categories = ['בקר', 'עוף', 'כבש', 'טלה', 'הודו', 'ברווז', 'אווז', 'עגל', 'עז', 'ארנב', 'איברים'];
  const kosherLevels = ['לא ידוע', 'רגיל', 'מהדרין', 'גלאט', 'ללא', 'אחר'];
  const unitsOfMeasure = ['100g', 'kg', 'g', 'unit', 'package'];
  
  // Load product data when modal opens with productId
  useEffect(() => {
    if (productId && isOpen) {
      loadProductData(productId);
    }
  }, [productId, isOpen]);

  const loadProductData = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📝 Loading product data for editing, ID:', id);
      
      const data = await authenticatedApiCall(`/api/admin/products/${id}`);
      console.log('✅ Product data loaded:', data);
      
      if (data.success && data.data) {
        const product = data.data;
        setProductData(product);
        
        // Set submission info for admin context
        setSubmissionInfo({
          submittedBy: product.created_by_name || 'לא ידוע',
          submittedEmail: product.created_by_email || '',
          submittedAt: product.created_at ? new Date(product.created_at).toLocaleDateString('he-IL') : '',
          currentStatus: product.status || 'לא ידוע',
          approvedBy: product.approved_by_name || null,
          approvedAt: product.approved_at ? new Date(product.approved_at).toLocaleDateString('he-IL') : null,
          priceStats: product.price_statistics || {}
        });
        
        // Pre-populate ALL form fields
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
          default_weight_per_unit_grams: product.default_weight_per_unit_grams || null,
          short_description: product.short_description || '',
          image_url: product.image_url || '',
          processing_state: product.processing_state || '',
          has_bone: product.has_bone || false,
          quality_grade: product.quality_grade || '',
          is_active: product.is_active !== undefined ? product.is_active : true
        });
        
        // Load cuts for the product's category
        if (product.category || product.animal_type) {
          loadCutsForCategory(product.category || product.animal_type);
        }
        
        // Load subtypes for the product's cut
        if (product.cut_id) {
          loadSubtypesForCut(product.cut_id);
        }
        
      } else {
        setError(data.error || 'שגיאה בטעינת נתוני המוצר');
      }
    } catch (error: any) {
      console.error('🚨 Error loading product data:', error);
      setError('שגיאה בטעינת נתוני המוצר: ' + (error.message || 'שגיאה לא ידועה'));
    } finally {
      setLoading(false);
    }
  };
  
  // טען נתחים כשהקטגוריה משתנה (רק אם לא טוענים נתונים ראשוניים)
  useEffect(() => {
    if ((formData.category || formData.animal_type) && !loading) {
      loadCutsForCategory(formData.category || formData.animal_type);
    }
  }, [formData.category, formData.animal_type]);
  
  // טען תת-נתחים כשהנתח משתנה (רק אם לא טוענים נתונים ראשוניים)
  useEffect(() => {
    if (formData.cut_id && !loading) {
      loadSubtypesForCut(formData.cut_id);
    } else if (!formData.cut_id) {
      setSubtypes([]);
    }
  }, [formData.cut_id]);
  
  const loadCutsForCategory = async (category: string) => {
    try {
      const data = await authenticatedApiCall(`/api/cuts?category=${encodeURIComponent(category)}`);
      console.log('🔍 EditProductModal - Cuts API response for category:', category, data);
      
      let cutsArray = [];
      if (Array.isArray(data)) {
        cutsArray = data;
      } else if (data && Array.isArray(data.cuts)) {
        cutsArray = data.cuts;
      } else if (data && data.data && typeof data.data === 'object') {
        // הAPI מחזיר אובייקט עם קטגוריות - נמצא את הקטגוריה הנכונה
        if (data.data[category] && Array.isArray(data.data[category])) {
          cutsArray = data.data[category];
        } else {
          // אם לא מצאנו את הקטגוריה, נשלב כל הנתחים
          cutsArray = Object.values(data.data).flat();
        }
      } else if (Array.isArray(data.data)) {
        cutsArray = data.data;
      } else {
        console.warn('⚠️ EditProductModal - Unexpected cuts API format:', data);
        cutsArray = [];
      }
      
      console.log('🔍 Found cuts for category:', category, cutsArray.length);
      setCuts(cutsArray);
    } catch (error) {
      console.error('Error loading cuts:', error);
      setError('שגיאה בטעינת נתחים');
    }
  };
  
  const loadSubtypesForCut = async (cutId: number) => {
    try {
      const data = await authenticatedApiCall(`/api/admin/subtypes`);
      console.log('🏷️ EditProductModal - Subtypes API response for cut:', cutId, data);
      
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
      
      const filteredSubtypes = allSubtypes.filter((st: ProductSubtype) => st.cut_id === cutId);
      console.log('🏷️ Found subtypes for cut:', cutId, filteredSubtypes.length);
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
        short_description: formData.short_description?.trim() || null,
        animal_type: formData.animal_type?.trim() || null,
        origin_country: formData.origin_country?.trim() || null,
        image_url: formData.image_url?.trim() || null,
        processing_state: formData.processing_state?.trim() || null,
        quality_grade: formData.quality_grade?.trim() || null
      };
      
      await onSave({ ...productData, ...cleanedData });
      onClose();
    } catch (error: any) {
      console.error('🚨 Error saving product:', error);
      
      // Handle detailed error messages from the API
      if (error.response?.data?.details) {
        setError(`שגיאה: ${error.response.data.details}`);
      } else if (error.response?.data?.error) {
        setError(`שגיאה: ${error.response.data.error}`);
      } else if (error.message) {
        setError(`שגיאה: ${error.message}`);
      } else {
        setError('שגיאה בשמירת המוצר');
      }
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
        
        {loading ? (
          <div className="p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">טוען נתוני המוצר...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
                <span className="text-red-700">{error}</span>
              </div>
            )}
            
            {/* הקשר הגשה למנהל */}
            {submissionInfo && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                <h3 className="text-sm font-medium text-blue-900 mb-2">פרטי הגשה</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-800">
                  <div>
                    <span className="font-medium">נשלח על ידי:</span> {submissionInfo.submittedBy}
                  </div>
                  <div>
                    <span className="font-medium">תאריך הגשה:</span> {submissionInfo.submittedAt}
                  </div>
                  <div>
                    <span className="font-medium">סטטוס נוכחי:</span> {submissionInfo.currentStatus}
                  </div>
                  {submissionInfo.approvedBy && (
                    <div>
                      <span className="font-medium">אושר על ידי:</span> {submissionInfo.approvedBy}
                    </div>
                  )}
                  {submissionInfo.priceStats && (
                    <div className="md:col-span-2">
                      <span className="font-medium">סטטיסטיקות מחיר:</span> 
                      {submissionInfo.priceStats.total_prices} דיווחים, 
                      {submissionInfo.priceStats.retailer_count} קמעונאים
                    </div>
                  )}
                </div>
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
            
            {/* מצב עיבוד */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">מצב עיבוד</label>
              <select
                value={formData.processing_state}
                onChange={(e) => handleInputChange('processing_state', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">בחר מצב עיבוד</option>
                <option value="fresh">טרי</option>
                <option value="frozen">קפוא</option>
                <option value="aged">מיושן</option>
                <option value="marinated">מתובל</option>
              </select>
            </div>
            
            {/* דרגת איכות */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">דרגת איכות</label>
              <select
                value={formData.quality_grade}
                onChange={(e) => handleInputChange('quality_grade', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">בחר דרגת איכות</option>
                <option value="standard">רגיל</option>
                <option value="premium">פרמיום</option>
                <option value="choice">בחירה</option>
                <option value="prime">מעולה</option>
              </select>
            </div>
            
            {/* עם עצם */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.has_bone}
                  onChange={(e) => handleInputChange('has_bone', e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="mr-2 text-sm font-medium text-gray-700">עם עצם</span>
              </label>
            </div>
          </div>
          
          {/* תיאור קצר */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תיאור קצר</label>
            <input
              type="text"
              value={formData.short_description}
              onChange={(e) => handleInputChange('short_description', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="תיאור קצר למוצר"
              maxLength={255}
            />
          </div>
          
          {/* תיאור מפורט */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תיאור מפורט</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="תיאור מפורט של המוצר, אופן הכנה, מאפיינים מיוחדים..."
            />
          </div>
          
          {/* כתובת תמונה */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">כתובת תמונה</label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => handleInputChange('image_url', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/image.jpg"
            />
          </div>
          
          {/* מוצר פעיל */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="mr-2 text-sm font-medium text-gray-700">מוצר פעיל</span>
            </label>
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
        )}
      </div>
    </div>
  );
};

export default EditProductModal;