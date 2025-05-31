'use client';

import React from 'react';
import Link from 'next/link';
import { Package, TrendingUp, Clock } from 'lucide-react';

interface ProductCardProps {
  id: number;
  name: string;
  category?: string;
  brand?: string;
  cut_name?: string;
  subtype_name?: string;
  min_price_per_1kg?: number;
  avg_price_per_1kg?: number;
  status?: string;
  created_at?: string;
  reports_count?: number;
  className?: string;
  showStatus?: boolean;
  compact?: boolean;
}

export default function ProductCard({
  id,
  name,
  category,
  brand,
  cut_name,
  subtype_name,
  min_price_per_1kg,
  avg_price_per_1kg,
  status = 'approved',
  created_at,
  reports_count,
  className = '',
  showStatus = false,
  compact = false
}: ProductCardProps) {
  // Enhanced validation: Check for required props
  if (!id || id === 0 || !name || name.trim() === '') {
    console.error('ProductCard: Invalid product data - missing id or name', { 
      id, 
      name, 
      type_id: typeof id, 
      type_name: typeof name 
    });
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600 text-sm">שגיאה: נתוני מוצר לא תקינים</p>
        <p className="text-red-500 text-xs mt-1">מזהה: {id}, שם: {name}</p>
      </div>
    );
  }

  // Ensure id is a valid number
  const productId = typeof id === 'string' ? parseInt(id) : id;
  if (isNaN(productId) || productId <= 0) {
    console.error('ProductCard: Invalid product ID format', { 
      id, 
      productId, 
      parsed: isNaN(productId) ? 'NaN' : productId 
    });
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600 text-sm">שגיאה: מזהה מוצר לא תקין</p>
        <p className="text-red-500 text-xs mt-1">מזהה שהתקבל: {id}</p>
      </div>
    );
  }
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'מאושר';
      case 'pending': return 'ממתין';
      case 'rejected': return 'נדחה';
      default: return status;
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow ${className}`}>
      <div className={`p-${compact ? '4' : '6'}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <Link 
              href={`/products/${productId}`}
              className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors"
            >
              {name}
            </Link>
            {brand && (
              <p className="text-sm text-gray-500 mt-1">מותג: {brand}</p>
            )}
          </div>
          {showStatus && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
              {getStatusText(status)}
            </span>
          )}
        </div>

        <div className="space-y-2 mb-4">
          {category && (
            <div className="flex items-center text-sm text-gray-600">
              <Package className="w-4 h-4 ml-2" />
              <span>{category}</span>
            </div>
          )}
          
          {cut_name && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">נתח:</span> {cut_name}
            </div>
          )}
          
          {subtype_name && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">תת-סוג:</span> {subtype_name}
            </div>
          )}
        </div>

        {(min_price_per_1kg || avg_price_per_1kg) && (
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between">
              {min_price_per_1kg && (
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    ₪{min_price_per_1kg.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">מחיר מינימלי/ק״ג</div>
                </div>
              )}
              
              {avg_price_per_1kg && (
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">
                    ₪{avg_price_per_1kg.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">מחיר ממוצע/ק״ג</div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-4 space-x-reverse text-sm text-gray-500">
            {reports_count !== undefined && (
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 ml-1" />
                <span>{reports_count} דיווחים</span>
              </div>
            )}
            
            {created_at && (
              <div className="flex items-center">
                <Clock className="w-4 h-4 ml-1" />
                <span>{new Date(created_at).toLocaleDateString('he-IL')}</span>
              </div>
            )}
          </div>
          
          <Link 
            href={`/products/${productId}`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            צפה בפרטים ←
          </Link>
        </div>
      </div>
    </div>
  );
}