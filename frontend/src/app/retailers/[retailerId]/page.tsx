// src/app/retailers/[retailerId]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Retailer {
  id: number;
  name: string;
  chain?: string;
  address?: string;
  type?: string;
  website?: string;
  phone?: string;
  user_rating?: number;
  rating_count?: number;
}

interface RetailerPrice {
  id: number;
  product_id: number;
  product_name: string;
  regular_price: number;
  sale_price?: number;
  is_on_sale: boolean;
  unit_for_price: string;
  quantity_for_price: number;
  calculated_price_per_100g: number;
  price_submission_date: string;
  notes?: string;
  likes_count: number;
}

export default function RetailerDetailPage() {
  const params = useParams();
  const retailerId = params.retailerId as string;

  const [retailer, setRetailer] = useState<Retailer | null>(null);
  const [prices, setPrices] = useState<RetailerPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('price_submission_date');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
  const itemsPerPage = 20;

  const fetchRetailerData = async (page: number = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch retailer details
      const retailerResponse = await fetch(`${apiBase}/api/retailers/${retailerId}`, {
        credentials: 'include',
      });

      if (retailerResponse.ok) {
        const retailerData = await retailerResponse.json();
        setRetailer(retailerData);
      }

      // Fetch retailer prices
      const pricesResponse = await fetch(
        `${apiBase}/api/prices?retailer_id=${retailerId}&limit=${itemsPerPage}&offset=${(page - 1) * itemsPerPage}&sort_by=${sortBy}&order=${sortOrder}`,
        {
          credentials: 'include',
        }
      );

      if (pricesResponse.ok) {
        const pricesData = await pricesResponse.json();
        setPrices(pricesData.data || []);
        setTotalPages(Math.ceil((pricesData.page_info?.total_items || 0) / itemsPerPage));
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error fetching retailer data:', error);
      setError('שגיאה בטעינת נתוני הקמעונאי');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (retailerId) {
      fetchRetailerData();
    }
  }, [retailerId, sortBy, sortOrder]);

  // Handle pagination
  const handlePageChange = (page: number) => {
    fetchRetailerData(page);
  };

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
    background: 'radial-gradient(circle at 70% 30%, rgba(249, 115, 22, 0.1) 0%, transparent 50%)',
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
    background: 'linear-gradient(135deg, #f97316 0%, #3b82f6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  };

  if (isLoading) {
    return (
      <main style={containerStyle}>
        <div style={overlayStyle}></div>
        <div style={contentStyle}>
          <div style={{
            ...cardStyle,
            textAlign: 'center',
            padding: '4rem'
          }}>
            <div style={{fontSize: '3rem', marginBottom: '1rem'}}>⏳</div>
            <div style={{color: '#ffffff', fontSize: '1.25rem'}}>טוען נתוני קמעונאי...</div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main style={containerStyle}>
        <div style={overlayStyle}></div>
        <div style={contentStyle}>
          <div style={{
            ...cardStyle,
            textAlign: 'center',
            padding: '4rem'
          }}>
            <div style={{fontSize: '3rem', marginBottom: '1rem'}}>❌</div>
            <div style={{color: '#f87171', fontSize: '1.25rem'}}>{error}</div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={containerStyle}>
      <div style={overlayStyle}></div>
      <div style={contentStyle}>
        {/* Retailer Header */}
        {retailer && (
          <div style={cardStyle}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem'}}>
              <div style={{flex: '1', minWidth: '300px'}}>
                <h1 style={titleStyle}>🏪 {retailer.name}</h1>
                
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem'}}>
                  {retailer.chain && (
                    <div style={{
                      background: 'rgba(59, 130, 246, 0.1)',
                      padding: '0.75rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(59, 130, 246, 0.3)'
                    }}>
                      <div style={{color: '#60a5fa', fontSize: '0.875rem', marginBottom: '0.25rem'}}>🏢 רשת</div>
                      <div style={{color: '#ffffff', fontWeight: '600'}}>{retailer.chain}</div>
                    </div>
                  )}
                  
                  {retailer.type && (
                    <div style={{
                      background: 'rgba(249, 115, 22, 0.1)',
                      padding: '0.75rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(249, 115, 22, 0.3)'
                    }}>
                      <div style={{color: '#fb923c', fontSize: '0.875rem', marginBottom: '0.25rem'}}>🏷️ סוג</div>
                      <div style={{color: '#ffffff', fontWeight: '600'}}>{retailer.type}</div>
                    </div>
                  )}
                  
                  {retailer.user_rating && (
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.1)',
                      padding: '0.75rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(16, 185, 129, 0.3)'
                    }}>
                      <div style={{color: '#10b981', fontSize: '0.875rem', marginBottom: '0.25rem'}}>⭐ דירוג</div>
                      <div style={{color: '#ffffff', fontWeight: '600'}}>
                        {(retailer.user_rating || 0).toFixed(1)} ({retailer.rating_count || 0} דירוגים)
                      </div>
                    </div>
                  )}
                </div>

                {retailer.address && (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '1rem',
                    borderRadius: '12px',
                    marginBottom: '1rem',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <div style={{color: '#cbd5e1', fontSize: '0.875rem', marginBottom: '0.5rem'}}>📍 כתובת</div>
                    <div style={{color: '#e2e8f0'}}>{retailer.address}</div>
                  </div>
                )}
              </div>

              <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                {retailer.website && (
                  <a
                    href={retailer.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      color: 'white',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '12px',
                      fontWeight: '600',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.25)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    🌐 אתר האינטרנט
                  </a>
                )}
                
                {retailer.phone && (
                  <a
                    href={`tel:${retailer.phone}`}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '12px',
                      fontWeight: '600',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.25)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    📞 {retailer.phone}
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Prices Section */}
        <div style={cardStyle}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem'}}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#ffffff',
              background: 'linear-gradient(135deg, #3b82f6 0%, #f97316 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: 0
            }}>
              💰 רשימת מחירים ({prices.length})
            </h2>

            <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order as 'ASC' | 'DESC');
                }}
                style={{
                  padding: '0.75rem 1rem',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '1rem',
                  outline: 'none',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <option value="price_submission_date-DESC">תאריך דיווח (חדש לישן)</option>
                <option value="price_submission_date-ASC">תאריך דיווח (ישן לחדש)</option>
                <option value="regular_price-ASC">מחיר (זול לגבוה)</option>
                <option value="regular_price-DESC">מחיר (גבוה לזול)</option>
                <option value="product_name-ASC">שם מוצר (א-ב)</option>
                <option value="product_name-DESC">שם מוצר (ב-א)</option>
              </select>
            </div>
          </div>

          {prices.length > 0 ? (
            <div style={{display: 'grid', gap: '1rem'}}>
              {prices.map((price) => (
                <div
                  key={price.id}
                  style={{
                    background: price.is_on_sale 
                      ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)'
                      : 'rgba(255, 255, 255, 0.05)',
                    border: price.is_on_sale 
                      ? '1px solid rgba(239, 68, 68, 0.3)'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    transition: 'all 0.3s ease',
                    position: 'relative'
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
                  {price.is_on_sale && (
                    <div style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '20px',
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
                    {/* Product Info */}
                    <div style={{flex: '1', minWidth: '250px'}}>
                      <Link
                        href={`/products/${price.product_id}`}
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
                        🥩 {price.product_name}
                      </Link>
                      <div style={{color: '#cbd5e1', fontSize: '0.875rem'}}>
                        📅 דווח ב-{new Date(price.price_submission_date).toLocaleDateString('he-IL')}
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
                        fontSize: '1.75rem',
                        fontWeight: 'bold',
                        color: '#ffffff',
                        marginBottom: '0.25rem'
                      }}>
                        ₪{(price.calculated_price_per_100g || 0).toFixed(2)}
                      </div>
                      <div style={{color: '#cbd5e1', fontSize: '0.875rem', marginBottom: '0.5rem'}}>
                        למאה גרם
                      </div>
                      
                      <div style={{fontSize: '0.875rem', color: '#94a3b8'}}>
                        {price.is_on_sale && price.sale_price ? (
                          <>
                            <span style={{textDecoration: 'line-through', marginLeft: '0.5rem'}}>
                              ₪{(Number(price.regular_price) || 0).toFixed(2)}
                            </span>
                            <span style={{color: '#ef4444', fontWeight: 'bold'}}>
                              ₪{(Number(price.sale_price) || 0).toFixed(2)}
                            </span>
                          </>
                        ) : (
                          `₪${(Number(price.regular_price) || 0).toFixed(2)}`
                        )}
                        <div>({(Number(price.quantity_for_price) || 0)} {price.unit_for_price})</div>
                      </div>
                    </div>

                    {/* Likes */}
                    <div style={{textAlign: 'center'}}>
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        padding: '0.75rem',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}>
                        <div style={{fontSize: '1.5rem', marginBottom: '0.25rem'}}>❤️</div>
                        <div style={{color: '#cbd5e1', fontSize: '0.75rem'}}>
                          {price.likes_count} לייקים
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#cbd5e1',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{fontSize: '3rem', marginBottom: '1rem'}}>📦</div>
              <h3 style={{fontSize: '1.5rem', marginBottom: '0.5rem', color: '#ffffff'}}>
                אין דיווחי מחירים
              </h3>
              <p>עדיין לא דווחו מחירים עבור קמעונאי זה</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '1rem',
              marginTop: '2rem',
              padding: '1rem'
            }}>
              {currentPage > 1 && (
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  ◀ הקודם
                </button>
              )}
              
              <span style={{color: '#cbd5e1', fontSize: '0.875rem'}}>
                עמוד {currentPage} מתוך {totalPages}
              </span>
              
              {currentPage < totalPages && (
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  הבא ▶
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}