// src/app/products/[productId]/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useReport } from '@/contexts/ReportContext';
import PriceDisplay from '@/components/PriceDisplay';

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
  const { user, token, isLoading: authLoading } = useAuth();
  const { navigateToReport } = useReport();

  const [product, setProduct] = useState<ProductDetailed | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // State to track loading state for individual like buttons
  const [likeActionLoading, setLikeActionLoading] = useState<Record<number, boolean>>({});

  // פונקציה לקבלת מחיר אחרון מכל קמעונאי (ללא כפילויות)
  const getUniqueLatestPrices = (prices: PriceExample[]) => {
    // מיפוי לפי retailer_id לקבלת המחיר העדכני ביותר
    const latestByRetailer = new Map();
    
    prices.forEach(price => {
      const retailerId = price.retailer_id;
      const current = latestByRetailer.get(retailerId);
      
      if (!current || new Date(price.submission_date) > new Date(current.submission_date)) {
        latestByRetailer.set(retailerId, price);
      }
    });
    
    return Array.from(latestByRetailer.values());
  };

  // פונקציה למיון לפי מחיר (כולל מבצעים)
  const sortByEffectivePrice = (prices: PriceExample[]) => {
    return prices.sort((a, b) => {
      const priceA = (a.sale_price && a.sale_price < a.regular_price) ? a.sale_price : a.regular_price;
      const priceB = (b.sale_price && b.sale_price < b.regular_price) ? b.sale_price : b.regular_price;
      return priceA - priceB;
    });
  };

  // פונקציה לקבלת המחיר הטוב ביותר (הזול ביותר מהמחירים העדכניים)
  const getBestCurrentPrice = (prices: PriceExample[]) => {
    if (!prices.length) return null;
    
    const uniquePrices = getUniqueLatestPrices(prices);
    const sortedPrices = sortByEffectivePrice(uniquePrices);
    return sortedPrices[0]; // הזול ביותר
  };

  // פונקציה לקבלת המחיר האחרון שדווח (ללא תלות במחיר)
  const getLatestReportedPrice = (prices: PriceExample[]) => {
    if (!prices.length) return null;
    
    // מיון לפי תאריך דיווח - האחרון ראשון
    const sortedByDate = [...prices].sort((a, b) => 
      new Date(b.submission_date).getTime() - new Date(a.submission_date).getTime()
    );
    
    return sortedByDate[0]; // המחיר שדווח הכי לאחרונה
  };


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
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/products/${productId}`;
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

  const handleReportPrice = () => {
    if (!product) return;
    
    const productForReport = {
      id: product.id,
      name: product.name,
      category: product.category || '',
      cut: product.cut_type || undefined,
      brand: product.brand || undefined
    };
    
    navigateToReport(productForReport, undefined, `/products/${productId}`);
  };

  const handleLikeToggle = async (priceId: number, currentlyLiked: boolean) => {
    if (!user || !token) { ///page.tsx]
      router.push(`/login?redirect=/products/${productId}`);
      return;
    }

    setLikeActionLoading(prev => ({ ...prev, [priceId]: true })); // Set loading for this specific like button

    const method = currentlyLiked ? 'DELETE' : 'POST';
    const likeApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/prices/${priceId}/like`;
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

  // Styling
  const containerStyle = {
    minHeight: 'calc(100vh - 200px)',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
    padding: '2rem',
    position: 'relative' as const,
  };

  const overlayStyle = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at 30% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
    pointerEvents: 'none' as const,
  };

  const contentStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    position: 'relative' as const,
    zIndex: 10,
  };

  const cardStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    padding: '2rem',
    marginBottom: '2rem',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  };

  const titleStyle = {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: '1rem',
    background: 'linear-gradient(135deg, #3b82f6 0%, #f97316 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  };

  console.log("ProductDetailPage: Rendering product details for:", product.name);
  return (
    <main style={containerStyle}>
      <div style={overlayStyle}></div>
      <div style={contentStyle}>
        {/* Product Main Details */}
        <div style={cardStyle}>
          <div style={{display: 'flex', gap: '2rem', flexWrap: 'wrap'}}>
            {/* Product Image */}
            <div style={{flex: '0 0 300px'}}>
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.name} 
                  style={{
                    width: '100%',
                    height: '300px',
                    objectFit: 'cover',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '300px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#cbd5e1',
                  fontSize: '1rem',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  🥩 אין תמונה זמינה
                </div>
              )}
            </div>

            {/* Product Info */}
            <div style={{flex: '1', minWidth: '300px'}}>
              <h1 style={titleStyle}>{product.name}</h1>
              
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem'}}>
                {product.brand && (
                  <div style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    padding: '0.75rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(59, 130, 246, 0.3)'
                  }}>
                    <div style={{color: '#60a5fa', fontSize: '0.875rem', marginBottom: '0.25rem'}}>🏷️ מותג</div>
                    <div style={{color: '#ffffff', fontWeight: '600'}}>{product.brand}</div>
                  </div>
                )}
                
                {product.category && (
                  <div style={{
                    background: 'rgba(249, 115, 22, 0.1)',
                    padding: '0.75rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(249, 115, 22, 0.3)'
                  }}>
                    <div style={{color: '#fb923c', fontSize: '0.875rem', marginBottom: '0.25rem'}}>📂 קטגוריה</div>
                    <div style={{color: '#ffffff', fontWeight: '600'}}>{product.category}</div>
                  </div>
                )}
                
                {product.cut_type && (
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    padding: '0.75rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}>
                    <div style={{color: '#10b981', fontSize: '0.875rem', marginBottom: '0.25rem'}}>🔪 סוג נתח</div>
                    <div style={{color: '#ffffff', fontWeight: '600'}}>{product.cut_type}</div>
                  </div>
                )}
                
                {product.kosher_level && (
                  <div style={{
                    background: 'rgba(139, 92, 246, 0.1)',
                    padding: '0.75rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(139, 92, 246, 0.3)'
                  }}>
                    <div style={{color: '#a78bfa', fontSize: '0.875rem', marginBottom: '0.25rem'}}>✡️ כשרות</div>
                    <div style={{color: '#ffffff', fontWeight: '600'}}>{product.kosher_level}</div>
                  </div>
                )}
              </div>

              {(product.description || product.short_description) && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '1rem',
                  borderRadius: '12px',
                  marginBottom: '1rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{color: '#cbd5e1', fontSize: '0.875rem', marginBottom: '0.5rem'}}>📝 תיאור</div>
                  <div style={{color: '#e2e8f0', lineHeight: '1.6'}}>
                    {product.description || product.short_description}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1.5rem'}}>
                <button
                  onClick={handleReportPrice}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    padding: '0.875rem 1.5rem',
                    borderRadius: '12px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.25)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px 0 rgba(16, 185, 129, 0.35)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(16, 185, 129, 0.25)';
                  }}
                >
                  💰 דווח מחיר למוצר זה
                </button>
                
                <Link
                  href="/price-comparison"
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    padding: '0.875rem 1.5rem',
                    borderRadius: '12px',
                    fontWeight: '600',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.25)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px 0 rgba(59, 130, 246, 0.35)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(59, 130, 246, 0.25)';
                  }}
                >
                  📊 השווה מחירים
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Price Comparison Section */}
        <div style={cardStyle}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#ffffff',
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, #f97316 0%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            💰 השוואת מחירים - 5 הרשתות המובילות
          </h2>

          {product.price_examples && product.price_examples.length > 0 ? (
            (() => {
              const uniqueLatestPrices = getUniqueLatestPrices(product.price_examples);
              const sortedPrices = sortByEffectivePrice(uniqueLatestPrices);
              const bestPrice = getBestCurrentPrice(product.price_examples);
              const latestPrice = getLatestReportedPrice(product.price_examples);
              
              return (
                <div>
                  {/* Debug info */}
                  {process.env.NODE_ENV === 'development' && (
                    <div style={{
                      marginBottom: '1rem',
                      padding: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      color: '#cbd5e1'
                    }}>
                      <strong>Debug:</strong> {product.price_examples.length} דיווחים כולל, {uniqueLatestPrices.length} ייחודיים עדכניים
                      <br />
                      <strong>Best Price:</strong> {bestPrice ? `₪${bestPrice.calculated_price_per_100g?.toFixed(2)} at ${bestPrice.retailer}` : 'None'}
                      <br />
                      <strong>Latest Price:</strong> {latestPrice ? `₪${latestPrice.calculated_price_per_100g?.toFixed(2)} at ${latestPrice.retailer} (${new Date(latestPrice.submission_date).toLocaleDateString()})` : 'None'}
                    </div>
                  )}

                  {/* המחיר האחרון שדווח */}
                  {latestPrice && (
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%)',
                      border: '2px solid rgba(59, 130, 246, 0.5)',
                      borderRadius: '16px',
                      padding: '1.5rem',
                      marginBottom: '1.5rem',
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: '-12px',
                        right: '20px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                      }}>
                        🕐 המחיר האחרון שדווח
                      </div>
                      
                      <div style={{display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem'}}>
                        <span style={{fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6'}}>
                          ₪{latestPrice.calculated_price_per_100g ? latestPrice.calculated_price_per_100g.toFixed(2) : 'N/A'}
                        </span>
                        <span style={{color: '#ffffff', fontSize: '1.25rem'}}>
                          ב{latestPrice.retailer}
                        </span>
                        <span style={{color: '#cbd5e1', fontSize: '0.875rem'}}>
                          דווח ב-{new Date(latestPrice.submission_date).toLocaleDateString('he-IL')}
                        </span>
                        {latestPrice.sale_price && latestPrice.sale_price < latestPrice.regular_price && (
                          <span style={{
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: 'white',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                          }}>
                            🏷️ מבצע!
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* המחיר הטוב ביותר */}
                  {bestPrice && (
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)',
                      border: '2px solid rgba(16, 185, 129, 0.5)',
                      borderRadius: '16px',
                      padding: '1.5rem',
                      marginBottom: '1.5rem',
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: '-12px',
                        right: '20px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                      }}>
                        💰 המחיר הטוב ביותר כרגע
                      </div>
                      
                      <div style={{display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem'}}>
                        <span style={{fontSize: '2rem', fontWeight: 'bold', color: '#10b981'}}>
                          ₪{bestPrice.calculated_price_per_100g ? bestPrice.calculated_price_per_100g.toFixed(2) : 'N/A'}
                        </span>
                        <span style={{color: '#ffffff', fontSize: '1.25rem'}}>
                          ב{bestPrice.retailer}
                        </span>
                        <span style={{color: '#cbd5e1', fontSize: '0.875rem'}}>
                          עודכן ב-{new Date(bestPrice.submission_date).toLocaleDateString('he-IL')}
                        </span>
                        {bestPrice.sale_price && bestPrice.sale_price < bestPrice.regular_price && (
                          <span style={{
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: 'white',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                          }}>
                            🏷️ מבצע!
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: '#ffffff',
                    marginBottom: '1rem'
                  }}>
                    מחירים עדכניים מכל הקמעונאים ({uniqueLatestPrices.length})
                  </h3>
                  
                  <div style={{display: 'grid', gap: '1rem'}}>
                    {sortedPrices.slice(0, 5).map((price, index) => {
                      const isLowest = index === 0;
                      const isSale = price.is_on_sale && price.sale_price;
                
                return (
                  <div
                    key={price.price_id}
                    style={{
                      background: isLowest 
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)'
                        : 'rgba(255, 255, 255, 0.05)',
                      border: isLowest 
                        ? '2px solid rgba(16, 185, 129, 0.5)'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '16px',
                      padding: '1.5rem',
                      position: 'relative',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {isLowest && (
                      <div style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '20px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                      }}>
                        🏆 המחיר הזול ביותר!
                      </div>
                    )}

                    {isSale && (
                      <div style={{
                        position: 'absolute',
                        top: '-10px',
                        left: '20px',
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                      }}>
                        🏷️ במבצע!
                      </div>
                    )}

                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'}}>
                      {/* Retailer Info */}
                      <div style={{flex: '1', minWidth: '200px'}}>
                        <Link
                          href={`/retailers/${price.retailer_id}`}
                          style={{
                            fontSize: '1.25rem',
                            fontWeight: 'bold',
                            color: '#60a5fa',
                            textDecoration: 'none',
                            marginBottom: '0.5rem',
                            display: 'block'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#3b82f6';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#60a5fa';
                          }}
                        >
                          🏪 {price.retailer}
                        </Link>
                        <div style={{color: '#cbd5e1', fontSize: '0.875rem'}}>
                          📅 דווח ב-{new Date(price.submission_date).toLocaleDateString('he-IL')}
                        </div>
                        {price.notes && (
                          <div style={{color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem'}}>
                            📝 {price.notes}
                          </div>
                        )}
                      </div>

                      {/* Price Info */}
                      <div style={{textAlign: 'center'}}>
                        <div style={{
                          fontSize: '2rem',
                          fontWeight: 'bold',
                          color: isLowest ? '#10b981' : '#ffffff',
                          marginBottom: '0.25rem'
                        }}>
                          ₪{price.calculated_price_per_100g ? price.calculated_price_per_100g.toFixed(2) : 'N/A'}
                        </div>
                        <div style={{color: '#cbd5e1', fontSize: '0.875rem', marginBottom: '0.5rem'}}>
                          למאה גרם
                        </div>
                        
                        <div style={{fontSize: '0.875rem'}}>
                          <PriceDisplay
                            price={Number(price.regular_price)}
                            normalizedPrice={price.calculated_price_per_100g}
                            unit={price.unit_for_price}
                            quantity={Number(price.quantity_for_price)}
                            isOnSale={isSale}
                            salePrice={price.sale_price ? Number(price.sale_price) : null}
                            displayMode="detailed"
                            size="sm"
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                        {/* Like Button */}
                        <button
                          onClick={() => handleLikeToggle(price.price_id, price.current_user_liked)}
                          disabled={likeActionLoading[price.price_id] || !user}
                          style={{
                            background: price.current_user_liked 
                              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                              : 'rgba(255, 255, 255, 0.1)',
                            color: price.current_user_liked ? 'white' : '#cbd5e1',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '12px',
                            padding: '0.75rem',
                            cursor: likeActionLoading[price.price_id] || !user ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease',
                            fontSize: '1.5rem',
                            opacity: likeActionLoading[price.price_id] || !user ? 0.5 : 1
                          }}
                          onMouseEnter={(e) => {
                            if (!likeActionLoading[price.price_id] && user) {
                              e.currentTarget.style.transform = 'scale(1.1)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          {likeActionLoading[price.price_id] ? '⏳' : (price.current_user_liked ? '❤️' : '🤍')}
                        </button>
                        <div style={{color: '#cbd5e1', fontSize: '0.75rem', marginBottom: '0.5rem'}}>
                          {price.likes_count} לייקים
                        </div>
                        
                        {/* Update Price Button */}
                        {user && (
                          <button
                            onClick={() => {
                              const productForReport = {
                                id: product.id,
                                name: product.name,
                                category: product.category || '',
                                cut: product.cut_type || undefined,
                                brand: product.brand || undefined
                              };
                              const retailerForReport = {
                                id: price.retailer_id,
                                name: price.retailer
                              };
                              navigateToReport(productForReport, retailerForReport, `/products/${productId}`);
                            }}
                            style={{
                              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '0.5rem 0.75rem',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            📝 עדכן מחיר
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#cbd5e1',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{fontSize: '3rem', marginBottom: '1rem'}}>🔍</div>
              <h3 style={{fontSize: '1.5rem', marginBottom: '0.5rem', color: '#ffffff'}}>
                אין דיווחי מחירים עדיין
              </h3>
              <p style={{marginBottom: '1.5rem'}}>
                היה הראשון לדווח על מחיר למוצר זה ועזור לקהילה!
              </p>
              <button
                onClick={handleReportPrice}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  padding: '1rem 2rem',
                  borderRadius: '12px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-block',
                  boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.25)',
                  transition: 'all 0.3s ease'
                }}
              >
                💰 דווח מחיר ראשון
              </button>
            </div>
          )}
        </div>

        {/* Price History Section */}
        {product.price_examples && product.price_examples.length > 0 && (
          <div style={cardStyle}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#ffffff',
              marginBottom: '1.5rem',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              📈 היסטוריית מחירים
            </h2>

            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              padding: '1.5rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              overflowX: 'auto'
            }}>
              <div style={{minWidth: '600px'}}>
                {/* Table Header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 150px 120px 100px 100px',
                  gap: '1rem',
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  marginBottom: '0.5rem',
                  fontWeight: 'bold',
                  color: '#cbd5e1',
                  fontSize: '0.875rem'
                }}>
                  <div>🏪 קמעונאי</div>
                  <div>📅 תאריך דיווח</div>
                  <div>💰 מחיר למ״ג</div>
                  <div>🏷️ מבצע</div>
                  <div>👍 לייקים</div>
                </div>

                {/* Table Rows */}
                {product.price_examples
                  .sort((a, b) => new Date(b.submission_date).getTime() - new Date(a.submission_date).getTime())
                  .slice(0, 15)
                  .map((price, index) => (
                  <div
                    key={price.price_id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 150px 120px 100px 100px',
                      gap: '1rem',
                      padding: '1rem',
                      background: index % 2 === 0 ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                      borderRadius: '8px',
                      alignItems: 'center',
                      color: '#e2e8f0',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = index % 2 === 0 ? 'rgba(255, 255, 255, 0.05)' : 'transparent';
                    }}
                  >
                    {/* Retailer */}
                    <div style={{
                      fontWeight: '600',
                      color: '#60a5fa'
                    }}>
                      {price.retailer}
                    </div>

                    {/* Date */}
                    <div>
                      {new Date(price.submission_date).toLocaleDateString('he-IL', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>

                    {/* Price per 100g */}
                    <div style={{
                      fontWeight: 'bold',
                      color: index === 0 ? '#10b981' : '#ffffff'
                    }}>
                      ₪{price.calculated_price_per_100g ? price.calculated_price_per_100g.toFixed(2) : 'N/A'}
                    </div>

                    {/* Sale status */}
                    <div>
                      {price.is_on_sale && price.sale_price ? (
                        <span style={{
                          color: '#ef4444',
                          fontWeight: 'bold',
                          background: 'rgba(239, 68, 68, 0.1)',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem'
                        }}>
                          מבצע
                        </span>
                      ) : (
                        <span style={{color: '#6b7280'}}>רגיל</span>
                      )}
                    </div>

                    {/* Likes */}
                    <div style={{
                      textAlign: 'center',
                      color: price.likes_count > 0 ? '#f59e0b' : '#6b7280'
                    }}>
                      {price.likes_count}
                    </div>
                  </div>
                ))}
              </div>

              {product.price_examples.length > 15 && (
                <div style={{
                  textAlign: 'center',
                  marginTop: '1rem',
                  color: '#94a3b8',
                  fontSize: '0.875rem'
                }}>
                  מוצגים 15 דיווחים אחרונים מתוך {product.price_examples.length} דיווחים
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}