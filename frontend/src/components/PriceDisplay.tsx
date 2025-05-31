// src/components/PriceDisplay.tsx
"use client";

import React from 'react';

interface PriceDisplayProps {
  /** המחיר המקורי */
  price: number | null | undefined;
  /** המחיר המנורמל לקילוגרם */
  normalizedPrice?: number | null;
  /** יחידת המידה */
  unit: string;
  /** הכמות */
  quantity: number;
  /** האם במבצע */
  isOnSale?: boolean;
  /** מחיר מבצע */
  salePrice?: number | null;
  /** סגנון התצוגה */
  displayMode?: 'compact' | 'detailed' | 'card';
  /** גודל הטקסט */
  size?: 'sm' | 'md' | 'lg';
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({
  price,
  normalizedPrice,
  unit,
  quantity,
  isOnSale = false,
  salePrice,
  displayMode = 'detailed',
  size = 'md'
}) => {
  // קביעת המחיר הפעיל (מבצע או רגיל) עם הגנה על undefined
  const safePrice = price != null ? Number(price) : 0;
  const safeSalePrice = salePrice != null ? Number(salePrice) : 0;
  const activePrice = (isOnSale && safeSalePrice > 0) ? safeSalePrice : safePrice;
  
  // סגנונות לפי גודל
  const sizeClasses = {
    sm: {
      main: 'text-sm',
      secondary: 'text-xs',
      badge: 'text-xs px-2 py-0.5'
    },
    md: {
      main: 'text-base',
      secondary: 'text-sm',
      badge: 'text-sm px-2.5 py-1'
    },
    lg: {
      main: 'text-lg font-semibold',
      secondary: 'text-base',
      badge: 'text-base px-3 py-1.5'
    }
  };

  const classes = sizeClasses[size];

  // פורמט יחידה לעברית
  const formatUnit = (unit: string, quantity: number) => {
    const unitMap: Record<string, string> = {
      'kg': 'ק"ג',
      'g': 'גרם',
      '100g': '100 גרם',
      'unit': 'יחידה',
      'package': 'אריזה'
    };
    
    const hebrewUnit = unitMap[unit.toLowerCase()] || unit;
    return quantity === 1 ? hebrewUnit : `${quantity} ${hebrewUnit}`;
  };

  // תצוגה קומפקטית
  if (displayMode === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <span className={`font-bold text-blue-600 ${classes.main}`}>
          ₪{activePrice.toFixed(2)}
        </span>
        {normalizedPrice != null && (
          <span className={`text-gray-500 ${classes.secondary}`}>
            (₪{Number(normalizedPrice).toFixed(2)}/ק״ג)
          </span>
        )}
        {isOnSale && (
          <span className={`bg-red-100 text-red-800 rounded-full ${classes.badge}`}>
            מבצע
          </span>
        )}
      </div>
    );
  }

  // תצוגה כרטיס
  if (displayMode === 'card') {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
        <div className="flex justify-between items-start">
          <div>
            <div className={`font-bold text-blue-700 ${classes.main}`}>
              ₪{activePrice.toFixed(2)}
            </div>
            <div className={`text-gray-600 ${classes.secondary}`}>
              ל-{formatUnit(unit, quantity)}
            </div>
          </div>
          
          {normalizedPrice != null && (
            <div className="text-left">
              <div className={`font-semibold text-green-600 ${classes.main}`}>
                ₪{Number(normalizedPrice).toFixed(2)}
              </div>
              <div className={`text-gray-500 ${classes.secondary}`}>
                לקילוגרם
              </div>
            </div>
          )}
        </div>
        
        {isOnSale && safeSalePrice > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <span className="bg-red-500 text-white rounded-full px-3 py-1 text-sm font-medium">
              🔥 מבצע
            </span>
            <span className="text-gray-500 line-through text-sm">
              ₪{safePrice.toFixed(2)}
            </span>
            <span className="text-green-600 font-semibold">
              חיסכון: ₪{(safePrice - safeSalePrice).toFixed(2)}
            </span>
          </div>
        )}
      </div>
    );
  }

  // תצוגה מפורטת (ברירת מחדל)
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-2">
        <span className={`font-bold ${isOnSale ? 'text-red-600' : 'text-blue-600'} ${classes.main}`}>
          ₪{activePrice.toFixed(2)}
        </span>
        <span className={`text-gray-600 ${classes.secondary}`}>
          ל-{formatUnit(unit, quantity)}
        </span>
        
        {isOnSale && (
          <span className={`bg-red-100 text-red-800 rounded-full ${classes.badge}`}>
            מבצע
          </span>
        )}
      </div>

      {/* מחיר מנורמל */}
      {normalizedPrice != null && (
        <div className={`text-green-600 font-medium ${classes.secondary}`}>
          ₪{Number(normalizedPrice).toFixed(2)} לקילוגרם
        </div>
      )}

      {/* מחיר מקורי אם יש מבצע */}
      {isOnSale && safeSalePrice > 0 && (
        <div className={`text-gray-500 ${classes.secondary}`}>
          <span className="line-through">מחיר רגיל: ₪{safePrice.toFixed(2)}</span>
          <span className="text-green-600 font-medium mr-2">
            (חיסכון: ₪{(safePrice - safeSalePrice).toFixed(2)})
          </span>
        </div>
      )}
    </div>
  );
};

export default PriceDisplay;