"use client";

import React, { useState, useEffect } from 'react';

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
    description: ''
  });
  
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        category: product.category || '',
        description: product.description || ''
      });
    }
  }, [product]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...product, ...formData });
  };
  
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">עריכת מוצר</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">שם המוצר *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">קטגוריה *</label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">בחר קטגוריה</option>
              <option value="בקר">בקר</option>
              <option value="עוף">עוף</option>
              <option value="טלה">טלה</option>
              <option value="הודו">הודו</option>
              <option value="כבש">כבש</option>
              <option value="אווז">אווז</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">תיאור</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="תיאור אופציונלי למוצר..."
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              שמור שינויים
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors"
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