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
      const response = await fetch('https://bashrometer-api.onrender.com/healthz', {
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
      fetch('https://bashrometer-api.onrender.com/healthz').catch(() => null),
      fetch('https://bashrometer-api.onrender.com/').catch(() => null),
      fetch('https://bashrometer-api.onrender.com/api/products?limit=1').catch(() => null)
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
    
    // Group by product and retailer, keep only latest price
    priceReports.forEach(report => {
      const { product_id, retailer_id, regular_price, sale_price, reported_at } = report;
      
      if (!matrix[product_id]) {
        matrix[product_id] = {};
      }
      
      // Check if this is newer than existing price for this product-retailer combination
      const existing = matrix[product_id][retailer_id];
      if (!existing || new Date(reported_at) > new Date(existing.reportedAt)) {
        const effectivePrice = sale_price && sale_price < regular_price ? sale_price : regular_price;
        
        matrix[product_id][retailer_id] = {
          price: effectivePrice,
          isOnSale: !!(sale_price && sale_price < regular_price),
          originalPrice: sale_price && sale_price < regular_price ? regular_price : undefined,
          reportedAt: reported_at
        };
      }
    });
    
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

  // Format price display
  const formatPrice = (priceData: { price: number; isOnSale: boolean; originalPrice?: number }) => {
    const { price, isOnSale, originalPrice } = priceData;
    
    if (isOnSale && originalPrice) {
      return (
        <div className="space-y-1">
          <div className="font-bold">₪{price.toFixed(0)}</div>
          <div className="text-xs line-through opacity-60">₪{originalPrice.toFixed(0)}</div>
          <div className="text-xs font-medium">מבצע!</div>
        </div>
      );
    }
    
    return <div className="font-bold">₪{price.toFixed(0)}</div>;
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

      // Fetch all data
      const [productsRes, retailersRes, pricesRes] = await Promise.all([
        fetch('https://bashrometer-api.onrender.com/api/products?limit=100', { headers }),
        fetch('https://bashrometer-api.onrender.com/api/retailers?limit=100', { headers }),
        fetch('https://bashrometer-api.onrender.com/api/prices?limit=500&status=approved', { headers })
      ]);

      if (!productsRes.ok || !retailersRes.ok) {
        throw new Error('שגיאה בטעינת נתונים בסיסיים');
      }

      const [productsData, retailersData] = await Promise.all([
        productsRes.json(),
        retailersRes.json()
      ]);

      let pricesData = { prices: [] };
      if (pricesRes.ok) {
        pricesData = await pricesRes.json();
      }

      const fetchedProducts = productsData.products || [];
      const fetchedRetailers = retailersData.retailers || [];
      const fetchedPrices = pricesData.prices || [];

      console.log('Data loaded:', {
        products: fetchedProducts.length,
        retailers: fetchedRetailers.length,
        prices: fetchedPrices.length
      });

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
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-2">טוען מטריקס מחירים...</p>
          <ServerStatusIndicator />
          {retrying && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 max-w-md mx-auto">
              <p className="text-sm text-blue-600 font-medium">
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
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-2xl mx-auto">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">שגיאה בטעינת הנתונים</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center mx-auto"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${retrying ? 'animate-spin' : ''}`} />
            {retrying ? 'מנסה שוב...' : 'נסה שוב'}
          </button>
        </div>
      </div>
    );
  }

  // Get products that have at least one price
  const productsWithPrices = products.filter(product => 
    priceMatrix[product.id] && Object.keys(priceMatrix[product.id]).length > 0
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">טבלת השוואת מחירים 🥩</h1>
          <p className="text-gray-600 mt-1">
            השוואת מחירי נתחי בשר בין {retailers.length} קמעונאים - {productsWithPrices.length} מוצרים
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ServerStatusIndicator />
          <button
            onClick={handleRetry}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
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
                    <th key={retailer.id} className="px-3 py-3 text-center font-semibold min-w-[120px] border-l border-gray-300">
                      <div className="transform -rotate-45 origin-center whitespace-nowrap">
                        {retailer.name}
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