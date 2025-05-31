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
    cut_id: '',
    subtype_id: '',
    description: ''
  });
  
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        category: product.category || '',
        cut_id: product.cut_id || '',
        subtype_id: product.subtype_id || '',
        description: product.description || ''
      });
    }
  }, [product]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...product, ...formData });
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">עריכת מוצר</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">שם המוצר</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">קטגוריה</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">בחר קטגוריה</option>
              <option value="בקר">בקר</option>
              <option value="עוף">עוף</option>
              <option value="טלה">טלה</option>
              <option value="הודו">הודו</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">תיאור</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              rows={3}
            />
          </div>
          
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              שמור
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 text-white py-2 rounded hover:bg-gray-700"
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