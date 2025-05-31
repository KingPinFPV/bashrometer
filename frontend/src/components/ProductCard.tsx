// src/components/ProductCard.tsx
import { useState, useEffect } from 'react';
import Link from 'next/link';
import PriceDisplay from './PriceDisplay';
import { 
  formatSaleEndDate, 
  isSaleExpired
} from '@/lib/priceColorUtils';

interface Product {
  id: number;
  name: string;
  brand?: string | null;
  short_description?: string | null;
  image_url?: string | null;
  category?: string | null;
  unit_of_measure?: string;
  min_price_per_1kg?: number | null;
  price?: number | null;
  retailer?: string | null;
  cut_type?: string | null;
  weight?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface CurrentPrice {
  id: number;
  regular_price: number | string;
  retailer_name: string;
  is_currently_on_sale: boolean;
  current_price: number | string;
  display_original_price: number | string;
  savings_amount: number | string;
  sale_end_date?: string;
  calculated_price_per_1kg: number | string;
  likes_count: number;
  created_at: string;
}

interface PricesResponse {
  success: boolean;
  prices?: CurrentPrice[];
  data?: CurrentPrice[];
  total_items: number;
  product_id: number;
}

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
}

const ProductCard: React.FC<ProductCardProps> = ({ product, viewMode = 'grid' }) => {
  const [currentPrices, setCurrentPrices] = useState<CurrentPrice[]>([]);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [pricesError, setPricesError] = useState<string>('');
  
  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

  useEffect(() => {
    fetchCurrentPrices();
  }, [product.id]);

  const fetchCurrentPrices = async () => {
    try {
      setPricesLoading(true);
      setPricesError('');
      
      const response = await fetch(`${apiBase}/api/prices/current/${product.id}`);
      
      if (response.ok) {
        const data: PricesResponse = await response.json();
        
        console.log(`Prices response for product ${product.id}:`, data);
        
        if (data.success) {
          // המרת strings למספרים עם טיפול בשגיאות
          const rawPrices = data.prices || data.data || [];
          console.log(`Raw prices data:`, rawPrices);
          
          const processedPrices = rawPrices.map((price: any) => {
            const processed = {
              ...price,
              current_price: parseFloat(price.current_price?.toString() || '0') || 0,
              regular_price: parseFloat(price.regular_price?.toString() || '0') || 0,
              display_original_price: parseFloat(price.display_original_price?.toString() || price.regular_price?.toString() || '0') || 0,
              savings_amount: parseFloat(price.savings_amount?.toString() || '0') || 0,
              calculated_price_per_1kg: parseFloat(price.calculated_price_per_1kg?.toString() || '0') || 0,
              likes_count: parseInt(price.likes_count?.toString() || '0') || 0
            };
            console.log(`Processed price:`, processed);
            return processed;
          });
          
          setCurrentPrices(processedPrices);
        } else {
          console.error('API returned success: false', data);
          setPricesError('שגיאה בטעינת מחירים');
        }
      } else {
        console.error(`HTTP error: ${response.status}`);
        setPricesError('שגיאה בטעינת מחירים');
      }
    } catch (error) {
      console.error('Error fetching current prices:', error);
      setPricesError('שגיאת רשת בטעינת מחירים');
    } finally {
      setPricesLoading(false);
    }
  };

  // Find best price and sale info
  const bestPrice = currentPrices.length > 0 ? currentPrices[0] : null;
  const hasSales = currentPrices.some(price => price.is_currently_on_sale);
  const bestSale = currentPrices.find(price => price.is_currently_on_sale);


  // Helper function to safely format prices
  const formatPrice = (price: number | string | null | undefined): string => {
    if (price === null || price === undefined) return '0.00';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
  };

  const cardStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    transition: 'all 0.3s ease',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '1rem',
    gap: '0.75rem',
    minHeight: '280px',
    width: '100%',
    '@media (min-width: 640px)': {
      padding: viewMode === 'list' ? '1rem' : '1.5rem',
      flexDirection: viewMode === 'list' ? 'row' : 'column',
      gap: viewMode === 'list' ? '1rem' : '0',
      alignItems: viewMode === 'list' ? 'center' : 'stretch',
      minHeight: viewMode === 'list' ? 'auto' : '300px',
    }
  } as const;

  const imageStyle = {
    width: '100%',
    height: '140px',
    objectFit: 'cover' as const,
    borderRadius: '12px',
    flexShrink: 0,
    '@media (min-width: 640px)': {
      width: viewMode === 'list' ? '80px' : '100%',
      height: viewMode === 'list' ? '80px' : '160px',
    }
  };

  const placeholderStyle = {
    width: '100%',
    height: '140px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#cbd5e1',
    fontSize: '0.875rem',
    flexShrink: 0,
    '@media (min-width: 640px)': {
      width: viewMode === 'list' ? '80px' : '100%',
      height: viewMode === 'list' ? '80px' : '160px',
    }
  };

  const contentStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
    marginTop: viewMode === 'list' ? '0' : '1rem',
  };

  const titleStyle = {
    fontSize: viewMode === 'list' ? '1.125rem' : '1.25rem',
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: '0.25rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: viewMode === 'list' ? 'nowrap' : 'normal',
  } as const;

  const brandStyle = {
    fontSize: '0.875rem',
    color: '#94a3b8',
    fontWeight: '500',
  };

  const categoryStyle = {
    fontSize: '0.75rem',
    color: '#64748b',
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '0.25rem 0.5rem',
    borderRadius: '6px',
    width: 'fit-content',
  };

  const priceStyle = {
    fontSize: viewMode === 'list' ? '1rem' : '1.125rem',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginTop: '0.5rem',
  };

  const noPriceStyle = {
    fontSize: '0.875rem',
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: '0.5rem',
  };

  const descriptionStyle = {
    fontSize: '0.875rem',
    color: '#94a3b8',
    lineHeight: '1.4',
    display: viewMode === 'list' ? 'none' : 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    display: '-webkit-box',
  };

  const linkStyle = {
    color: '#60a5fa',
    fontWeight: '600',
    fontSize: '1rem',
    textDecoration: 'none',
    padding: '0.875rem 1rem',
    background: 'rgba(59, 130, 246, 0.1)',
    borderRadius: '12px',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    transition: 'all 0.3s ease',
    textAlign: 'center' as const,
    marginTop: 'auto',
    minHeight: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '@media (min-width: 640px)': {
      fontSize: '0.875rem',
      padding: '0.5rem 1rem',
      alignSelf: viewMode === 'list' ? 'flex-end' : 'stretch',
      whiteSpace: 'nowrap' as const,
    }
  };

  const actionsStyle = {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    marginTop: viewMode === 'list' ? '0' : '1rem',
  };

  return (
    <div 
      className="w-full max-w-sm mx-auto sm:max-w-none"
      style={cardStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = viewMode === 'list' ? 'translateX(4px)' : 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
        e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translate(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      }}
    >
      {/* Image */}
      {product.image_url ? (
        <img 
          src={product.image_url} 
          alt={product.name} 
          style={imageStyle}
        />
      ) : (
        <div style={placeholderStyle}>
          🥩 אין תמונה
        </div>
      )}

      {/* Content */}
      <div style={contentStyle}>
        <h2 style={titleStyle} title={product.name}>
          {product.name}
        </h2>
        
        {product.brand && (
          <div style={brandStyle}>
            🏷️ {product.brand}
          </div>
        )}
        
        {product.category && (
          <div style={categoryStyle}>
            📂 {product.category}
          </div>
        )}

        {product.cut_type && (
          <div style={categoryStyle}>
            🔪 {product.cut_type}
          </div>
        )}

        {product.retailer && (
          <div style={brandStyle}>
            🏪 {product.retailer}
          </div>
        )}

        {product.weight && (
          <div style={brandStyle}>
            ⚖️ {product.weight}
          </div>
        )}

        {/* Enhanced Price Display with Sale Information */}
        {pricesLoading ? (
          <div style={{
            ...noPriceStyle,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              border: '2px solid #6b7280',
              borderTop: '2px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            טוען מחירים...
          </div>
        ) : pricesError ? (
          <div style={noPriceStyle}>
            ❌ {pricesError}
          </div>
        ) : currentPrices.length > 0 ? (
          <div style={{ marginTop: '0.75rem' }}>
            {/* Enhanced Sale Badge with Expiration */}
            {hasSales && bestSale && (
              (() => {
                const saleEndInfo = bestSale.sale_end_date ? formatSaleEndDate(bestSale.sale_end_date) : null;
                const isExpired = isSaleExpired(bestSale);
                
                return (
                  <div style={{
                    backgroundColor: isExpired ? '#dc2626' : (saleEndInfo?.color.includes('red') ? '#dc2626' : 
                                      saleEndInfo?.color.includes('orange') ? '#ea580c' : 
                                      saleEndInfo?.color.includes('yellow') ? '#ca8a04' : '#dc2626'),
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '1rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    marginBottom: '0.5rem',
                    animation: isExpired ? 'none' : 'pulse 2s infinite',
                    opacity: isExpired ? 0.7 : 1
                  }}>
                    {isExpired ? '⚠️ המבצע פג' : '🔥 מבצע!'}
                    {saleEndInfo && !isExpired && (
                      <span style={{ opacity: 0.9 }}>
                        {saleEndInfo.icon} {saleEndInfo.text}
                      </span>
                    )}
                  </div>
                );
              })()
            )}
            
            {/* Best Price Display */}
            <div style={priceStyle}>
              {bestSale ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{
                      fontSize: viewMode === 'list' ? '1.25rem' : '1.5rem',
                      fontWeight: 'bold',
                      color: '#dc2626'
                    }}>
                      ₪{formatPrice(bestSale.current_price)}
                    </span>
                    <span style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      textDecoration: 'line-through'
                    }}>
                      ₪{formatPrice(bestSale.display_original_price)}
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      backgroundColor: '#dcfce7',
                      color: '#166534',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '0.75rem',
                      fontWeight: '600'
                    }}>
                      חיסכון ₪{formatPrice(bestSale.savings_amount)}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#94a3b8'
                  }}>
                    ב{bestSale.retailer_name} • ₪{formatPrice(bestSale.calculated_price_per_1kg)}/ק״ג
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{
                    fontSize: viewMode === 'list' ? '1.125rem' : '1.25rem',
                    fontWeight: 'bold'
                  }}>
                    ₪{formatPrice(bestPrice?.current_price)}
                  </span>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#94a3b8'
                  }}>
                    ב{bestPrice?.retailer_name} • ₪{formatPrice(bestPrice?.calculated_price_per_1kg)}/ק״ג
                  </div>
                </div>
              )}
            </div>
            
            {/* Multiple Prices Indicator */}
            {currentPrices.length > 1 && (
              <div style={{
                fontSize: '0.75rem',
                color: '#60a5fa',
                marginTop: '0.5rem',
                fontWeight: '500'
              }}>
                📊 +{currentPrices.length - 1} מחירים נוספים
              </div>
            )}
          </div>
        ) : (product.price != null || product.min_price_per_1kg != null) ? (
          <div style={priceStyle}>
            {product.price != null && (
              <PriceDisplay
                price={product.price}
                normalizedPrice={product.min_price_per_1kg}
                unit={product.unit_of_measure || 'יחידה'}
                quantity={1}
                displayMode="compact"
                size="sm"
              />
            )}
            {product.price == null && product.min_price_per_1kg != null && (
              <PriceDisplay
                price={product.min_price_per_1kg}
                normalizedPrice={product.min_price_per_1kg}
                unit="ק״ג"
                quantity={1}
                displayMode="compact"
                size="sm"
              />
            )}
          </div>
        ) : (
          <div style={noPriceStyle}>
            ❓ אין מידע על מחיר
          </div>
        )}

        {product.short_description && (
          <div style={descriptionStyle}>
            {product.short_description}
          </div>
        )}

        <div style={actionsStyle}>
          <Link 
            href={`/products/${product.id}`} 
            style={linkStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {viewMode === 'list' ? '👁️ צפה' : '📊 פרטים ומחירים'}
          </Link>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default ProductCard;