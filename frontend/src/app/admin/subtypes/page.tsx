'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Edit, Trash2, Search, Filter } from 'lucide-react';

interface Subtype {
  id: number;
  name: string;
  hebrew_description: string;
  purpose?: string;
  typical_price_range_min?: number;
  typical_price_range_max?: number;
  is_active: boolean;
  cut_name: string;
  cut_category: string;
  products_count: number;
  created_at: string;
}

interface Cut {
  id: number;
  name: string;
  hebrew_name: string;
  category: string;
}

export default function AdminSubtypesPage() {
  const { token } = useAuth();
  const [subtypes, setSubtypes] = useState<Subtype[]>([]);
  const [cuts, setCuts] = useState<Cut[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSubtype, setEditingSubtype] = useState<Subtype | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const loadSubtypes = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/admin/subtypes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubtypes(data.subtypes || []);
      }
    } catch (error) {
      console.error('Error loading subtypes:', error);
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    loadSubtypes();
    loadCuts();
  }, [token]);

  const groupSubtypesByCut = (subtypes: Subtype[]) => {
    const filtered = subtypes.filter(subtype => {
      const matchesSearch = !searchTerm || 
        subtype.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subtype.hebrew_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subtype.cut_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = !selectedCategory || subtype.cut_category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });

    const grouped: Record<string, Subtype[]> = {};
    filtered.forEach(subtype => {
      const key = `${subtype.cut_category} - ${subtype.cut_name}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(subtype);
    });

    return grouped;
  };

  const categories = [...new Set(subtypes.map(s => s.cut_category))];
  const groupedSubtypes = groupSubtypesByCut(subtypes);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען תת-סוגים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ניהול תת-סוגי מוצרים</h1>
          <p className="mt-1 text-gray-600">נהל את תת-סוגי המוצרים במערכת ({subtypes.length} תת-סוגים)</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 ml-2" />
          הוסף תת-סוג חדש
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="חיפוש תת-סוגים..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pr-10 pl-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">כל הקטגוריות</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Subtypes grouped by cut */}
      <div className="space-y-6">
        {Object.entries(groupedSubtypes).map(([cutName, cutSubtypes]) => (
          <div key={cutName} className="bg-white border rounded-lg shadow-sm">
            <div className="bg-gray-50 px-4 py-3 border-b">
              <h3 className="font-medium text-gray-900">{cutName}</h3>
              <p className="text-sm text-gray-600">{cutSubtypes.length} תת-סוגים</p>
            </div>
            <div className="p-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cutSubtypes.map(subtype => (
                  <SubtypeCard 
                    key={subtype.id} 
                    subtype={subtype}
                    onEdit={() => setEditingSubtype(subtype)}
                    onToggleActive={() => {/* TODO */}}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingSubtype) && (
        <SubtypeModal
          subtype={editingSubtype}
          cuts={cuts}
          onClose={() => {
            setShowCreateModal(false);
            setEditingSubtype(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingSubtype(null);
            loadSubtypes();
          }}
        />
      )}
    </div>
  );
}

// Subtype Card Component
const SubtypeCard: React.FC<{
  subtype: Subtype;
  onEdit: () => void;
  onToggleActive: () => void;
}> = ({ subtype, onEdit, onToggleActive }) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-gray-900">{subtype.name}</h4>
        <div className="flex space-x-1 space-x-reverse">
          <button
            onClick={onEdit}
            className="text-gray-400 hover:text-blue-600 p-1"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mb-3">{subtype.hebrew_description}</p>
      
      {subtype.purpose && (
        <p className="text-xs text-gray-500 mb-2">מטרה: {subtype.purpose}</p>
      )}
      
      {(subtype.typical_price_range_min || subtype.typical_price_range_max) && (
        <p className="text-xs text-gray-500 mb-2">
          טווח מחירים: ₪{subtype.typical_price_range_min || 0} - ₪{subtype.typical_price_range_max || 0}
        </p>
      )}
      
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-500">
          {subtype.products_count} מוצרים
        </span>
        <span className={`text-xs px-2 py-1 rounded-full ${
          subtype.is_active 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {subtype.is_active ? 'פעיל' : 'לא פעיל'}
        </span>
      </div>
    </div>
  );
};

// Modal Component
const SubtypeModal: React.FC<{
  subtype: Subtype | null;
  cuts: Cut[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ subtype, cuts, onClose, onSuccess }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    cut_id: subtype?.id || '',
    name: subtype?.name || '',
    hebrew_description: subtype?.hebrew_description || '',
    purpose: subtype?.purpose || '',
    typical_price_range_min: subtype?.typical_price_range_min || '',
    typical_price_range_max: subtype?.typical_price_range_max || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    try {
      const url = subtype 
        ? `${API_URL}/api/admin/subtypes/${subtype.id}`
        : `${API_URL}/api/admin/subtypes`;
      
      const method = subtype ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving subtype:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-medium mb-4">
          {subtype ? 'עריכת תת-סוג' : 'יצירת תת-סוג חדש'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">נתח</label>
            <select
              value={formData.cut_id}
              onChange={(e) => setFormData({...formData, cut_id: e.target.value})}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">בחר נתח</option>
              {cuts.map(cut => (
                <option key={cut.id} value={cut.id}>
                  {cut.category} - {cut.hebrew_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם (אנגלית)</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תיאור (עברית)</label>
            <input
              type="text"
              value={formData.hebrew_description}
              onChange={(e) => setFormData({...formData, hebrew_description: e.target.value})}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">מטרה</label>
            <input
              type="text"
              value={formData.purpose}
              onChange={(e) => setFormData({...formData, purpose: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">מחיר מינימלי</label>
              <input
                type="number"
                value={formData.typical_price_range_min}
                onChange={(e) => setFormData({...formData, typical_price_range_min: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">מחיר מקסימלי</label>
              <input
                type="number"
                value={formData.typical_price_range_max}
                onChange={(e) => setFormData({...formData, typical_price_range_max: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>

          <div className="flex space-x-3 space-x-reverse pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'שומר...' : subtype ? 'עדכן' : 'צור'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};