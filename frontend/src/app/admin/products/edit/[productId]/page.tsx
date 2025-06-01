// src/app/admin/products/edit/[productId]/page.tsx
"use client";

import React, { useState, useEffect, FormEvent, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Autocomplete from '@/components/Autocomplete';
import CutSelector from '@/components/CutSelector';
import SubtypeSelector from '@/components/SubtypeSelector';

// ממשק לנתוני המוצר עם כל השדות החדשים
interface ProductFormData {
  name: string;
  brand?: string | null;
  category?: string | null;
  unit_of_measure: string;
  description?: string | null;
  short_description?: string | null;
  origin_country?: string | null;
  kosher_level?: string | null;
  cut_id?: number | null;
  product_subtype_id?: number | null;
  processing_state?: string | null;
  has_bone?: boolean;
  quality_grade?: string | null;
  default_weight_per_unit_grams?: number | null;
  image_url?: string | null;
  is_active?: boolean;
}

// ממשק למוצר כפי שהוא מגיע מה-API (יכול לכלול גם id, created_at, updated_at)
interface Product extends ProductFormData {
  id: number;
  created_at?: string;
  updated_at?: string;
}


export default function EditProductPage() {
  const { token, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const productId = params.productId as string;
  const [mounted, setMounted] = useState(false);

  const [formData, setFormData] = useState<Partial<ProductFormData>>({}); // Partial כי נטען אסינכרונית
  const [originalProduct, setOriginalProduct] = useState<Product | null>(null);
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true); // טעינה ראשונית של המוצר
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // בזמן שליחת הטופס

  // Fix hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchProductToEdit = useCallback(async () => {
    if (!productId || !token || (user && user.role !== 'admin')) {
      if (user && user.role !== 'admin') setMessage("אין לך הרשאה לערוך מוצרים.");
      else if (!token) setMessage("אנא התחבר כדי לערוך מוצר.");
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setMessage('');
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/products/${productId}`;

    try {
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to parse product data" }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      const productData = result.success ? result.data : result;
      
      console.log('📊 Loaded product data for editing:', productData);
      
      setOriginalProduct(productData);
      // אכלוס הטופס עם הנתונים הקיימים
      setFormData({
        name: productData.name || '',
        brand: productData.brand || '',
        category: productData.category || '',
        unit_of_measure: productData.unit_of_measure || 'kg',
        description: productData.description || '',
        short_description: productData.short_description || '',
        origin_country: productData.origin_country || '',
        kosher_level: productData.kosher_level || 'לא ידוע',
        cut_id: productData.cut_id || null,
        product_subtype_id: productData.product_subtype_id || null,
        processing_state: productData.processing_state || '',
        has_bone: productData.has_bone || false,
        quality_grade: productData.quality_grade || '',
        default_weight_per_unit_grams: productData.default_weight_per_unit_grams || null,
        image_url: productData.image_url || '',
        is_active: productData.is_active !== undefined ? productData.is_active : true,
      });
    } catch (error: unknown) {
      console.error("Failed to fetch product for editing:", error);
      setMessage(`שגיאה בטעינת המוצר לעריכה: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  }, [productId, token, user]);

  useEffect(() => {
    if (productId && mounted && token) { // טען רק אם יש productId ו-mounted
      fetchProductToEdit();
    }
  }, [productId, mounted, token, fetchProductToEdit]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value === '' ? null : parseFloat(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = (): string | null => {
    if (!formData.name?.trim()) {
      return "שם המוצר הוא שדה חובה";
    }
    if (formData.name.trim().length < 2) {
      return "שם המוצר חייב להכיל לפחות 2 תווים";
    }
    if (!formData.unit_of_measure?.trim()) {
      return "יחידת מידה היא שדה חובה";
    }
    if (formData.default_weight_per_unit_grams && formData.default_weight_per_unit_grams <= 0) {
      return "משקל ברירת המחדל חייב להיות מספר חיובי";
    }
    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Check authentication
    if (!token || (user && user.role !== 'admin')) {
      setMessage("שגיאה: אין לך הרשאה לבצע פעולה זו.");
      return;
    }

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setMessage(`שגיאת validation: ${validationError}`);
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    
    // Prepare cleaned data for API - include ALL fields backend expects
    const cleanedData = {
      id: parseInt(productId),
      name: formData.name?.trim() || '',
      brand: formData.brand?.trim() || null,
      category: formData.category?.trim() || null,
      description: formData.description?.trim() || null,
      short_description: formData.short_description?.trim() || null,
      origin_country: formData.origin_country?.trim() || null,
      cut_id: formData.cut_id || null,
      product_subtype_id: formData.product_subtype_id || null,
      processing_state: formData.processing_state?.trim() || null,
      has_bone: formData.has_bone || false,
      quality_grade: formData.quality_grade?.trim() || null,
      kosher_level: formData.kosher_level || 'לא ידוע',
      unit_of_measure: formData.unit_of_measure || 'kg',
      default_weight_per_unit_grams: formData.default_weight_per_unit_grams || null,
      image_url: formData.image_url?.trim() || null,
      is_active: formData.is_active !== undefined ? formData.is_active : true,
    };
    
    console.log('📤 Sending cleaned product data:', cleanedData);

    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/products/${productId}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(cleanedData),
      });

      const responseData = await response.json();

      if (response.ok) {
        setMessage(`מוצר "${responseData.name}" עודכן בהצלחה! מעביר לרשימת מוצרים...`);
        setOriginalProduct(responseData);
        setTimeout(() => {
          router.push('/admin/products');
        }, 1500);
      } else {
        // Enhanced error handling for 400 Bad Request
        console.error('❌ Product update failed:', {
          status: response.status,
          error: responseData.error,
          details: responseData.details,
          sentData: cleanedData
        });
        
        let errorMessage = 'אירעה שגיאה בעדכון המוצר.';
        if (response.status === 400) {
          if (responseData.details) {
            errorMessage = `שגיאת validation: ${responseData.details}`;
          } else if (responseData.error?.includes('cut_id')) {
            errorMessage = 'שגיאה: נתח לא תקין או לא קיים במערכת';
          } else if (responseData.error?.includes('product_subtype_id')) {
            errorMessage = 'שגיאה: תת-נתח לא תקין או לא שייך לנתח שנבחר';
          } else if (responseData.error?.includes('name')) {
            errorMessage = 'שגיאה: שם המוצר לא יכול להיות ריק';
          } else {
            errorMessage = `שגיאת validation: ${responseData.error}`;
          }
        }
        setMessage(errorMessage);
      }
    } catch (error: unknown) {
      console.error("Failed to update product:", error);
      setMessage(`שגיאת רשת בעדכון המוצר: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // רשימות אפשרויות ל-select
  const kosherLevels = ['לא ידוע', 'רגיל', 'מהדרין', 'גלאט', 'ללא', 'אחר'];
  const unitsOfMeasure = ['100g', 'kg', 'g', 'unit', 'package'];
  const processingStates = ['טרי', 'קפוא', 'מעושן', 'מתובל', 'מבושל', 'אחר'];
  const qualityGrades = ['פרייםֹ', 'צ\'ויס', 'סלקט', 'סטנדרט', 'אחר'];

  // Show loading during hydration
  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">טוען עמוד עריכת מוצר...</p>
          </div>
        </div>
      </div>
    );
  }

  // Check authentication
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">בודק הרשאות...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-center">
            <p className="text-red-800">אין לך הרשאה לגשת לדף זה</p>
            <Link href="/admin" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
              חזרה לדף הניהול
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">טוען פרטי מוצר לעריכה...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!originalProduct && !isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl text-center">
        <div className="bg-red-50 border border-red-200 rounded-md p-6">
          <h1 className="text-2xl font-bold text-red-700 mb-4">שגיאה</h1>
          <p className="text-slate-600 mb-4">{message || "המוצר המבוקש לא נמצא או שאין לך הרשאה לצפות בו."}</p>
          <Link href="/admin/products" className="text-sky-600 hover:text-sky-700">
            ← חזרה לרשימת המוצרים
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">עריכת מוצר: {originalProduct?.name || ''}</h1>
        <Link href="/admin/products" className="text-sky-600 hover:text-sky-700">
          &larr; חזרה לרשימת המוצרים
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-lg shadow-md space-y-6">
        {/* שם מוצר */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700">
            שם המוצר <span className="text-red-500">*</span>
          </label>
          <input type="text" name="name" id="name" value={formData.name || ''} onChange={handleChange} required
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
        </div>

        {/* מותג */}
        <div>
          <label htmlFor="brand" className="block text-sm font-medium text-slate-700">מותג</label>
          <Autocomplete
            placeholder="חפש מותג..."
            value={formData.brand || ''}
            onChange={(value) => setFormData(prev => ({ ...prev, brand: value }))}
            endpoint="brands"
            name="brand"
            id="brand"
            className="mt-1"
          />
        </div>

        {/* קטגוריה */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-slate-700">קטגוריה</label>
          <Autocomplete
            placeholder="חפש קטגוריה..."
            value={formData.category || ''}
            onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            endpoint="categories"
            name="category"
            id="category"
            className="mt-1"
          />
        </div>
        
        {/* יחידת מידה */}
        <div>
          <label htmlFor="unit_of_measure" className="block text-sm font-medium text-slate-700">
            יחידת מידה <span className="text-red-500">*</span>
          </label>
          <select name="unit_of_measure" id="unit_of_measure" value={formData.unit_of_measure || 'kg'} onChange={handleChange} required
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md">
            {unitsOfMeasure.map(unit => <option key={unit} value={unit}>{unit}</option>)}
          </select>
        </div>

        {/* תיאור קצר */}
        <div>
          <label htmlFor="short_description" className="block text-sm font-medium text-slate-700">תיאור קצר</label>
          <textarea name="short_description" id="short_description" value={formData.short_description || ''} onChange={handleChange} rows={2}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
        </div>
        
        {/* תיאור מלא */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700">תיאור מלא</label>
          <textarea name="description" id="description" value={formData.description || ''} onChange={handleChange} rows={4}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
        </div>

        {/* פרטים נוספים (בגריד) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="origin_country" className="block text-sm font-medium text-slate-700">ארץ מקור</label>
            <input type="text" name="origin_country" id="origin_country" value={formData.origin_country || ''} onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="kosher_level" className="block text-sm font-medium text-slate-700">רמת כשרות</label>
            <select name="kosher_level" id="kosher_level" value={formData.kosher_level || 'לא ידוע'} onChange={handleChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md">
              {kosherLevels.map(level => <option key={level} value={level}>{level}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="cut_id" className="block text-sm font-medium text-slate-700">נתח</label>
            <CutSelector
              value={formData.cut_id}
              onChange={(cutId) => setFormData(prev => ({ ...prev, cut_id: cutId, product_subtype_id: null }))}
              category={formData.category}
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="product_subtype_id" className="block text-sm font-medium text-slate-700">תת-נתח</label>
            <SubtypeSelector
              cutId={formData.cut_id}
              value={formData.product_subtype_id}
              onChange={(subtypeId) => setFormData(prev => ({ ...prev, product_subtype_id: subtypeId }))}
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="default_weight_per_unit_grams" className="block text-sm font-medium text-slate-700">משקל ברירת מחדל ליחידה (בגרמים)</label>
            <input type="number" name="default_weight_per_unit_grams" id="default_weight_per_unit_grams" 
                   value={formData.default_weight_per_unit_grams === null || formData.default_weight_per_unit_grams === undefined ? '' : formData.default_weight_per_unit_grams} 
                   onChange={handleChange} step="0.01"
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="image_url" className="block text-sm font-medium text-slate-700">כתובת URL לתמונה</label>
            <input type="url" name="image_url" id="image_url" value={formData.image_url || ''} onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
          </div>
          
          {/* שדות חדשים */}
          <div>
            <label htmlFor="processing_state" className="block text-sm font-medium text-slate-700">מצב עיבוד</label>
            <select name="processing_state" id="processing_state" value={formData.processing_state || ''} onChange={handleChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md">
              <option value="">בחר מצב עיבוד</option>
              {processingStates.map(state => <option key={state} value={state}>{state}</option>)}
            </select>
          </div>
          
          <div>
            <label htmlFor="quality_grade" className="block text-sm font-medium text-slate-700">דרגת איכות</label>
            <select name="quality_grade" id="quality_grade" value={formData.quality_grade || ''} onChange={handleChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md">
              <option value="">בחר דרגת איכות</option>
              {qualityGrades.map(grade => <option key={grade} value={grade}>{grade}</option>)}
            </select>
          </div>
          
        </div>
        
        {/* יש עצם? */}
        <div className="flex items-center">
          <input type="checkbox" name="has_bone" id="has_bone" checked={formData.has_bone || false} onChange={handleChange}
            className="h-4 w-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500" />
          <label htmlFor="has_bone" className="ml-2 block text-sm text-slate-900 rtl:mr-2 rtl:ml-0">יש עצם במוצר</label>
        </div>
        
        {/* מוצר פעיל? */}
        <div className="flex items-center">
          <input type="checkbox" name="is_active" id="is_active" checked={formData.is_active === undefined ? true : formData.is_active} onChange={handleChange}
            className="h-4 w-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500" />
          <label htmlFor="is_active" className="ml-2 block text-sm text-slate-900 rtl:mr-2 rtl:ml-0">מוצר פעיל</label>
        </div>

        {/* הודעות */}
        {message && (
          <p className={`text-sm p-3 rounded-md ${message.includes('בהצלחה') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </p>
        )}

        {/* כפתור שליחה */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || isLoading} // מנע שליחה אם טוען את המוצר או כבר שולח
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50"
          >
            {isSubmitting ? 'מעדכן מוצר...' : 'שמור שינויים'}
          </button>
        </div>
      </form>
        </div>
      </ErrorBoundary>
    );
}