"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

import React, { useState, useEffect } from 'react';
import { authenticatedApiCall } from '@/config/api';
import { Plus, Check, X } from 'lucide-react';

interface ProductSubtype {
  id: number;
  cut_id: number;
  name: string;
  hebrew_description: string;
  purpose?: string;
  typical_price_range_min?: number;
  typical_price_range_max?: number;
}

interface SubtypeSelectorProps {
  cutId?: number | null;
  value?: number | null;
  onChange: (subtypeId: number | null) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
}

const SubtypeSelector: React.FC<SubtypeSelectorProps> = ({ 
  cutId,
  value, 
  onChange, 
  className = '',
  disabled = false,
  required = false,
  placeholder = 'בחר תת-נתח'
}) => {
  const [subtypes, setSubtypes] = useState<ProductSubtype[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newSubtypeName, setNewSubtypeName] = useState('');
  const [newSubtypeHebrewDescription, setNewSubtypeHebrewDescription] = useState('');
  const [newSubtypePurpose, setNewSubtypePurpose] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cutId) {
      fetchSubtypes();
    } else {
      setSubtypes([]);
    }
  }, [cutId]);

  const fetchSubtypes = async () => {
    if (!cutId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await authenticatedApiCall('/api/admin/subtypes');
      console.log('📋 Subtypes API response:', data); // Debug log
      
      let allSubtypes = [];
      if (Array.isArray(data)) {
        allSubtypes = data;
      } else if (data && Array.isArray(data.subtypes)) {
        allSubtypes = data.subtypes;
      } else if (data && Array.isArray(data.data)) {
        allSubtypes = data.data;
      } else {
        console.warn('⚠️ Unexpected subtypes API response format:', data);
        allSubtypes = [];
      }
      
      const filteredSubtypes = allSubtypes.filter((st: ProductSubtype) => st.cut_id === cutId);
      setSubtypes(filteredSubtypes);
    } catch (error) {
      console.error('Error fetching subtypes:', error);
      setError('שגיאה בטעינת תת-נתחים');
      setSubtypes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewSubtype = async () => {
    if (!newSubtypeHebrewDescription.trim()) {
      setError('תיאור בעברית נדרש');
      return;
    }
    
    if (!cutId) {
      setError('יש לבחור נתח לפני הוספת תת-נתח');
      return;
    }
    
    setAdding(true);
    setError(null);
    
    try {
      const data = await authenticatedApiCall('/api/admin/subtypes', {
        method: 'POST',
        body: JSON.stringify({
          cut_id: cutId,
          name: newSubtypeName.trim() || newSubtypeHebrewDescription.trim().replace(/\s+/g, '_').toLowerCase(),
          hebrew_description: newSubtypeHebrewDescription.trim(),
          purpose: newSubtypePurpose.trim() || null
        })
      });
      
      const newSubtype = data.subtype || data;
      
      // Add to subtypes list and select it
      const updatedSubtypes = [...subtypes, newSubtype];
      setSubtypes(updatedSubtypes);
      onChange(newSubtype.id);
      
      // Reset form
      setNewSubtypeName('');
      setNewSubtypeHebrewDescription('');
      setNewSubtypePurpose('');
      setShowAddNew(false);
      
    } catch (error) {
      console.error('Error creating subtype:', error);
      setError(error instanceof Error ? error.message : 'שגיאה בהוספת תת-נתח');
    } finally {
      setAdding(false);
    }
  };

  const handleSubtypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subtypeId = e.target.value ? parseInt(e.target.value) : null;
    onChange(subtypeId);
  };

  const handleCancelAdd = () => {
    setShowAddNew(false);
    setNewSubtypeName('');
    setNewSubtypeHebrewDescription('');
    setNewSubtypePurpose('');
    setError(null);
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-500">טוען תת-נתחים...</span>
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
          onChange={handleSubtypeChange}
          disabled={disabled || !cutId}
          required={required}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            disabled || !cutId ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
          }`}
        >
          <option value="">{placeholder}{required ? ' *' : ''}</option>
          {Array.isArray(subtypes) ? subtypes.map(subtype => (
            <option key={subtype.id} value={subtype.id}>
              {subtype.hebrew_description}
              {subtype.purpose && ` - ${subtype.purpose}`}
            </option>
          )) : null}
        </select>
      </div>
      
      {!disabled && cutId && (
        <>
          {!showAddNew ? (
            <button 
              type="button"
              onClick={() => setShowAddNew(true)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              הוסף תת-נתח חדש
            </button>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 space-y-3">
              <h4 className="font-medium text-gray-900">הוספת תת-נתח חדש</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  תיאור בעברית *
                </label>
                <input
                  type="text"
                  value={newSubtypeHebrewDescription}
                  onChange={(e) => setNewSubtypeHebrewDescription(e.target.value)}
                  placeholder="למשל: חזה עוף שלם"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={adding}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  שם באנגלית (אופציונלי)
                </label>
                <input
                  type="text"
                  value={newSubtypeName}
                  onChange={(e) => setNewSubtypeName(e.target.value)}
                  placeholder="למשל: chicken_breast_whole"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={adding}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  מטרת השימוש
                </label>
                <input
                  type="text"
                  value={newSubtypePurpose}
                  onChange={(e) => setNewSubtypePurpose(e.target.value)}
                  placeholder="למשל: צלייה, גריל, קליית מחבת"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={adding}
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddNewSubtype}
                  disabled={adding || !newSubtypeHebrewDescription.trim()}
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
      
      {!cutId && (
        <div className="text-gray-500 text-xs mt-1">
          יש לבחור נתח תחילה
        </div>
      )}
      
      {cutId && subtypes.length === 0 && !loading && (
        <div className="text-gray-500 text-xs mt-1">
          לא נמצאו תת-נתחים עבור נתח זה
        </div>
      )}
    </div>
  );
};

export default SubtypeSelector;