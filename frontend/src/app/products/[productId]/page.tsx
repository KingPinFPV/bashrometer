// src/app/products/[productId]/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext'; //

// Interfaces (כפי שהיו אצלך)
interface PriceExample {
  price_id: number;
  retailer_id: number;
  retailer: string;
  regular_price: number;
  sale_price: number | null;
  is_on_sale: boolean;
  unit_for_price: string;
  quantity_for_price: number;
  submission_date: string;
  valid_to: string | null;
  notes: string | null;
  calculated_price_per_100g: number | null;
  likes_count: number;
  current_user_liked: boolean;
}

interface ProductDetailed {
  id: number;
  name: string;
  brand: string | null;
  origin_country: string | null;
  kosher_level: string | null;
  animal_type: string | null;
  cut_type: string | null;
  description: string | null;
  category: string | null;
  unit_of_measure: string;
  default_weight_per_unit_grams: number | null;
  image_url: string | null;
  short_description: string | null;
  is_active: boolean;
  price_examples: PriceExample[];
}

// ממשק לתשובת ה-API של הלייק
interface LikeApiResponse {
  message: string;
  priceId: number;
  userId: number;
  likesCount: number;
  userLiked: boolean;
}

export default function ProductDetailPage() {
  console.log("RENDERING: ProductDetailPage component");

  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;
  const { user, token, isLoading: authLoading } = useAuth(); //

  const [product, setProduct] = useState<ProductDetailed | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // State to track loading state for individual like buttons
  const [likeActionLoading, setLikeActionLoading] = useState<Record<number, boolean>>({});


  const fetchProductDetails = useCallback(async () => {
    console.log(`ProductDetailPage: fetchProductDetails called for productId: ${productId}`);
    if (!productId) {
      console.error("fetchProductDetails: No productId provided.");
      setIsLoading(false);
      setError("Product ID is missing.");
      return;
    }
    setIsLoading(true);
    setError(null);
    const apiUrl = `https://automatic-space-pancake-gr4rjjxpxg5fwj6w-3000.app.github.dev/api/products/${productId}`;
    console.log(`ProductDetailPage: Fetching from API URL: ${apiUrl}`);

    try {
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(apiUrl, { headers });
      console.log(`ProductDetailPage: API response status: ${response.status} for productId: ${productId}`);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error("fetchProductDetails: API error data:", errorData);
        } catch (parseError) {
          errorData = { error: `HTTP error! status: ${response.status}, failed to parse error response.` };
          console.error("fetchProductDetails: Failed to parse API error response:", parseError);
        }
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data: ProductDetailed = await response.json();
      console.log(`ProductDetailPage: Data received from API for productId ${productId}:`, data);
      setProduct(data);
    } catch (e: any) {
      console.error(`ProductDetailPage: Error fetching product details for productId ${productId}:`, e);
      setError(e.message || 'Failed to load product details.');
    } finally {
      setIsLoading(false);
      console.log(`ProductDetailPage: fetchProductDetails finished for productId: ${productId}`);
    }
  }, [productId, token]);

  useEffect(() => {
    console.log("ProductDetailPage useEffect for fetchProductDetails triggered.");
    if (productId) { // Only fetch if productId is available
        fetchProductDetails();
    }
  }, [productId, fetchProductDetails]); // Include fetchProductDetails in dependency array

  const handleLikeToggle = async (priceId: number, currentlyLiked: boolean) => {
    if (!user || !token) { ///page.tsx]
      router.push(`/login?redirect=/products/${productId}`);
      return;
    }

    setLikeActionLoading(prev => ({ ...prev, [priceId]: true })); // Set loading for this specific like button

    const method = currentlyLiked ? 'DELETE' : 'POST';
    const likeApiUrl = `https://automatic-space-pancake-gr4rjjxpxg5fwj6w-3000.app.github.dev/api/prices/${priceId}/like`;
    console.log(`handleLikeToggle: PriceID: ${priceId}, Method: ${method}, URL: ${likeApiUrl}`);

    try {
      const requestOptions: RequestInit = {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      if (method === 'POST') {
        requestOptions.body = JSON.stringify({}); // שלח גוף JSON ריק עבור POST
      }

      const response = await fetch(likeApiUrl, requestOptions);
      const responseData: LikeApiResponse | { error: string } = await response.json(); // קבלת התשובה מהשרת
      
      console.log("handleLikeToggle: Response status:", response.status, "Data:", responseData);

      if (response.ok && 'likesCount' in responseData && 'userLiked' in responseData) {
        // עדכון המצב המקומי עם הנתונים מהשרת
        setProduct(prevProduct => {
          if (!prevProduct) return null;
          return {
            ...prevProduct,
            price_examples: prevProduct.price_examples.map(example =>
              example.price_id === priceId
                ? { ...example, likes_count: responseData.likesCount, current_user_liked: responseData.userLiked }
                : example
            ),
          };
        });
      } else {
        const errorMsg = (responseData as { error: string }).error || `Failed to ${currentlyLiked ? 'unlike' : 'like'} price report.`;
        console.error("handleLikeToggle: Error - ", errorMsg);
        // כאן תוכל להציג הודעת שגיאה למשתמש אם תרצה
        alert(`שגיאה בפעולת הלייק: ${errorMsg}`);
      }
    } catch (e: any) {
      console.error(`handleLikeToggle: Exception - Failed to ${currentlyLiked ? 'unlike' : 'like'} price report:`, e);
      alert(`שגיאת רשת בפעולת הלייק: ${e.message}`);
    } finally {
      setLikeActionLoading(prev => ({ ...prev, [priceId]: false })); // הסר מצב טעינה מכפתור הלייק
    }
  };

  console.log("ProductDetailPage: Current state before return:", { isLoading, authLoading, error, productExists: !!product });

  if (isLoading || authLoading) { ///page.tsx]
    console.log("ProductDetailPage: Rendering loading state...");
    return <div className="text-center py-10">טוען פרטי מוצר... (מתוך [productId]/page.tsx)</div>;
  }

  if (error) { ///page.tsx]
    console.log(`ProductDetailPage: Rendering error state: ${error}`);
    return <div className="text-center py-10 text-red-600">שגיאה (מתוך [productId]/page.tsx): {error}</div>;
  }

  if (!product) { ///page.tsx]
    console.log("ProductDetailPage: Rendering 'Product not found' state...");
    return <div className="text-center py-10">המוצר לא נמצא. (מתוך [productId]/page.tsx)</div>;
  }

  console.log("ProductDetailPage: Rendering product details for:", product.name); // הצג רק שם כדי למנוע לוג ארוך מדי
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Product Main Details */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        {product.image_url && (
          <img 
            src={product.image_url} 
            alt={product.name} 
            className="w-full md:w-1/3 h-auto object-cover rounded-md mb-4 md:float-right md:ml-6 rtl:md:float-left rtl:md:mr-6" 
          />
        )}
        {!product.image_url && (
           <div className="w-full md:w-1/3 h-60 bg-slate-200 rounded-md mb-4 md:float-right md:ml-6 rtl:md:float-left rtl:md:mr-6 flex items-center justify-center text-slate-400">
             אין תמונה זמינה
           </div>
        )}
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-3">{product.name}</h1>
        {product.brand && <p className="text-lg text-slate-600 mb-1"><strong>מותג:</strong> {product.brand}</p>}
        {product.category && <p className="text-lg text-slate-600 mb-1"><strong>קטגוריה:</strong> {product.category}</p>}
        {product.cut_type && <p className="text-sm text-slate-500 mb-1">סוג נתח: {product.cut_type}</p>}
        {product.animal_type && <p className="text-sm text-slate-500 mb-1">סוג חיה: {product.animal_type}</p>}
        {product.kosher_level && <p className="text-sm text-slate-500 mb-1">כשרות: {product.kosher_level}</p>}
        {product.origin_country && <p className="text-sm text-slate-500 mb-4">ארץ מקור: {product.origin_country}</p>}
        
        {product.description && <p className="text-slate-700 mt-4 mb-4 whitespace-pre-wrap">{product.description}</p>}
        {product.short_description && !product.description && <p className="text-slate-700 mt-4 mb-4">{product.short_description}</p>}
        
        {product.default_weight_per_unit_grams && (product.unit_of_measure === 'unit' || product.unit_of_measure === 'package') && (
          <p className="text-sm text-slate-500">משקל ברירת מחדל ליחידה/מארז: {product.default_weight_per_unit_grams} גרם</p>
        )}
      </div>

      {user && product && (
        <div className="my-6 text-center sm:text-right">
          <Link
            href={`/report-price?productId=${product.id}&productName=${encodeURIComponent(product.name)}`}
            className="inline-block bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors text-sm sm:text-base"
          >
            מצאת מחיר אחר? דווח לנו על מחיר למוצר "{product.name}"
          </Link>
        </div>
      )}

      <h2 className="text-2xl font-semibold text-slate-700 mb-6">השוואת מחירים:</h2>
      {product.price_examples && product.price_examples.length > 0 ? (
        <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
          <table className="min-w-full divide-y divide-slate-200">
             <thead className="bg-slate-100">
              <tr>
                <th scope="col" className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">קמעונאי</th>
                <th scope="col" className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">מחיר (ל-100 גרם)</th>
                <th scope="col" className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">מחיר ליח' מכירה</th>
                <th scope="col" className="hidden md:table-cell px-3 sm:px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">תאריך דיווח</th>
                <th scope="col" className="hidden lg:table-cell px-3 sm:px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">הערות</th>
                <th scope="col" className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">אימות קהילה</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {product.price_examples.map((price) => (
                <tr key={price.price_id} className={`${price.is_on_sale ? 'bg-green-50 hover:bg-green-100' : 'hover:bg-slate-50'} transition-colors`}>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{price.retailer}</td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-semibold">
                    {price.calculated_price_per_100g ? `₪${price.calculated_price_per_100g.toFixed(2)}` : 'לא זמין'}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {price.sale_price && price.is_on_sale ? (
                      <>
                        <span className="line-through text-slate-400 mr-1 rtl:ml-1 rtl:mr-0">₪{Number(price.regular_price).toFixed(2)}</span>
                        <span className="font-bold text-red-600">₪{Number(price.sale_price).toFixed(2)}</span>
                      </>
                    ) : (
                      `₪${Number(price.regular_price).toFixed(2)}`
                    )}
                    <span className="text-xs text-slate-400 ml-1 rtl:mr-1 rtl:ml-0"> ({Number(price.quantity_for_price)} {price.unit_for_price})</span>
                  </td>
                  <td className="hidden md:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(price.submission_date).toLocaleDateString('he-IL')}
                  </td>
                  <td className="hidden lg:table-cell px-3 sm:px-6 py-4 text-sm text-slate-500 max-w-[150px] sm:max-w-xs truncate" title={price.notes || undefined}>{price.notes || '-'}</td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-center">
                    <button
                      onClick={() => handleLikeToggle(price.price_id, price.current_user_liked)}
                      disabled={likeActionLoading[price.price_id] || !user} // שימוש במצב טעינה ספציפי לכפתור
                      className={`p-1.5 rounded-full transition-colors disabled:opacity-50 ${
                        price.current_user_liked 
                          ? 'bg-red-500 text-white hover:bg-red-600' 
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                      title={price.current_user_liked ? "הסר לייק" : "עשה לייק"}
                    >
                      {/* הצגת אייקון טעינה אם הפעולה מתבצעת */}
                      {likeActionLoading[price.price_id] ? (
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        price.current_user_liked ? '❤️' : '🤍' 
                      )}
                    </button>
                    <span className="ml-2 rtl:mr-2 text-xs">({price.likes_count})</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-slate-600 mt-4">אין דיווחי מחירים זמינים עבור מוצר זה כרגע.</p>
      )}
    </div>
  );
}