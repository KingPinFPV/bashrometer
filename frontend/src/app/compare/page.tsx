'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Clock, WifiOff, Wifi } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  category: string;
}

interface Retailer {
  id: number;
  name: string;
}

interface PriceReport {
  id: number;
  product_id: number;
  retailer_id: number;
  regular_price: number;
  sale_price?: number;
  reported_at: string;
  likes_count: number;
  status: string;
}

interface PriceMatrix {
  [productId: number]: {
    [retailerId: number]: {
      price: number;
      isOnSale: boolean;
      originalPrice?: number;
      reportedAt: string;
    };
  };
}

export default function ComparePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [priceMatrix, setPriceMatrix] = useState<PriceMatrix>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'awake' | 'sleeping'>('checking');
  const [showOfflineData, setShowOfflineData] = useState(false);

  // API base URL - use environment variable
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  // Cache helpers
  const getCachedData = (key: string) => {
    try {
      const cached = localStorage.getItem(`bashrometer_${key}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        return { data, timestamp };
      }
    } catch (error) {
      console.error('Cache read error:', error);
    }
    return null;
  };

  const setCachedData = (key: string, data: any) => {
    try {
      localStorage.setItem(`bashrometer_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Cache write error:', error);
    }
  };

  // Server status check
  const checkServerStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/healthz`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000)
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  // Wake up server
  const wakeUpServer = async () => {
    setServerStatus('sleeping');
    console.log('🔄 מנסה להעיר את השרת...');
    
    const wakePromises = [
      fetch(`${API_BASE}/healthz`).catch(() => null),
      fetch(`${API_BASE}/`).catch(() => null),
      fetch(`${API_BASE}/api/products?limit=1`).catch(() => null)
    ];
    
    await Promise.allSettled(wakePromises);
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    const isAwake = await checkServerStatus();
    setServerStatus(isAwake ? 'awake' : 'sleeping');
    return isAwake;
  };

  // Build price matrix from price reports
  const buildPriceMatrix = (priceReports: PriceReport[]): PriceMatrix => {
    const matrix: PriceMatrix = {};
    
    console.log('🔍 Building price matrix from', priceReports.length, 'price reports');
    
    // Debug: Check data structure
    if (priceReports.length > 0) {
      console.log('🔍 Sample price object:', priceReports[0]);
      console.log('🔍 Available fields:', Object.keys(priceReports[0]));
    }
    
    // Helper function to find valid date from various possible field names
    const getValidDate = (priceObj: Record<string, any>) => {
      const possibleDateFields = [
        'reported_at', 'reportedAt', 'created_at', 'createdAt', 
        'date', 'timestamp', 'updated_at', 'updatedAt'
      ];
      
      for (const field of possibleDateFields) {
        if (priceObj[field]) {
          try {
            const date = new Date(priceObj[field]);
            if (!isNaN(date.getTime())) {
              return date;
            }
          } catch {
            continue;
          }
        }
      }
      
      console.warn('No valid date found for:', priceObj);
      return null;
    };
    
    // Group by product and retailer, keep only latest price
    priceReports.forEach(report => {
      const { product_id, retailer_id, regular_price, sale_price } = report;
      
      if (!matrix[product_id]) {
        matrix[product_id] = {};
      }
      
      // Get valid date using flexible function
      const reportDate = getValidDate(report);
      if (!reportDate) {
        console.warn(`⚠️ No valid date found for product ${product_id}, retailer ${retailer_id}, skipping...`);
        return; // Skip this price report
      }
      
      // Check if this is newer than existing price for this product-retailer combination
      const existing = matrix[product_id][retailer_id];
      const existingDate = existing ? new Date(existing.reportedAt) : null;
      
      if (!existing || (existingDate && reportDate > existingDate) || !existingDate) {
        // Ensure prices are numeric
        const regularPriceNum = parseFloat(regular_price);
        const salePriceNum = sale_price ? parseFloat(sale_price) : null;
        
        if (isNaN(regularPriceNum)) {
          console.warn(`⚠️ Invalid regular_price for product ${product_id}, retailer ${retailer_id}: ${regular_price}`);
          return; // Skip this price report
        }
        
        const effectivePrice = salePriceNum && salePriceNum < regularPriceNum ? salePriceNum : regularPriceNum;
        
        const reportDateStr = reportDate.toISOString();
        const existingDateStr = existingDate ? existingDate.toISOString() : 'No existing date';
        
        console.log(`📊 Product ${product_id}, Retailer ${retailer_id}: Setting price ${effectivePrice} (${reportDateStr})`, 
          existing ? `replacing ${existing.price} (${existingDateStr})` : 'new entry');
        
        matrix[product_id][retailer_id] = {
          price: effectivePrice, // Now guaranteed to be a number
          isOnSale: !!(salePriceNum && salePriceNum < regularPriceNum),
          originalPrice: salePriceNum && salePriceNum < regularPriceNum ? regularPriceNum : undefined,
          reportedAt: reportDate.toISOString() // Store as ISO string
        };
      } else {
        const reportDateStr = reportDate.toISOString();
        const existingDateStr = existingDate ? existingDate.toISOString() : 'No existing date';
        console.log(`⏭️ Product ${product_id}, Retailer ${retailer_id}: Skipping older price ${regular_price} (${reportDateStr}) - keeping ${existing.price} (${existingDateStr})`);
      }
    });
    
    const totalEntries = Object.values(matrix).reduce((total, productPrices) => 
      total + Object.keys(productPrices).length, 0
    );
    console.log('✅ Price matrix built with', totalEntries, 'price entries across', Object.keys(matrix).length, 'products');
    
    return matrix;
  };

  // Get price color based on position in range
  const getPriceColor = (price: number, allPricesForProduct: number[], isOnSale: boolean): string => {
    if (isOnSale) return 'bg-blue-100 text-blue-800 border-blue-300'; // מבצע
    
    if (allPricesForProduct.length < 2) return 'bg-gray-100 text-gray-800 border-gray-300';
    
    const sortedPrices = [...allPricesForProduct].sort((a, b) => a - b);
    const minPrice = sortedPrices[0];
    const maxPrice = sortedPrices[sortedPrices.length - 1];
    
    if (price === minPrice) return 'bg-green-100 text-green-800 border-green-300'; // הכי זול
    if (price === maxPrice) return 'bg-red-100 text-red-800 border-red-300'; // הכי יקר
    
    // ביניים
    const range = maxPrice - minPrice;
    const position = (price - minPrice) / range;
    
    if (position <= 0.33) return 'bg-green-50 text-green-700 border-green-200';
    if (position >= 0.67) return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-yellow-50 text-yellow-700 border-yellow-200';
  };

  // Helper function to safely format price
  const formatPriceValue = (price: number | string | undefined): string => {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) {
      console.warn('Invalid price value:', price);
      return 'N/A';
    }
    return (numPrice || 0).toFixed(0);
  };

  // Format price display
  const formatPrice = (priceData: { price: number; isOnSale: boolean; originalPrice?: number; reportedAt: string }) => {
    const { price, isOnSale, originalPrice, reportedAt } = priceData;
    const reportDate = new Date(reportedAt);
    const isRecent = (Date.now() - reportDate.getTime()) < (7 * 24 * 60 * 60 * 1000); // Within 7 days
    
    if (isOnSale && originalPrice) {
      return (
        <div className="space-y-1">
          <div className="font-bold">₪{formatPriceValue(price)}</div>
          <div className="text-xs line-through opacity-60">₪{formatPriceValue(originalPrice)}</div>
          <div className="text-xs font-medium">מבצע!</div>
          <div className={`text-xs ${isRecent ? 'text-green-600' : 'text-gray-500'}`}>
            {reportDate.toLocaleDateString('he-IL')}
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-1">
        <div className="font-bold">₪{formatPriceValue(price)}</div>
        <div className={`text-xs ${isRecent ? 'text-green-600' : 'text-gray-500'}`}>
          {reportDate.toLocaleDateString('he-IL')}
        </div>
      </div>
    );
  };

  // Fetch data
  const fetchData = async (showRetrying = false) => {
    if (showRetrying) setRetrying(true);
    setError(null);
    setServerStatus('checking');
    
    try {
      const isServerAwake = await checkServerStatus();
      if (!isServerAwake) {
        const wakeUpSuccess = await wakeUpServer();
        if (!wakeUpSuccess) {
          const cachedData = getCachedData('matrix_data');
          if (cachedData) {
            const { products, retailers, matrix } = cachedData.data;
            setProducts(products || []);
            setRetailers(retailers || []);
            setPriceMatrix(matrix || {});
            setShowOfflineData(true);
            const ageHours = (Date.now() - cachedData.timestamp) / (1000 * 60 * 60);
            setError(`מציג נתונים שמורים (${Math.round(ageHours)} שעות)`);
            return;
          }
          setError('השרת לא מגיב. אנא נסה שוב בעוד כמה דקות.');
          return;
        }
      } else {
        setServerStatus('awake');
      }

      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      };

      // Fetch all data - ensure prices are sorted by latest first (removed status filter to include all reports)
      const [productsRes, retailersRes, pricesRes] = await Promise.all([
        fetch(`${API_BASE}/api/products?limit=100`, { headers }),
        fetch(`${API_BASE}/api/retailers?limit=100`, { headers }),
        fetch(`${API_BASE}/api/prices?limit=500&sort_by=reported_at&order=DESC`, { headers })
      ]);

      console.log('🔍 API Response Status Codes:', {
        products: productsRes.status,
        retailers: retailersRes.status,
        prices: pricesRes.status
      });

      if (!productsRes.ok || !retailersRes.ok) {
        throw new Error('שגיאה בטעינת נתונים בסיסיים');
      }

      const [productsData, retailersData] = await Promise.all([
        productsRes.json(),
        retailersRes.json()
      ]);

      console.log('🔍 Raw Products API Response:', productsData);
      console.log('🔍 Raw Retailers API Response:', retailersData);

      let pricesData = { prices: [] };
      if (pricesRes.ok) {
        pricesData = await pricesRes.json();
        console.log('🔍 Raw Prices API Response:', pricesData);
      } else {
        console.error('❌ Prices API failed with status:', pricesRes.status);
      }

      // Try multiple parsing approaches for products
      const fetchedProducts = Array.isArray(productsData) ? productsData : 
                             (productsData.products || productsData.data || []);
      console.log('🔍 Parsed Products Array:', fetchedProducts);
      
      // Try multiple parsing approaches for retailers
      const fetchedRetailers = Array.isArray(retailersData) ? retailersData : 
                              (retailersData.retailers || retailersData.data || []);
      console.log('🔍 Parsed Retailers Array:', fetchedRetailers);
      
      // Try multiple parsing approaches for prices
      const fetchedPrices = Array.isArray(pricesData) ? pricesData : 
                           (pricesData.prices || pricesData.data || []);
      console.log('🔍 Parsed Prices Array:', fetchedPrices);

      console.log('Data loaded:', {
        products: fetchedProducts.length,
        retailers: fetchedRetailers.length,
        prices: fetchedPrices.length
      });

      // Debug: Show sample of price data
      if (fetchedPrices.length > 0) {
        console.log('🔍 Sample price reports:', fetchedPrices.slice(0, 5).map(p => {
          const reportDate = new Date(p.reported_at);
          const isValidDate = !isNaN(reportDate.getTime());
          return {
            id: p.id,
            product_id: p.product_id,
            retailer_id: p.retailer_id,
            regular_price: p.regular_price,
            sale_price: p.sale_price,
            reported_at: p.reported_at,
            reported_at_valid: isValidDate,
            reported_at_parsed: isValidDate ? reportDate.toISOString() : 'Invalid date',
            status: p.status
          };
        }));
      }

      // Debug: Show sample products
      if (fetchedProducts.length > 0) {
        console.log('🏷️ Sample products:', fetchedProducts.slice(0, 5).map(p => ({
          id: p.id,
          name: p.name,
          category: p.category
        })));
      }

      // Debug: Show retailers
      if (fetchedRetailers.length > 0) {
        console.log('🏪 Retailers:', fetchedRetailers.map(r => ({
          id: r.id,
          name: r.name
        })));
      }

      // Build matrix
      const matrix = buildPriceMatrix(fetchedPrices);

      setProducts(fetchedProducts);
      setRetailers(fetchedRetailers);
      setPriceMatrix(matrix);
      setShowOfflineData(false);
      
      // Cache data
      setCachedData('matrix_data', {
        products: fetchedProducts,
        retailers: fetchedRetailers,
        matrix
      });
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRetry = () => {
    setLoading(true);
    fetchData(true);
  };

  // Server status indicator
  const ServerStatusIndicator = () => (
    <div className="flex items-center gap-2 text-sm">
      {serverStatus === 'checking' && (
        <>
          <Clock className="w-4 h-4 animate-spin text-yellow-500" />
          <span className="text-yellow-600">בודק שרת...</span>
        </>
      )}
      {serverStatus === 'sleeping' && (
        <>
          <WifiOff className="w-4 h-4 text-red-500" />
          <span className="text-red-600">מעיר שרת...</span>
        </>
      )}
      {serverStatus === 'awake' && (
        <>
          <Wifi className="w-4 h-4 text-green-500" />
          <span className="text-green-600">שרת פעיל</span>
        </>
      )}
      {showOfflineData && (
        <>
          <AlertTriangle className="w-4 h-4 text-orange-500" />
          <span className="text-orange-600">נתונים שמורים</span>
        </>
      )}
    </div>
  );

  if (loading) {
    return (
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '1rem',
        '@media (min-width: 768px)': {
          padding: '2rem',
        }
      }}>
        <div style={{
          textAlign: 'center',
          padding: '2rem 1rem',
          '@media (min-width: 768px)': {
            padding: '3rem 1rem',
          }
        }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '3px solid #e5e7eb',
            borderTop: '3px solid #2563eb',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{
            color: '#6b7280',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            '@media (min-width: 768px)': {
              fontSize: '1rem',
            }
          }}>טוען מטריקס מחירים...</p>
          <ServerStatusIndicator />
          {retrying && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: '#dbeafe',
              borderRadius: '8px',
              border: '1px solid #bfdbfe',
              maxWidth: '20rem',
              margin: '1rem auto 0',
              '@media (min-width: 768px)': {
                marginTop: '1.5rem',
                padding: '1.5rem',
                borderRadius: '12px',
              }
            }}>
              <p style={{
                fontSize: '0.875rem',
                color: '#2563eb',
                fontWeight: '500',
                textAlign: 'center',
                margin: 0
              }}>
                💤 השרת "נרדם" - מעיר אותו עכשיו...
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error && !showOfflineData) {
    return (
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '1rem',
        '@media (min-width: 768px)': {
          padding: '2rem',
        }
      }}>
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '1.5rem',
          textAlign: 'center',
          maxWidth: '32rem',
          margin: '0 auto',
          '@media (min-width: 768px)': {
            borderRadius: '12px',
            padding: '2rem',
          }
        }}>
          <AlertTriangle style={{
            width: '3rem',
            height: '3rem',
            color: '#ef4444',
            margin: '0 auto 1rem'
          }} />
          <h2 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#991b1b',
            marginBottom: '0.5rem',
            '@media (min-width: 768px)': {
              fontSize: '1.25rem',
            }
          }}>שגיאה בטעינת הנתונים</h2>
          <p style={{
            color: '#dc2626',
            marginBottom: '1rem',
            fontSize: '0.875rem',
            '@media (min-width: 768px)': {
              fontSize: '1rem',
            }
          }}>{error}</p>
          <button
            onClick={handleRetry}
            disabled={retrying}
            style={{
              background: '#dc2626',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              cursor: retrying ? 'not-allowed' : 'pointer',
              opacity: retrying ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              margin: '0 auto',
              fontSize: '0.875rem',
              fontWeight: '500',
              gap: '0.5rem',
              minHeight: '44px',
              '@media (min-width: 768px)': {
                padding: '1rem 2rem',
                fontSize: '1rem',
                borderRadius: '12px',
              }
            }}
          >
            <RefreshCw style={{
              width: '1rem',
              height: '1rem',
              animation: retrying ? 'spin 1s linear infinite' : 'none'
            }} />
            {retrying ? 'מנסה שוב...' : 'נסה שוב'}
          </button>
        </div>
      </div>
    );
  }

  // Helper function to get short retailer name for display
  const getShortRetailerName = (name: string): string => {
    const shortNames: Record<string, string> = {
      'רמי לוי': 'רמי לוי',
      'שופרסל': 'שופרסל', 
      'מעדני בשר': 'מעדני',
      'סופר פארם': 'פארם',
      'חצי חינם': 'חצי חינם',
      'יוחננוף': 'יוחננוף',
      'מחסני השוק': 'מחסני',
      'קינג סטור': 'קינג',
      'בי.אס.אס': 'בי.אס.אס',
      'אדמונד דה רוטשילד': 'רוטשילד'
    };
    
    // If we have a short name, use it, otherwise truncate to 8 characters
    return shortNames[name] || (name.length > 8 ? name.substring(0, 8) + '..' : name);
  };

  // Helper function to normalize product names for grouping
  const normalizeProductName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[״'']/g, '') // Remove Hebrew quotation marks
      .replace(/\s+/g, ' ') // Normalize spaces
      .replace(/[\(\)]/g, '') // Remove parentheses
      .trim();
  };

  // Get products that have at least one price
  const productsWithPricesRaw = products.filter(product => 
    priceMatrix[product.id] && Object.keys(priceMatrix[product.id]).length > 0
  );

  // Group similar products and pick the one with most price data
  const groupedProducts = new Map<string, Product[]>();
  productsWithPricesRaw.forEach(product => {
    const normalizedName = normalizeProductName(product.name);
    if (!groupedProducts.has(normalizedName)) {
      groupedProducts.set(normalizedName, []);
    }
    groupedProducts.get(normalizedName)!.push(product);
  });

  // Pick the best representative from each group
  const productsWithPrices = Array.from(groupedProducts.values()).map(group => {
    if (group.length === 1) return group[0];
    
    // Pick the product with most price data points
    return group.reduce((best, current) => {
      const bestPriceCount = Object.keys(priceMatrix[best.id] || {}).length;
      const currentPriceCount = Object.keys(priceMatrix[current.id] || {}).length;
      return currentPriceCount > bestPriceCount ? current : best;
    });
  });

  console.log('📊 Products after grouping:', productsWithPricesRaw.length, '→', productsWithPrices.length);

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '1rem',
      '@media (min-width: 768px)': {
        padding: '2rem',
      }
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        marginBottom: '1.5rem',
        '@media (min-width: 768px)': {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }
      }}>
        <div>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            marginBottom: '0.25rem',
            '@media (min-width: 768px)': {
              fontSize: '2.5rem',
            }
          }}>טבלת השוואת מחירים 🥩</h1>
          <p style={{
            color: '#6b7280',
            marginTop: '0.25rem',
            fontSize: '0.875rem',
            '@media (min-width: 768px)': {
              fontSize: '1rem',
            }
          }}>
            השוואת מחירי נתחי בשר בין {retailers.length} קמעונאים - {productsWithPrices.length} מוצרים
          </p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
          '@media (min-width: 768px)': {
            gap: '1rem',
            flexWrap: 'nowrap',
          }
        }}>
          <ServerStatusIndicator />
          <button
            onClick={handleRetry}
            style={{
              background: '#2563eb',
              color: 'white',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              minHeight: '44px',
              '@media (min-width: 768px)': {
                padding: '1rem 1.5rem',
                borderRadius: '12px',
              }
            }}
          >
            <RefreshCw style={{
              width: '1rem',
              height: '1rem'
            }} />
            רענן
          </button>
        </div>
      </div>

      {showOfflineData && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-800">
            📱 מציג נתונים שמורים - השרת זמנית לא זמין
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-3">מקרא צבעים:</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span>הכי זול</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-50 border border-yellow-200 rounded"></div>
            <span>ממוצע</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
            <span>הכי יקר</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
            <span>מבצע</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
            <span>אין מידע</span>
          </div>
        </div>
      </div>

      {/* Price Matrix Table */}
      {productsWithPrices.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">אין נתוני מחירים זמינים כרגע</p>
          <button
            onClick={handleRetry}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            נסה לטעון שוב
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              {/* Table Header */}
              <thead>
                <tr className="bg-gray-100">
                  <th className="sticky right-0 bg-gray-100 px-4 py-3 text-right font-semibold border-l border-gray-300 min-w-[200px]">
                    נתח הבשר
                  </th>
                  {retailers.map(retailer => (
                    <th key={retailer.id} className="px-2 py-3 text-center font-semibold min-w-[100px] border-l border-gray-300">
                      <div className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[90px]" title={retailer.name}>
                        {getShortRetailerName(retailer.name)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              
              {/* Table Body */}
              <tbody>
                {productsWithPrices.map((product, index) => {
                  // Get all prices for this product to determine color coding
                  const productPrices = retailers
                    .map(retailer => priceMatrix[product.id]?.[retailer.id]?.price)
                    .filter(Boolean) as number[];

                  return (
                    <tr key={product.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {/* Product Name */}
                      <td className="sticky right-0 bg-inherit px-4 py-3 font-medium border-l border-gray-300">
                        <div>
                          <div className="font-semibold">{product.name}</div>
                          <div className="text-xs text-gray-500">{product.category}</div>
                        </div>
                      </td>
                      
                      {/* Price Cells */}
                      {retailers.map(retailer => {
                        const priceData = priceMatrix[product.id]?.[retailer.id];
                        
                        if (!priceData) {
                          return (
                            <td key={retailer.id} className="px-3 py-3 text-center border-l border-gray-300">
                              <div className="bg-gray-100 text-gray-400 rounded px-2 py-1 text-sm">
                                אין מידע
                              </div>
                            </td>
                          );
                        }

                        const colorClass = getPriceColor(priceData.price, productPrices, priceData.isOnSale);

                        return (
                          <td key={retailer.id} className="px-3 py-3 text-center border-l border-gray-300">
                            <div className={`rounded px-2 py-1 text-sm border ${colorClass}`}>
                              {formatPrice(priceData)}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{productsWithPrices.length}</div>
          <div className="text-sm text-blue-800">נתחי בשר</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">{retailers.length}</div>
          <div className="text-sm text-green-800">קמעונאים</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">
            {Object.values(priceMatrix).reduce((total, productPrices) => 
              total + Object.keys(productPrices).length, 0
            )}
          </div>
          <div className="text-sm text-purple-800">נקודות מחיר</div>
        </div>
      </div>
    </div>
  );
}