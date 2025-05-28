// src/app/admin/products/new/page.tsx
"use client";

import React, { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Autocomplete from '@/components/Autocomplete';

// ממשק לנתוני הטופס של מוצר חדש
interface ProductFormData {
  name: string;
  brand?: string | null;
  category?: string | null;
  unit_of_measure: string;
  description?: string | null;
  short_description?: string | null;
  origin_country?: string | null;
  kosher_level?: string | null;
  animal_type?: string | null;
  cut_type?: string | null;
  default_weight_per_unit_grams?: number | null;
  image_url?: string | null;
  is_active?: boolean;
}

// ממשק לתשובת ה-API לאחר יצירת מוצר מוצלחת
// הוא אמור להכיל את המוצר שנוצר, כולל ה-ID שלו
interface CreatedProductResponse extends ProductFormData {
  id: number;
  created_at?: string; // ושדות נוספים שהשרת מחזיר
  updated_at?: string;
}


export default function CreateProductPage() {
  const { token, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    brand: '',
    category: '',
    unit_of_measure: 'kg', 
    description: '',
    short_description: '',
    origin_country: '',
    kosher_level: 'לא ידוע', 
    animal_type: '',
    cut_type: '',
    default_weight_per_unit_grams: null,
    image_url: '',
    is_active: true, 
  });

  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [, setCategories] = useState<string[]>([]);

  // Fix hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch categories for autocomplete
  useEffect(() => {
    if (mounted && token) {
      fetchCategories();
    }
  }, [mounted, token]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

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
    if (!formData.name.trim()) {
      return "שם המוצר הוא שדה חובה";
    }
    if (formData.name.trim().length < 2) {
      return "שם המוצר חייב להכיל לפחות 2 תווים";
    }
    if (!formData.unit_of_measure.trim()) {
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

    setIsLoading(true);
    setMessage('');
    
    // Prepare data for API
    const cleanedData = {
      ...formData,
      name: formData.name.trim(),
      brand: formData.brand?.trim() || null,
      category: formData.category?.trim() || null,
      description: formData.description?.trim() || null,
      short_description: formData.short_description?.trim() || null,
      origin_country: formData.origin_country?.trim() || null,
      animal_type: formData.animal_type?.trim() || null,
      cut_type: formData.cut_type?.trim() || null,
      image_url: formData.image_url?.trim() || null,
    };

    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/products`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(cleanedData),
      });

      const responseData: CreatedProductResponse | { error: string } = await response.json();

      if (response.ok && 'id' in responseData) {
        setMessage(`מוצר "${responseData.name}" נוצר בהצלחה! מעביר לרשימת מוצרים...`);
        setTimeout(() => {
          router.push('/admin/products'); 
        }, 1500);
      } else {
        setMessage((responseData as { error: string }).error || 'אירעה שגיאה ביצירת המוצר.');
      }
    } catch (error: unknown) {
      console.error("Failed to create product:", error);
      setMessage(`שגיאת רשת ביצירת המוצר: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const kosherLevels = ['לא ידוע', 'רגיל', 'מהדרין', 'גלאט', 'ללא', 'אחר'];
  const unitsOfMeasure = ['100g', 'kg', 'g', 'unit', 'package'];

  // Show loading during hydration
  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">טוען טופס הוספת מוצר...</p>
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

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* ... JSX של הטופס ... */}
       <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-slate-800">הוספת מוצר חדש</h1>
            <Link href="/admin/products" className="text-sky-600 hover:text-sky-700">
              &larr; חזרה לרשימת המוצרים
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-lg shadow-md space-y-6">
            {/* שם מוצר (שדה חובה) */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                שם המוצר <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              />
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
            
            {/* יחידת מידה (שדה חובה) */}
            <div>
              <label htmlFor="unit_of_measure" className="block text-sm font-medium text-slate-700">
                יחידת מידה <span className="text-red-500">*</span>
              </label>
              <select name="unit_of_measure" id="unit_of_measure" value={formData.unit_of_measure} onChange={handleChange} required
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

            {/* פרטים נוספים (בגריד לנוחות) */}
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
                <label htmlFor="animal_type" className="block text-sm font-medium text-slate-700">סוג חיה</label>
                <input type="text" name="animal_type" id="animal_type" value={formData.animal_type || ''} onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
              </div>
              <div>
                <label htmlFor="cut_type" className="block text-sm font-medium text-slate-700">סוג נתח</label>
                <Autocomplete
                  placeholder="חפש נתח..."
                  value={formData.cut_type || ''}
                  onChange={(value) => setFormData(prev => ({ ...prev, cut_type: value }))}
                  endpoint="meat-cuts"
                  category={formData.animal_type || undefined}
                  name="cut_type"
                  id="cut_type"
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
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50"
              >
                {isLoading ? 'יוצר מוצר...' : 'הוסף מוצר'}
              </button>
            </div>
          </form>
        </div>
      </ErrorBoundary>
    );
}