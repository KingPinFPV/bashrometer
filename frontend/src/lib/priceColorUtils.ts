// src/lib/priceColorUtils.ts
// פונקציות עזר לצבעי מחירים ותוקף מבצעים

export interface PriceItem {
  price?: number;
  calculated_price_per_1kg?: number;
  regular_price?: number;
  sale_price?: number | null;
  is_sale?: boolean;
  is_on_sale?: boolean;
  is_currently_on_sale?: boolean;
  sale_end_date?: string | null;
  valid_to?: string | null;
  submission_date?: string;
  created_at?: string;
  retailer?: string;
  retailer_name?: string;
  store_name?: string;
}

// פונקציה לקביעת צבע הרקע - עדיפות לירוק למחיר הנמוך ביותר
export const getPriceBackgroundColor = (item: PriceItem, isLowestPrice: boolean): string => {
  // אם זה המחיר הכי נמוך - תמיד ירוק (עדיפות עליונה)
  if (isLowestPrice) {
    return 'bg-green-100 border-green-300';
  }
  
  // אם זה במבצע אבל לא המחיר הכי נמוך - כחול
  if (item.is_sale || item.is_on_sale || item.is_currently_on_sale || item.sale_price) {
    return 'bg-blue-100 border-blue-300';
  }
  
  // רגיל - אפור
  return 'bg-gray-100 border-gray-300';
};

// פונקציה לקביעת צבע הטקסט
export const getPriceTextColor = (item: PriceItem, isLowestPrice: boolean): string => {
  if (isLowestPrice) {
    return 'text-green-800';
  }
  
  if (item.is_sale || item.is_on_sale || item.is_currently_on_sale || item.sale_price) {
    return 'text-blue-800';
  }
  
  return 'text-gray-800';
};

// פונקציה ליצירת טקסט ה-badge
export const getSaleBadgeText = (item: PriceItem, isLowestPrice: boolean): string | null => {
  const isOnSale = item.is_sale || item.is_on_sale || item.is_currently_on_sale || (item.sale_price && item.regular_price && item.sale_price < item.regular_price);
  
  if (isLowestPrice && isOnSale) {
    return '🏆 המחיר הטוב ביותר במבצע!';
  }
  
  if (isLowestPrice) {
    return '🏆 המחיר הטוב ביותר';
  }
  
  if (isOnSale) {
    return '🏷️ מבצע';
  }
  
  return null;
};

// פונקציה לקביעת צבע ה-badge
export const getSaleBadgeColor = (item: PriceItem, isLowestPrice: boolean): string => {
  if (isLowestPrice) {
    return 'bg-green-500 text-white';
  }
  
  if (item.is_sale || item.is_on_sale || item.is_currently_on_sale || item.sale_price) {
    return 'bg-blue-500 text-white';
  }
  
  return 'bg-gray-500 text-white';
};

// פונקציה לפורמט תאריכי תוקף מבצע
export const formatSaleEndDate = (dateString: string | null | undefined): {
  text: string;
  color: string;
  icon: string;
} | null => {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    const today = new Date();
    
    // איפוס השעות להשוואה מדויקת של תאריכים
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: 'המבצע פג', color: 'text-red-600', icon: '⚠️' };
    } else if (diffDays === 0) {
      return { text: 'מסתיים היום!', color: 'text-orange-600', icon: '⏰' };
    } else if (diffDays === 1) {
      return { text: 'מסתיים מחר', color: 'text-orange-500', icon: '📅' };
    } else if (diffDays <= 3) {
      return { text: `עוד ${diffDays} ימים`, color: 'text-yellow-600', icon: '📅' };
    } else {
      return { 
        text: `עד ${date.toLocaleDateString('he-IL')}`, 
        color: 'text-gray-600', 
        icon: '📅' 
      };
    }
  } catch (error) {
    console.warn('Error parsing sale end date:', dateString, error);
    return null;
  }
};

// פונקציה לבדיקה אם מבצע פעיל
export const isSaleActive = (item: PriceItem): boolean => {
  const saleEndDate = item.sale_end_date || item.valid_to;
  if (!saleEndDate) {
    // אם אין תאריך סוף, נבדוק רק לפי הדגלים
    return !!(item.is_sale || item.is_on_sale || item.is_currently_on_sale);
  }
  
  try {
    const endDate = new Date(saleEndDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // סוף היום
    
    return endDate >= today && !!(item.is_sale || item.is_on_sale || item.is_currently_on_sale || item.sale_price);
  } catch {
    return !!(item.is_sale || item.is_on_sale || item.is_currently_on_sale);
  }
};

// פונקציה למציאת המחיר הנמוך ביותר ברשימה
export const findLowestPrice = (prices: PriceItem[]): number | null => {
  if (!prices || prices.length === 0) return null;
  
  const validPrices = prices
    .map(item => {
      // נבחר את המחיר האפקטיבי (מבצע אם קיים, אחרת רגיל)
      const salePrice = item.sale_price;
      const regularPrice = item.regular_price || item.price || item.calculated_price_per_1kg;
      
      if (salePrice && regularPrice && salePrice < regularPrice) {
        return salePrice;
      }
      
      return regularPrice || item.calculated_price_per_1kg || 0;
    })
    .filter(price => price > 0);
  
  if (validPrices.length === 0) return null;
  
  return Math.min(...validPrices);
};

// פונקציה לבדיקה אם פריט הוא בעל המחיר הנמוך ביותר
export const isLowestPriceItem = (item: PriceItem, allPrices: PriceItem[]): boolean => {
  const lowestPrice = findLowestPrice(allPrices);
  if (!lowestPrice) return false;
  
  const itemPrice = getEffectivePrice(item);
  return itemPrice === lowestPrice;
};

// פונקציה לקבלת המחיר האפקטיבי של פריט
export const getEffectivePrice = (item: PriceItem): number => {
  const salePrice = item.sale_price;
  const regularPrice = item.regular_price || item.price || item.calculated_price_per_1kg;
  
  if (salePrice && regularPrice && salePrice < regularPrice) {
    return salePrice;
  }
  
  return regularPrice || item.calculated_price_per_1kg || 0;
};

// פונקציה ליצירת סטיילים inline עבור React components
export const getPriceStyleObject = (item: PriceItem, isLowestPrice: boolean) => {
  const bgColor = getPriceBackgroundColor(item, isLowestPrice);
  const textColor = getPriceTextColor(item, isLowestPrice);
  
  return {
    backgroundColor: bgColor.includes('green') ? 'rgba(34, 197, 94, 0.1)' : 
                    bgColor.includes('blue') ? 'rgba(59, 130, 246, 0.1)' : 
                    'rgba(107, 114, 128, 0.1)',
    borderColor: bgColor.includes('green') ? 'rgba(34, 197, 94, 0.3)' : 
                 bgColor.includes('blue') ? 'rgba(59, 130, 246, 0.3)' : 
                 'rgba(107, 114, 128, 0.3)',
    color: textColor.includes('green') ? '#065f46' : 
           textColor.includes('blue') ? '#1e40af' : 
           '#374151',
    border: '2px solid',
    borderRadius: '12px',
    padding: '1rem',
    transition: 'all 0.3s ease'
  };
};