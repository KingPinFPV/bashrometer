'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import CutSelector from '@/components/CutSelector';
import SubtypeSelector from '@/components/SubtypeSelector';
import { getCategoryHebrew, getCategoryOptions } from '@/constants/categories';

interface Cut {
  id: number;
  name: string;
  hebrew_name: string;
  category: string;
}

interface Subtype {
  id: number;
  name: string;
  hebrew_description: string;
  purpose?: string;
}

export default function AddProductPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  // const [cuts, setCuts] = useState<Cut[]>([]);
  // const [subtypes, setSubtypes] = useState<Subtype[]>([]);
  const [message, setMessage] = useState('');
  
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    brand: '',
    category: '',
    description: '',
    
    // Classification
    cut_id: '',
    product_subtype_id: '',
    quality_grade: '',
    processing_state: '',
    
    // Details
    has_bone: '',
    kosher_level: '',
    origin_country: '',
    default_weight_per_unit_grams: '',
    image_url: '',
  });

  // Load cuts data
  useEffect(() => {
    const loadCuts = async () => {
      try {
        const response = await fetch(`${API_URL}/api/products/cuts`);
        if (response.ok) {
          const data = await response.json();
          const allCuts: Cut[] = [];
          Object.values(data.data as Record<string, Cut[]>).forEach(categoryArr => {
            allCuts.push(...categoryArr);
          });
          // setCuts(allCuts);
        }
      } catch (error) {
        console.error('Error loading cuts:', error);
      }
    };

    loadCuts();
  }, []);

  // Load subtypes when cut is selected
  useEffect(() => {
    const loadSubtypes = async () => {
      if (!formData.cut_id) {
        // setSubtypes([]);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/products/subtypes/${formData.cut_id}`);
        if (response.ok) {
          // const data = await response.json();
          // setSubtypes(data.data || []);
        }
      } catch (error) {
        console.error('Error loading subtypes:', error);
        // setSubtypes([]);
      }
    };

    loadSubtypes();
  }, [formData.cut_id]);

  const updateFormData = (field: string, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return 'שם המוצר הוא שדה חובה';
    }
    if (!formData.category) {
      return 'קטגוריה היא שדה חובה';
    }
    if (!formData.cut_id) {
      return 'נתח הוא שדה חובה';
    }
    return null;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      brand: '',
      category: '',
      description: '',
      cut_id: '',
      product_subtype_id: '',
      quality_grade: '',
      processing_state: '',
      has_bone: '',
      kosher_level: '',
      origin_country: '',
      default_weight_per_unit_grams: '',
      image_url: '',
    });
    setMessage('');
  };

  const submitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setMessage('עליך להתחבר כדי להוסיף מוצר');
      router.push('/login');
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setMessage(validationError);
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch(`${API_URL}/api/products/create-by-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          brand: formData.brand.trim() || null,
          category: getCategoryHebrew(formData.category), // Convert English to Hebrew for API
          description: formData.description.trim() || null,
          cut_id: parseInt(formData.cut_id),
          product_subtype_id: formData.product_subtype_id ? parseInt(formData.product_subtype_id) : null,
          quality_grade: formData.quality_grade || null,
          processing_state: formData.processing_state || null,
          has_bone: formData.has_bone === 'true' ? true : formData.has_bone === 'false' ? false : null,
          kosher_level: formData.kosher_level || null,
          origin_country: formData.origin_country.trim() || null,
          default_weight_per_unit_grams: formData.default_weight_per_unit_grams ? parseInt(formData.default_weight_per_unit_grams) : null,
          image_url: formData.image_url.trim() || null,
        })
      });

      if (response.ok) {
        // const data = await response.json();
        setMessage('המוצר נשלח לאישור בהצלחה! תקבל הודעה כשהוא יאושר.');
        resetForm();
        setTimeout(() => {
          router.push('/products');
        }, 2000);
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || 'שגיאה בשליחת המוצר');
      }
    } catch (error) {
      console.error('Error submitting product:', error);
      setMessage('שגיאה בשליחת המוצר');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">עליך להתחבר כדי להוסיף מוצר</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            התחבר
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">הוסף מוצר חדש</h1>
          <p className="text-gray-600 mt-2">הוסף מוצר בשר חדש למאגר המערכת</p>
        </div>

        <form onSubmit={submitProduct} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-8">
          {/* Basic Information Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              מידע בסיסי
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  שם המוצר *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  placeholder="לדוגמה: אנטריקוט בקר"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  קטגוריה *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => {
                    updateFormData('category', e.target.value);
                    // Reset cut and subtype when category changes
                    updateFormData('cut_id', '');
                    updateFormData('product_subtype_id', '');
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">בחר קטגוריה</option>
                  {getCategoryOptions().map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  מותג
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => updateFormData('brand', e.target.value)}
                  placeholder="שם המותג (אופציונלי)"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  משקל ברירת מחדל (גרם)
                </label>
                <input
                  type="number"
                  value={formData.default_weight_per_unit_grams}
                  onChange={(e) => updateFormData('default_weight_per_unit_grams', e.target.value)}
                  placeholder="למשל: 500"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                תיאור
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder="תיאור קצר של המוצר (אופציונלי)"
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                כתובת תמונה (URL)
              </label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => updateFormData('image_url', e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Classification Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              סיווג המוצר
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  נתח *
                </label>
                <CutSelector
                  value={formData.cut_id ? parseInt(formData.cut_id) : null}
                  onChange={(cutId) => {
                    updateFormData('cut_id', cutId ? cutId.toString() : '');
                    if (cutId !== parseInt(formData.cut_id)) {
                      // Clear subtype when cut changes
                      updateFormData('product_subtype_id', '');
                    }
                  }}
                  category={formData.category}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  תת-נתח
                </label>
                <SubtypeSelector
                  cutId={formData.cut_id ? parseInt(formData.cut_id) : null}
                  value={formData.product_subtype_id ? parseInt(formData.product_subtype_id) : null}
                  onChange={(subtypeId) => updateFormData('product_subtype_id', subtypeId ? subtypeId.toString() : '')}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  דרגת איכות
                </label>
                <select
                  value={formData.quality_grade}
                  onChange={(e) => updateFormData('quality_grade', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">בחר דרגת איכות</option>
                  <option value="פרימיום">פרימיום</option>
                  <option value="צ'ויס">צ&apos;ויס</option>
                  <option value="סלקט">סלקט</option>
                  <option value="סטנדרט">סטנדרט</option>
                  <option value="אחר">אחר</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  מצב עיבוד
                </label>
                <select
                  value={formData.processing_state}
                  onChange={(e) => updateFormData('processing_state', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">בחר מצב עיבוד</option>
                  <option value="טרי">טרי</option>
                  <option value="קפוא">קפוא</option>
                  <option value="מתובל">מתובל</option>
                  <option value="מעושן">מעושן</option>
                  <option value="מבושל">מבושל</option>
                  <option value="אחר">אחר</option>
                </select>
              </div>
            </div>
          </div>

          {/* Additional Details Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
              פרטים נוספים
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  יש עצם?
                </label>
                <div className="flex space-x-4 space-x-reverse">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="has_bone"
                      value="true"
                      checked={formData.has_bone === 'true'}
                      onChange={(e) => updateFormData('has_bone', e.target.value)}
                      className="ml-2"
                    />
                    כן, עם עצם
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="has_bone"
                      value="false"
                      checked={formData.has_bone === 'false'}
                      onChange={(e) => updateFormData('has_bone', e.target.value)}
                      className="ml-2"
                    />
                    לא, ללא עצם
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  רמת כשרות
                </label>
                <select
                  value={formData.kosher_level}
                  onChange={(e) => updateFormData('kosher_level', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">בחר רמת כשרות</option>
                  <option value="רגיל">רגיל</option>
                  <option value="מהדרין">מהדרין</option>
                  <option value="גלאט">גלאט</option>
                  <option value="ללא">ללא</option>
                  <option value="אחר">אחר</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ארץ מקור
                </label>
                <input
                  type="text"
                  value={formData.origin_country}
                  onChange={(e) => updateFormData('origin_country', e.target.value)}
                  placeholder="למשל: ישראל, אוסטרליה"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`p-4 rounded-md ${message.includes('בהצלחה') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {message}
            </div>
          )}

          {/* Submit Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm">
                <strong>שים לב:</strong> המוצר יישלח לאישור מנהל המערכת. תקבל הודעה כשהוא יאושר ויהיה זמין במערכת.
              </p>
            </div>

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => router.push('/products')}
                className="px-6 py-2 text-gray-600 hover:text-gray-800"
              >
                ביטול
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="ml-2" />
                    שולח...
                  </>
                ) : (
                  'שלח לאישור'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}