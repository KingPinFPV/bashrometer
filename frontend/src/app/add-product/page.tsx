'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import StepIndicator from '@/components/StepIndicator';
import LoadingSpinner from '@/components/LoadingSpinner';
import CutSelector from '@/components/CutSelector';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
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
  
  const [currentStep, setCurrentStep] = useState('basic');
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [cuts, setCuts] = useState<Cut[]>([]);
  const [subtypes, setSubtypes] = useState<Subtype[]>([]);
  
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    name: '',
    brand: '',
    category: '',
    description: '',
    
    // Step 2: Classification
    cut_id: '',
    product_subtype_id: '',
    quality_grade: '',
    processing_state: '',
    
    // Step 3: Details
    has_bone: '',
    kosher_level: '',
    origin_country: '',
  });

  const steps = [
    { id: 'basic', title: 'מידע בסיסי', description: 'שם, מותג ותיאור' },
    { id: 'classification', title: 'סיווג', description: 'נתח וסוג' },
    { id: 'details', title: 'פרטים נוספים', description: 'כשרות ומקור' },
    { id: 'review', title: 'סיכום', description: 'בדיקה אחרונה' }
  ];

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
          setCuts(allCuts);
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
        setSubtypes([]);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/products/subtypes/${formData.cut_id}`);
        if (response.ok) {
          const data = await response.json();
          setSubtypes(data.data || []);
        }
      } catch (error) {
        console.error('Error loading subtypes:', error);
      }
    };

    loadSubtypes();
  }, [formData.cut_id]);

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (stepId: string): boolean => {
    switch (stepId) {
      case 'basic':
        return !!(formData.name && formData.category);
      case 'classification':
        return !!(formData.cut_id);
      case 'details':
        return true; // Optional step
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex < steps.length - 1) {
      if (validateStep(currentStep) && !completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep]);
      }
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const prevStep = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  const submitProduct = async () => {
    if (!token) {
      alert('עליך להתחבר כדי להוסיף מוצר');
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/products/create-by-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          category: getCategoryHebrew(formData.category), // Convert English to Hebrew for API
          cut_id: parseInt(formData.cut_id),
          product_subtype_id: formData.product_subtype_id ? parseInt(formData.product_subtype_id) : null,
          has_bone: formData.has_bone === 'true' ? true : formData.has_bone === 'false' ? false : null
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert('המוצר נשלח לאישור! תקבל הודעה כשהוא יאושר.');
        router.push('/products');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'שגיאה בשליחת המוצר');
      }
    } catch (error) {
      console.error('Error submitting product:', error);
      alert('שגיאה בשליחת המוצר');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <div className="space-y-6">
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
                onChange={(e) => updateFormData('category', e.target.value)}
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
          </div>
        );

      case 'classification':
        const filteredCuts = cuts.filter(cut => 
          !formData.category || cut.category === formData.category
        );

        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                נתח *
              </label>
              <CutSelector
                selectedCut={cuts.find(cut => cut.id === parseInt(formData.cut_id)) || null}
                onCutSelect={(cut) => {
                  updateFormData('cut_id', cut ? cut.id.toString() : '');
                  if (cut && cut.id !== parseInt(formData.cut_id)) {
                    // Clear subtype when cut changes
                    updateFormData('product_subtype_id', '');
                    loadSubtypes(cut.id);
                  }
                }}
                category={formData.category}
                required
              />
            </div>

            {subtypes.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  תת-סוג
                </label>
                <select
                  value={formData.product_subtype_id}
                  onChange={(e) => updateFormData('product_subtype_id', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">בחר תת-סוג (אופציונלי)</option>
                  {subtypes.map(subtype => (
                    <option key={subtype.id} value={subtype.id}>
                      {subtype.hebrew_description}
                    </option>
                  ))}
                </select>
              </div>
            )}

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
                <option value="premium">פרימיום</option>
                <option value="standard">סטנדרט</option>
                <option value="economy">חסכונית</option>
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
                <option value="fresh">טרי</option>
                <option value="frozen">קפוא</option>
                <option value="marinated">במרינדה</option>
                <option value="smoked">מעושן</option>
              </select>
            </div>
          </div>
        );

      case 'details':
        return (
          <div className="space-y-6">
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
                <option value="kosher">כשר</option>
                <option value="mehadrin">מהדרין</option>
                <option value="not_kosher">לא כשר</option>
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
        );

      case 'review':
        const selectedCut = cuts.find(c => c.id === parseInt(formData.cut_id));
        const selectedSubtype = subtypes.find(s => s.id === parseInt(formData.product_subtype_id));

        return (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">סיכום המוצר</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-700">שם המוצר:</span>
                  <p className="text-gray-900">{formData.name}</p>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">קטגוריה:</span>
                  <p className="text-gray-900">{formData.category}</p>
                </div>
                
                {formData.brand && (
                  <div>
                    <span className="font-medium text-gray-700">מותג:</span>
                    <p className="text-gray-900">{formData.brand}</p>
                  </div>
                )}
                
                <div>
                  <span className="font-medium text-gray-700">נתח:</span>
                  <p className="text-gray-900">{selectedCut?.hebrew_name}</p>
                </div>
                
                {selectedSubtype && (
                  <div>
                    <span className="font-medium text-gray-700">תת-סוג:</span>
                    <p className="text-gray-900">{selectedSubtype.hebrew_description}</p>
                  </div>
                )}
                
                {formData.quality_grade && (
                  <div>
                    <span className="font-medium text-gray-700">דרגת איכות:</span>
                    <p className="text-gray-900">{formData.quality_grade}</p>
                  </div>
                )}
                
                {formData.kosher_level && (
                  <div>
                    <span className="font-medium text-gray-700">כשרות:</span>
                    <p className="text-gray-900">{formData.kosher_level}</p>
                  </div>
                )}
              </div>
              
              {formData.description && (
                <div className="mt-4">
                  <span className="font-medium text-gray-700">תיאור:</span>
                  <p className="text-gray-900">{formData.description}</p>
                </div>
              )}
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                <strong>שים לב:</strong> המוצר יישלח לאישור מנהל המערכת. תקבל הודעה כשהוא יאושר ויהיה זמין במערכת.
              </p>
            </div>
          </div>
        );

      default:
        return null;
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

        <StepIndicator
          steps={steps}
          currentStep={currentStep}
          completedSteps={completedSteps}
          className="mb-8"
        />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {renderStepContent()}

          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={prevStep}
              disabled={currentStep === 'basic'}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4 ml-1" />
              חזור
            </button>

            <div className="flex space-x-3 space-x-reverse">
              {currentStep === 'review' ? (
                <button
                  onClick={submitProduct}
                  disabled={loading}
                  className="flex items-center px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" className="ml-2" />
                  ) : (
                    <Check className="w-4 h-4 ml-2" />
                  )}
                  שלח לאישור
                </button>
              ) : (
                <button
                  onClick={nextStep}
                  disabled={!validateStep(currentStep)}
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  המשך
                  <ChevronLeft className="w-4 h-4 mr-1" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}