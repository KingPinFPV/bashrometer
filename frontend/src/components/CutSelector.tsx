'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

import React, { useState, useEffect } from 'react';
import { authenticatedApiCall } from '@/config/api';
import { Plus, Check, X } from 'lucide-react';

interface Cut {
  id: number;
  name: string;
  category: string;
  hebrew_name?: string;
  description?: string;
}

interface CutSelectorProps {
  value?: number | null;
  onChange: (cutId: number | null) => void;
  category?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
}

const CutSelector: React.FC<CutSelectorProps> = ({ 
  value, 
  onChange, 
  category, 
  className = '',
  disabled = false,
  required = false,
  placeholder = 'בחר נתח'
}) => {
  const [cuts, setCuts] = useState<Cut[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newCutName, setNewCutName] = useState('');
  const [newCutHebrewName, setNewCutHebrewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchCuts();
  }, [category]);
  
  const fetchCuts = async () => {
    if (!category) {
      setCuts([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const url = `/api/cuts?category=${encodeURIComponent(category)}&limit=100`;
      const data = await authenticatedApiCall(url);
      console.log('🔪 Cuts API response:', data); // Debug log
      
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
        console.warn('⚠️ Unexpected cuts API response format:', data);
        cutsArray = [];
      }
      
      console.log('🔍 CutSelector - Found cuts for category:', category, cutsArray.length);
      setCuts(cutsArray);
    } catch (error) {
      console.error('Error fetching cuts:', error);
      setError('שגיאה בטעינת רשימת הנתחים');
      setCuts([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddNewCut = async () => {
    if (!newCutName.trim()) {
      setError('שם הנתח נדרש');
      return;
    }
    
    if (!category) {
      setError('יש לבחור קטגוריה לפני הוספת נתח חדש');
      return;
    }
    
    setAdding(true);
    setError(null);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cuts`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          name: newCutName.trim(),
          category: category,
          hebrew_name: newCutHebrewName.trim() || newCutName.trim(),
          description: `נתח ${newCutHebrewName || newCutName} בקטגוריית ${category}`
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'שגיאה בהוספת הנתח');
      }
      
      const result = await response.json();
      const newCut = result.cut || result;
      
      // Add to cuts list and select it
      const updatedCuts = [...cuts, newCut];
      setCuts(updatedCuts);
      onChange(newCut.id);
      
      // Reset form
      setNewCutName('');
      setNewCutHebrewName('');
      setShowAddNew(false);
      
    } catch (error) {
      console.error('Error creating cut:', error);
      setError(error instanceof Error ? error.message : 'שגיאה בהוספת הנתח');
    } finally {
      setAdding(false);
    }
  };
  
  const handleCutChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cutId = e.target.value ? parseInt(e.target.value) : null;
    onChange(cutId);
  };
  
  const handleCancelAdd = () => {
    setShowAddNew(false);
    setNewCutName('');
    setNewCutHebrewName('');
    setError(null);
  };
  
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }
  
  return (
    <div className={`space-y-3 ${className}`}>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      
      <div className="relative">
        <select 
          value={value || ''}
          onChange={handleCutChange}
          disabled={disabled || !category}
          required={required}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            disabled || !category ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
          }`}
        >
          <option value="">{placeholder}{required ? ' *' : ''}</option>
          {Array.isArray(cuts) ? cuts.map(cut => (
            <option key={cut.id} value={cut.id}>
              {cut.hebrew_name || cut.name}
              {cut.description && ` - ${cut.description}`}
            </option>
          )) : null}
        </select>
      </div>
      
      {!disabled && (
        <>
          {!showAddNew ? (
            <button 
              type="button"
              onClick={() => setShowAddNew(true)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
              disabled={!category}
            >
              <Plus className="w-4 h-4" />
              הוסף נתח חדש
              {!category && (
                <span className="text-gray-500 text-xs">(יש לבחור קטגוריה)</span>
              )}
            </button>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 space-y-3">
              <h4 className="font-medium text-gray-900">הוספת נתח חדש</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  שם הנתח באנגלית *
                </label>
                <input
                  type="text"
                  value={newCutName}
                  onChange={(e) => setNewCutName(e.target.value)}
                  placeholder="למשל: beef_ribeye"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={adding}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  שם הנתח בעברית
                </label>
                <input
                  type="text"
                  value={newCutHebrewName}
                  onChange={(e) => setNewCutHebrewName(e.target.value)}
                  placeholder="למשל: אנטריקוט"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={adding}
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddNewCut}
                  disabled={adding || !newCutName.trim()}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                >
                  {adding ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      שומר...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      שמור
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={handleCancelAdd}
                  disabled={adding}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                >
                  <X className="w-4 h-4" />
                  ביטול
                </button>
              </div>
            </div>
          )}
        </>
      )}
      
      {!category && (
        <div className="text-gray-500 text-xs mt-1">
          יש לבחור קטגוריה או סוג בעל חיים תחילה
        </div>
      )}
      
      {category && cuts.length === 0 && !loading && (
        <div className="text-gray-500 text-xs mt-1">
          לא נמצאו נתחים עבור קטגוריה זו
        </div>
      )}
    </div>
  );
};

export default CutSelector;