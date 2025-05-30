// src/app/price-comparison/page.tsx
"use client";

import { useState, useEffect, useRef } from 'react';

interface Product {
  id: number;
  name: string;
  brand?: string;
  category?: string;
}

// interface Retailer {
//   id: number;
//   name: string;
//   address?: string;
// }

interface Price {
  id: number;
  product_id: number;
  product_name: string;
  retailer_id: number;
  retailer_name: string;
  regular_price: number;
  sale_price?: number;
  is_on_sale: boolean;
  calculated_price_per_100g: number;
  price_submission_date: string;
  unit_for_price: string;
  quantity_for_price: number;
}

interface ComparisonResult {
  product: Product;
  prices: Price[];
  cheapest_price: number;
  most_expensive_price: number;
  price_difference: number;
  savings_percentage: number;
}

export default function PriceComparisonPage() {
  // States for product selection
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [productInput, setProductInput] = useState<string>('');
  const [productSuggestions, setProductSuggestions] = useState<Product[]>([]);
  const [showProductDropdown, setShowProductDropdown] = useState<boolean>(false);
  
  // States for comparison results
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult[]>([]);
  // const [isLoading, setIsLoading] = useState<boolean>(false);
  // const [error, setError] = useState<string | null>(null);
  
  // States for shopping cart calculator
  const [shoppingCart, setShoppingCart] = useState<{[productId: number]: {quantity: number, selectedRetailer?: number}}>({});
  const [bestCombination, setBestCombination] = useState<{retailer: string, total: number, items: {product: string, quantity: number, unitPrice: number, totalPrice: number}[]} | null>(null);

  const productDropdownRef = useRef<HTMLDivElement>(null);
  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

  // Search products autocomplete
  const searchProducts = async (query: string) => {
    if (query.length < 2) {
      setProductSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`${apiBase}/api/products?name_like=${encodeURIComponent(query)}&limit=10`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setProductSuggestions(data.data || []);
      }
    } catch (error) {
      console.error('Error searching products:', error);
    }
  };

  // Add product to comparison
  const addProductToComparison = (product: Product) => {
    if (!selectedProducts.find(p => p.id === product.id)) {
      setSelectedProducts([...selectedProducts, product]);
      setProductInput('');
      setShowProductDropdown(false);
      setProductSuggestions([]);
    }
  };

  // Remove product from comparison
  const removeProductFromComparison = (productId: number) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
    setComparisonResults(comparisonResults.filter(r => r.product.id !== productId));
  };

  // Fetch price comparison data
  const fetchPriceComparison = async () => {
    if (selectedProducts.length === 0) return;

    try {
      const results: ComparisonResult[] = [];
      
      for (const product of selectedProducts) {
        const response = await fetch(`${apiBase}/api/prices?product_id=${product.id}&status=approved&limit=20`, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const priceData = await response.json();
          const prices = priceData.data || [];
          
          if (prices.length > 0) {
            // Calculate price statistics
            const pricesPerKg = prices.map((p: Price) => p.calculated_price_per_100g).filter((p: number) => p !== null);
            const cheapest = Math.min(...pricesPerKg);
            const mostExpensive = Math.max(...pricesPerKg);
            const difference = mostExpensive - cheapest;
            const savingsPercentage = ((difference / mostExpensive) * 100);

            results.push({
              product,
              prices,
              cheapest_price: cheapest,
              most_expensive_price: mostExpensive,
              price_difference: difference,
              savings_percentage: savingsPercentage
            });
          }
        }
      }
      
      setComparisonResults(results);
    } catch (error) {
      console.error('Error fetching price comparison:', error);
    }
  };

  // Calculate optimal shopping combination
  const calculateOptimalShopping = () => {
    if (comparisonResults.length === 0) return;

    // Group by retailer and calculate total cost
    const retailerTotals: {[retailerId: number]: {name: string, total: number, items: {product: string, quantity: number, unitPrice: number, totalPrice: number}[]}} = {};

    comparisonResults.forEach(result => {
      const quantity = shoppingCart[result.product.id]?.quantity || 1;
      
      result.prices.forEach(price => {
        if (!retailerTotals[price.retailer_id]) {
          retailerTotals[price.retailer_id] = {
            name: price.retailer_name,
            total: 0,
            items: []
          };
        }
        
        const itemCost = (price.calculated_price_per_100g * quantity);
        retailerTotals[price.retailer_id].total += itemCost;
        retailerTotals[price.retailer_id].items.push({
          product: result.product.name,
          quantity,
          unitPrice: price.calculated_price_per_100g,
          totalPrice: itemCost
        });
      });
    });

    // Find cheapest retailer
    const cheapestRetailer = Object.values(retailerTotals).reduce((min, current) => 
      current.total < min.total ? current : min
    );

    setBestCombination(cheapestRetailer);
  };

  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target as Node)) {
        setShowProductDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedProducts.length > 0) {
      fetchPriceComparison();
    }
  }, [selectedProducts]);

  useEffect(() => {
    calculateOptimalShopping();
  }, [comparisonResults, shoppingCart]);

  // Styling
  const containerStyle = {
    minHeight: 'calc(100vh - 200px)',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
    padding: '3rem 2rem',
    position: 'relative' as const,
  };

  const overlayStyle = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at 50% 30%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
    pointerEvents: 'none' as const,
  };

  const contentStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    position: 'relative' as const,
    zIndex: 10,
  };

  const titleStyle = {
    fontSize: '3rem',
    fontWeight: 'bold',
    textAlign: 'center' as const,
    marginBottom: '2rem',
    background: 'linear-gradient(135deg, #3b82f6 0%, #f97316 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  };

  const sectionStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    padding: '2rem',
    marginBottom: '2rem',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    fontSize: '1rem',
    outline: 'none',
    backdropFilter: 'blur(10px)',
  };

  return (
    <main style={containerStyle}>
      <div style={overlayStyle}></div>
      <div style={contentStyle}>
        <h1 style={titleStyle}>
          📊 השוואת מחירים מתקדמת
        </h1>
        
        {/* Product Selection */}
        <div style={sectionStyle}>
          <h2 style={{color: '#ffffff', fontSize: '1.5rem', marginBottom: '1rem'}}>
            🛒 בחר מוצרים להשוואה
          </h2>
          
          <div ref={productDropdownRef} style={{position: 'relative', marginBottom: '1rem'}}>
            <input
              type="text"
              value={productInput}
              onChange={(e) => {
                setProductInput(e.target.value);
                setShowProductDropdown(true);
                searchProducts(e.target.value);
              }}
              placeholder="התחל להקליד שם מוצר להוספה..."
              style={inputStyle}
            />
            
            {showProductDropdown && productSuggestions.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderTop: 'none',
                borderRadius: '0 0 12px 12px',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 1000,
                backdropFilter: 'blur(10px)'
              }}>
                {productSuggestions.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => addProductToComparison(product)}
                    style={{
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#1f2937'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{fontWeight: '500'}}>
                      {product.name}
                    </div>
                    {product.brand && (
                      <div style={{fontSize: '0.875rem', color: '#6b7280'}}>
                        {product.brand}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Products */}
          {selectedProducts.length > 0 && (
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.5rem'}}>
              {selectedProducts.map((product) => (
                <div
                  key={product.id}
                  style={{
                    background: 'rgba(59, 130, 246, 0.2)',
                    color: '#ffffff',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    border: '1px solid rgba(59, 130, 246, 0.3)'
                  }}
                >
                  <span>{product.name}</span>
                  <button
                    onClick={() => removeProductFromComparison(product.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#f87171',
                      cursor: 'pointer',
                      fontSize: '1.2rem'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comparison Results */}
        {comparisonResults.length > 0 && (
          <div style={sectionStyle}>
            <h2 style={{color: '#ffffff', fontSize: '1.5rem', marginBottom: '1rem'}}>
              📈 תוצאות השוואה
            </h2>
            
            {comparisonResults.map((result) => (
              <div key={result.product.id} style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '1rem',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h3 style={{color: '#ffffff', fontSize: '1.25rem', marginBottom: '1rem'}}>
                  🥩 {result.product.name}
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}>
                    <div style={{color: '#10b981', fontSize: '0.875rem', marginBottom: '0.25rem'}}>
                      מחיר הזול ביותר
                    </div>
                    <div style={{color: '#ffffff', fontSize: '1.5rem', fontWeight: 'bold'}}>
                      ₪{(result.cheapest_price || 0).toFixed(2)}
                    </div>
                  </div>
                  
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(239, 68, 68, 0.3)'
                  }}>
                    <div style={{color: '#ef4444', fontSize: '0.875rem', marginBottom: '0.25rem'}}>
                      מחיר הגבוה ביותר
                    </div>
                    <div style={{color: '#ffffff', fontSize: '1.5rem', fontWeight: 'bold'}}>
                      ₪{(result.most_expensive_price || 0).toFixed(2)}
                    </div>
                  </div>
                  
                  <div style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(59, 130, 246, 0.3)'
                  }}>
                    <div style={{color: '#3b82f6', fontSize: '0.875rem', marginBottom: '0.25rem'}}>
                      חיסכון פוטנציאלי
                    </div>
                    <div style={{color: '#ffffff', fontSize: '1.5rem', fontWeight: 'bold'}}>
                      {(result.savings_percentage || 0).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Price breakdown by retailer */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '0.5rem'
                }}>
                  {result.prices.slice(0, 6).map((price) => (
                    <div
                      key={`${price.retailer_id}-${price.id}`}
                      style={{
                        background: price.calculated_price_per_100g === result.cheapest_price 
                          ? 'rgba(16, 185, 129, 0.1)' 
                          : 'rgba(255, 255, 255, 0.05)',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: `1px solid ${price.calculated_price_per_100g === result.cheapest_price 
                          ? 'rgba(16, 185, 129, 0.3)' 
                          : 'rgba(255, 255, 255, 0.1)'}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{color: '#ffffff', fontWeight: '500', fontSize: '0.875rem'}}>
                          {price.retailer_name}
                        </div>
                        {price.is_on_sale && (
                          <div style={{color: '#f97316', fontSize: '0.75rem'}}>
                            🏷️ במבצע
                          </div>
                        )}
                      </div>
                      <div style={{
                        color: price.calculated_price_per_100g === result.cheapest_price ? '#10b981' : '#ffffff',
                        fontWeight: 'bold'
                      }}>
                        ₪{(price.calculated_price_per_100g || 0).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Smart Shopping Cart */}
        {comparisonResults.length > 0 && (
          <div style={sectionStyle}>
            <h2 style={{color: '#ffffff', fontSize: '1.5rem', marginBottom: '1rem'}}>
              🧮 מחשבון סל קניות חכם
            </h2>
            
            <p style={{color: '#cbd5e1', marginBottom: '1rem'}}>
              הזן כמויות כדי לקבל המליצה על החנות הזולה ביותר לסל הקניות שלך
            </p>
            
            {comparisonResults.map((result) => (
              <div key={result.product.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1rem',
                padding: '1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px'
              }}>
                <div style={{flex: 1, color: '#ffffff'}}>
                  {result.product.name}
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <span style={{color: '#cbd5e1', fontSize: '0.875rem'}}>כמות (100 גר&apos;):</span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={shoppingCart[result.product.id]?.quantity || 1}
                    onChange={(e) => {
                      setShoppingCart({
                        ...shoppingCart,
                        [result.product.id]: {
                          ...shoppingCart[result.product.id],
                          quantity: parseFloat(e.target.value) || 0
                        }
                      });
                    }}
                    style={{
                      ...inputStyle,
                      width: '80px',
                      padding: '0.5rem',
                      textAlign: 'center'
                    }}
                  />
                </div>
              </div>
            ))}

            {bestCombination && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                padding: '1.5rem',
                marginTop: '1rem'
              }}>
                <h3 style={{color: '#10b981', fontSize: '1.25rem', marginBottom: '1rem'}}>
                  🏆 החנות הזולה ביותר לסל שלך
                </h3>
                <div style={{color: '#ffffff', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem'}}>
                  {bestCombination.retailer} - ₪{(bestCombination.total || 0).toFixed(2)}
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.5rem'
                }}>
                  {bestCombination.items.map((item, index) => (
                    <div key={index} style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      padding: '0.5rem',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      color: '#e2e8f0'
                    }}>
                      {item.product}: {item.quantity} × ₪{(item.unitPrice || 0).toFixed(2)} = ₪{(item.totalPrice || 0).toFixed(2)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {selectedProducts.length === 0 && (
          <div style={{
            ...sectionStyle,
            textAlign: 'center',
            color: '#cbd5e1'
          }}>
            <div style={{fontSize: '3rem', marginBottom: '1rem'}}>📊</div>
            <h3 style={{fontSize: '1.5rem', marginBottom: '0.5rem'}}>
              התחל להשוות מחירים
            </h3>
            <p>
              הוסף מוצרים כדי לראות השוואת מחירים מפורטת בין חנויות שונות
            </p>
          </div>
        )}
      </div>
    </main>
  );
}