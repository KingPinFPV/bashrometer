// components/cuts/CutCard.tsx
'use client';

import React from 'react';
import { NormalizedCut } from '@/types/cuts';

interface CutCardProps {
  cut: NormalizedCut;
  showVariations?: boolean;
  onEdit?: (cut: NormalizedCut) => void;
  onDelete?: (cut: NormalizedCut) => void;
  onViewVariations?: (cut: NormalizedCut) => void;
  className?: string;
}

export default function CutCard({
  cut,
  showVariations = false,
  onEdit,
  onDelete,
  onViewVariations,
  className = ''
}: CutCardProps) {
  const handleEdit = () => onEdit?.(cut);
  const handleDelete = () => onDelete?.(cut);
  const handleViewVariations = () => onViewVariations?.(cut);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'בקר': return 'bg-red-100 text-red-800 border-red-200';
      case 'עוף': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'טלה': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'חזיר': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'דגים': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCutTypeColor = (cutType?: string) => {
    if (!cutType) return 'bg-gray-50 text-gray-600 border-gray-200';
    
    switch (cutType) {
      case 'סטייק': return 'bg-green-50 text-green-700 border-green-200';
      case 'צלי': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'טחון': return 'bg-brown-50 text-brown-700 border-brown-200';
      case 'פילה': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {cut.name}
            </h3>
            {cut.description && (
              <p className="text-sm text-gray-600 mb-2">
                {cut.description}
              </p>
            )}
          </div>
          
          {cut.isPremium && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
              פרמיום
            </span>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(cut.category)}`}>
            {cut.category}
          </span>
          
          {cut.cutType && (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCutTypeColor(cut.cutType)}`}>
              {cut.cutType}
            </span>
          )}
          
          {cut.subcategory && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
              {cut.subcategory}
            </span>
          )}
        </div>

        {/* Additional Info */}
        {(cut.typicalWeightRange || cut.cookingMethods?.length) && (
          <div className="text-xs text-gray-500 mb-3 space-y-1">
            {cut.typicalWeightRange && (
              <div>
                <span className="font-medium">משקל טיפוסי:</span> {cut.typicalWeightRange}
              </div>
            )}
            {cut.cookingMethods && cut.cookingMethods.length > 0 && (
              <div>
                <span className="font-medium">שיטות בישול:</span> {cut.cookingMethods.join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Variations info */}
        {showVariations && (cut as any).variations_count !== undefined && (
          <div className="text-xs text-gray-500 mb-3">
            <span className="font-medium">וריאציות:</span> {(cut as any).variations_count}
          </div>
        )}

        {/* Actions */}
        {(onEdit || onDelete || onViewVariations) && (
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            {onViewVariations && (
              <button
                onClick={handleViewVariations}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
              >
                צפה בוריאציות
              </button>
            )}
            
            {onEdit && (
              <button
                onClick={handleEdit}
                className="text-xs text-gray-600 hover:text-gray-800 font-medium hover:underline"
              >
                ערוך
              </button>
            )}
            
            {onDelete && (
              <button
                onClick={handleDelete}
                className="text-xs text-red-600 hover:text-red-800 font-medium hover:underline"
              >
                מחק
              </button>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="text-xs text-gray-400 mt-3 pt-2 border-t border-gray-50">
          נוצר: {new Date(cut.createdAt).toLocaleDateString('he-IL')}
          {cut.updatedAt !== cut.createdAt && (
            <span> • עודכן: {new Date(cut.updatedAt).toLocaleDateString('he-IL')}</span>
          )}
        </div>
      </div>
    </div>
  );
}