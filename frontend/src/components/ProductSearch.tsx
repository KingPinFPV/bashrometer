'use client';

import React, { useState, useEffect } from 'react';

interface FilterOptions {
  categories: string[];
  kosher_levels: string[];
  processing_states: string[];
  quality_grades: string[];
  brands: string[];
}

interface Cut {
  id: number;
  name: string;
  hebrew_name: string;
  category: string;
  subtypes_count: number;
  products_count: number;
}

interface Subtype {
  id: number;
  name: string;
  hebrew_description: string;
  purpose: string;
  price_range: string;
}

interface SearchFilters {
  search: string;
  category: string;
  cut_id: string;
  subtype_id: string;
  kosher_level: string;
  processing_state: string;
  has_bone: string;
  quality_grade: string;
  price_min: string;
  price_max: string;
  sort_by: string;
  order: string;
}

interface ProductSearchProps {
  onResults: (results: any) => void;
  onLoading: (loading: boolean) => void;
  apiUrl: string;
}

const ProductSearch: React.FC<ProductSearchProps> = ({ onResults, onLoading, apiUrl }) => {
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    category: '',
    cut_id: '',
    subtype_id: '',
    kosher_level: '',
    processing_state: '',
    has_bone: '',
    quality_grade: '',
    price_min: '',
    price_max: '',
    sort_by: 'name',
    order: 'ASC'
  });

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: [],
    kosher_levels: [],
    processing_states: [],
    quality_grades: [],
    brands: []
  });

  const [cutsByCategory, setCutsByCategory] = useState<Record<string, Cut[]>>({});
  const [subtypes, setSubtypes] = useState<Subtype[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Load filter options and cuts on component mount
  useEffect(() => {
    loadFilterOptions();
    loadCuts();
  }, []);

  // Load subtypes when cut_id changes
  useEffect(() => {
    if (filters.cut_id) {
      loadSubtypes(parseInt(filters.cut_id));
    } else {
      setSubtypes([]);
      setFilters(prev => ({ ...prev, subtype_id: '' }));
    }
  }, [filters.cut_id]);

  const loadFilterOptions = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/products/filter-options`);
      const data = await response.json();
      setFilterOptions(data);
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const loadCuts = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/products/cuts`);
      const data = await response.json();
      setCutsByCategory(data.data);
    } catch (error) {
      console.error('Error loading cuts:', error);
    }
  };

  const loadSubtypes = async (cutId: number) => {
    try {
      const response = await fetch(`${apiUrl}/api/products/subtypes/${cutId}`);
      const data = await response.json();
      setSubtypes(data.data);
    } catch (error) {
      console.error('Error loading subtypes:', error);
      setSubtypes([]);
    }
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = async () => {
    onLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          params.append(key, value);
        }
      });

      const response = await fetch(`${apiUrl}/api/products/search?${params.toString()}`);
      const data = await response.json();
      onResults(data);
    } catch (error) {
      console.error('Error searching products:', error);
      onResults({ data: [], page_info: { total_items: 0 } });
    } finally {
      onLoading(false);
    }
  };

  const handleClear = () => {
    setFilters({
      search: '',
      category: '',
      cut_id: '',
      subtype_id: '',
      kosher_level: '',
      processing_state: '',
      has_bone: '',
      quality_grade: '',
      price_min: '',
      price_max: '',
      sort_by: 'name',
      order: 'ASC'
    });
    setSubtypes([]);
    onResults({ data: [], page_info: { total_items: 0 } });
  };

  // Auto-search when filters change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (filters.search || Object.values(filters).some(v => v && v !== 'name' && v !== 'ASC')) {
        handleSearch();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters]);

  const allCuts = Object.values(cutsByCategory).flat();

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">חיפוש מוצרים</h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-800 transition-colors"
        >
          {isExpanded ? 'הסתר פילטרים' : 'הצג פילטרים נוספים'}
        </button>
      </div>

      {/* Basic Search Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            חיפוש חופשי
          </label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="שם מוצר, מותג או תיאור..."
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            קטגוריה
          </label>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">כל הקטגוריות</option>
            {filterOptions.categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            נתח
          </label>
          <select
            value={filters.cut_id}
            onChange={(e) => handleFilterChange('cut_id', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">כל הנתחים</option>
            {allCuts.map(cut => (
              <option key={cut.id} value={cut.id.toString()}>
                {cut.hebrew_name} ({cut.products_count} מוצרים)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            תת-סוג
          </label>
          <select
            value={filters.subtype_id}
            onChange={(e) => handleFilterChange('subtype_id', e.target.value)}
            disabled={!filters.cut_id}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          >
            <option value="">כל התת-סוגים</option>
            {subtypes.map(subtype => (
              <option key={subtype.id} value={subtype.id.toString()}>
                {subtype.hebrew_description}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Advanced Filters (Collapsible) */}
      {isExpanded && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              כשרות
            </label>
            <select
              value={filters.kosher_level}
              onChange={(e) => handleFilterChange('kosher_level', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">כל רמות הכשרות</option>
              {filterOptions.kosher_levels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              מצב עיבוד
            </label>
            <select
              value={filters.processing_state}
              onChange={(e) => handleFilterChange('processing_state', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">כל מצבי העיבוד</option>
              {filterOptions.processing_states.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              עם עצם
            </label>
            <select
              value={filters.has_bone}
              onChange={(e) => handleFilterChange('has_bone', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">לא משנה</option>
              <option value="true">עם עצם</option>
              <option value="false">ללא עצם</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              דרגת איכות
            </label>
            <select
              value={filters.quality_grade}
              onChange={(e) => handleFilterChange('quality_grade', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">כל דרגות האיכות</option>
              {filterOptions.quality_grades.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              מחיר מינימלי (₪/ק״ג)
            </label>
            <input
              type="number"
              value={filters.price_min}
              onChange={(e) => handleFilterChange('price_min', e.target.value)}
              placeholder="0"
              min="0"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              מחיר מקסימלי (₪/ק״ג)
            </label>
            <input
              type="number"
              value={filters.price_max}
              onChange={(e) => handleFilterChange('price_max', e.target.value)}
              placeholder="1000"
              min="0"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              מיון לפי
            </label>
            <select
              value={filters.sort_by}
              onChange={(e) => handleFilterChange('sort_by', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="name">שם המוצר</option>
              <option value="brand">מותג</option>
              <option value="category">קטגוריה</option>
              <option value="price">מחיר מינימלי</option>
              <option value="avg_price">מחיר ממוצע</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              כיוון המיון
            </label>
            <select
              value={filters.order}
              onChange={(e) => handleFilterChange('order', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ASC">עולה (א-ת, נמוך-גבוה)</option>
              <option value="DESC">יורד (ת-א, גבוה-נמוך)</option>
            </select>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleSearch}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          חפש
        </button>
        <button
          onClick={handleClear}
          className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors font-medium"
        >
          נקה
        </button>
      </div>
    </div>
  );
};

export default ProductSearch;