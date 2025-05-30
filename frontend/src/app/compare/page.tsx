'use client'
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, RefreshCw, Clock, Wifi, WifiOff } from 'lucide-react';

interface PriceReport {
  id: number;
  product_id: number;
  retailer_id: number;
  regular_price: number;
  sale_price?: number;
  is_on_sale: boolean;
  reported_at: string;
  likes_count: number;
  retailer_name?: string;
  product_name?: string;
}

interface Retailer {
  id: number;
  name: string;
  address: string;
  website?: string;
  chain?: string;
}

interface Product {
  id: number;
  name: string;
  category: string;
}

const API_BASE = 'https://bashrometer-api.onrender.com';

export default function ComparePage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [priceReports, setPriceReports] = useState<PriceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'avgPrice'>('name');
  const [isMobile, setIsMobile] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'awake' | 'sleeping'>('checking');
  const [error, setError] = useState<string | null>(null);
  const [showOfflineData, setShowOfflineData] = useState(false);

  const checkServerStatus = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${API_BASE}/healthz`, { 
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  };

  const wakeUpServer = async () => {
    setServerStatus('checking');
    console.log('🔄 מנסה להעיר את השרת...');
    
    let isAwake = await checkServerStatus();
    if (isAwake) {
      setServerStatus('awake');
      return true;
    }

    setServerStatus('sleeping');
    
    const wakeUpPromises = [
      fetch(`${API_BASE}/healthz`).catch(() => null),
      fetch(`${API_BASE}/api/health`).catch(() => null),
      fetch(`${API_BASE}/`).catch(() => null)
    ];
    
    await Promise.allSettled(wakeUpPromises);
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    isAwake = await checkServerStatus();
    if (isAwake) {
      setServerStatus('awake');
      return true;
    }

    await new Promise(resolve => setTimeout(resolve, 30000));
    isAwake = await checkServerStatus();
    
    if (isAwake) {
      setServerStatus('awake');
      return true;
    }

    return false;
  };

  // Cache management functions
  const getCachedData = (key: string) => {
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Check if cache is less than 6 hours old
        if (Date.now() - parsed.timestamp < 6 * 60 * 60 * 1000) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Error reading cache:', error);
    }
    return null;
  };

  const setCachedData = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  };

  // Price helper functions
  const getLatestPricePerRetailer = (productId: number) => {
    const productPrices = priceReports.filter(price => price.product_id === productId);
    
    // Group by retailer and get the latest from each
    const latestByRetailer = new Map();
    
    productPrices.forEach(price => {
      const current = latestByRetailer.get(price.retailer_id);
      if (!current || new Date(price.reported_at) > new Date(current.reported_at)) {
        latestByRetailer.set(price.retailer_id, price);
      }
    });
    
    return Array.from(latestByRetailer.values());
  };

  const sortPricesByPrice = (prices: PriceReport[]) => {
    return [...prices].sort((a, b) => {
      const priceA = a.sale_price && a.sale_price < a.regular_price ? a.sale_price : a.regular_price;
      const priceB = b.sale_price && b.sale_price < b.regular_price ? b.sale_price : b.regular_price;
      return priceA - priceB;
    });
  };

  const formatPrice = (price: number) => {
    return `₪${price.toFixed(2)}`;
  };

  const getRetailerName = (retailerId: number) => {
    const retailer = retailers.find(r => r.id === retailerId);
    return retailer?.name || 'קמעונאי לא ידוע';
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (showRetrying = false) => {
    if (showRetrying) setRetrying(true);
    setError(null);
    setServerStatus('checking');
    
    try {
      // בדוק אם השרת ער
      const isServerAwake = await checkServerStatus();
      
      if (!isServerAwake) {
        const wakeUpSuccess = await wakeUpServer();
        if (!wakeUpSuccess) {
          // השתמש בנתונים שמורים
          const cachedData = getCachedData('compare_data');
          if (cachedData) {
            const ageHours = (Date.now() - cachedData.timestamp) / (1000 * 60 * 60);
            setProducts(cachedData.data.products || []);
            setRetailers(cachedData.data.retailers || []);
            setPriceReports(cachedData.data.prices || []);
            setShowOfflineData(true);
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

      // טען נתונים במקביל
      const [productsRes, retailersRes, pricesRes] = await Promise.all([
        fetch(`${API_BASE}/api/products?limit=100`, { 
          headers,
          signal: AbortSignal.timeout(30000)
        }),
        fetch(`${API_BASE}/api/retailers?limit=100`, { 
          headers,
          signal: AbortSignal.timeout(30000)
        }),
        fetch(`${API_BASE}/api/prices?limit=500`, { 
          headers,
          signal: AbortSignal.timeout(30000)
        })
      ]);

      // בדוק תגובות
      if (!productsRes.ok) {
        throw new Error(`שגיאה בטעינת מוצרים: ${productsRes.status}`);
      }
      if (!retailersRes.ok) {
        throw new Error(`שגיאה בטעינת קמעונאים: ${retailersRes.status}`);
      }
      if (!pricesRes.ok) {
        // אם המחירים נכשלו, נמשיך בלי מחירים
        console.warn('Failed to fetch prices:', pricesRes.status);
      }

      const [productsData, retailersData, pricesData] = await Promise.all([
        productsRes.json(),
        retailersRes.json(),
        pricesRes.ok ? pricesRes.json() : { prices: [] }
      ]);

      const finalData = {
        products: productsData.products || productsData.data || [],
        retailers: retailersData.retailers || retailersData.data || [],
        prices: pricesData.prices || pricesData.data || []
      };

      setProducts(finalData.products);
      setRetailers(finalData.retailers);
      setPriceReports(finalData.prices);
      setShowOfflineData(false);
      
      // שמור בcache
      setCachedData('compare_data', finalData);
      
      console.log('✅ כל הנתונים נטענו בהצלחה');
      
    } catch (err) {
      console.error('Error fetching data:', err);
      
      // נסה נתונים שמורים
      const cachedData = getCachedData('compare_data');
      if (cachedData) {
        const ageHours = (Date.now() - cachedData.timestamp) / (1000 * 60 * 60);
        setProducts(cachedData.data.products || []);
        setRetailers(cachedData.data.retailers || []);
        setPriceReports(cachedData.data.prices || []);
        setShowOfflineData(true);
        setError(`שגיאה בטעינה - מציג נתונים שמורים (${Math.round(ageHours)} שעות)`);
      } else {
        setError(err instanceof Error ? err.message : 'שגיאה בטעינת הנתונים');
      }
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  const getPriceColor = (price: number, productId: number): string => {
    const latestPrices = getLatestPricePerRetailer(productId);
    if (latestPrices.length === 0) return 'bg-gray-100';
    
    const prices = latestPrices.map(p => 
      p.sale_price && p.sale_price < p.regular_price ? p.sale_price : p.regular_price
    );
    
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    if (price <= minPrice + (avgPrice - minPrice) * 0.3) {
      return 'bg-green-200 text-green-800'; // זול
    } else if (price >= maxPrice - (maxPrice - avgPrice) * 0.3) {
      return 'bg-red-200 text-red-800'; // יקר
    }
    return 'bg-yellow-100 text-yellow-800'; // ממוצע
  };

  const filteredProducts = products.filter(product => 
    selectedCategory === 'all' || product.category === selectedCategory
  );

  const categories = [...new Set(products.map(p => p.category))].filter(Boolean);

  const handleRetry = () => {
    setLoading(true);
    fetchData(true);
  };

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
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6 bg-white rounded-lg shadow-lg">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">שגיאה בטעינת נתונים</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <ServerStatusIndicator />
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
            <strong>הסבר:</strong> השרת ב-Render Free Tier "נרדם" לאחר 15 דקות חוסר פעילות. 
            המערכת מנסה להעיר אותו אוטומטית, אנא המתן או נסה שוב.
          </div>
          <button
            onClick={handleRetry}
            disabled={loading}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin inline mr-2" /> : null}
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-4">טוען נתוני השוואה...</div>
          <ServerStatusIndicator />
          {retrying && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800">
              ⏳ מנסה להעיר את השרת... זה עלול לקחת עד דקה
            </div>
          )}
        </div>
      </div>
    );
  }

  // במובייל - הצג כרטיסים במקום טבלה
  if (isMobile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">השוואת מחירי בשר</h1>
          <p className="text-gray-600 mb-6">
            השווה מחירים בין {retailers.length} קמעונאים ו-{filteredProducts.length} מוצרים
          </p>

          {/* פילטרים */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">קטגוריה</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="all">כל הקטגוריות</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={() => fetchData(true)}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              רענן נתונים
            </button>
          </div>

          {/* מקרא צבעים */}
          <div className="grid grid-cols-2 gap-2 mb-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-200 border"></div>
              <span>מחיר זול</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 border"></div>
              <span>מחיר ממוצע</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-200 border"></div>
              <span>מחיר יקר</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border"></div>
              <span>אין מידע</span>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {filteredProducts.map((product) => {
            const latestPrices = getLatestPricePerRetailer(product.id);
            const sortedPrices = sortPricesByPrice(latestPrices);
            
            return (
              <div key={product.id} className="bg-white rounded-lg shadow-md border overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b">
                  <h3 className="text-xl font-semibold">{product.name}</h3>
                  <p className="text-gray-600">{product.category}</p>
                  {sortedPrices.length > 0 && (
                    <div className="mt-2 flex items-center gap-4">
                      <span className="text-sm text-green-600">
                        💰 הזול ביותר: {formatPrice(
                          sortedPrices[0].sale_price && sortedPrices[0].sale_price < sortedPrices[0].regular_price 
                            ? sortedPrices[0].sale_price 
                            : sortedPrices[0].regular_price
                        )}
                      </span>
                      <span className="text-sm text-gray-500">
                        ב{getRetailerName(sortedPrices[0].retailer_id)}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="p-6">
                  {sortedPrices.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      אין דיווחי מחיר עדכניים עבור מוצר זה
                    </p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {sortedPrices.map((price) => (
                        <div key={`${price.retailer_id}-${price.id}`} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">
                              {getRetailerName(price.retailer_id)}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {new Date(price.reported_at).toLocaleDateString('he-IL')}
                            </span>
                          </div>
                          
                          <div className="space-y-1">
                            {price.sale_price && price.sale_price < price.regular_price ? (
                              <>
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold text-red-600">
                                    {formatPrice(price.sale_price)}
                                  </span>
                                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                                    מבצע
                                  </span>
                                </div>
                                <div className="text-sm text-gray-500 line-through">
                                  {formatPrice(price.regular_price)}
                                </div>
                              </>
                            ) : (
                              <div className="text-lg font-bold text-gray-900">
                                {formatPrice(price.regular_price)}
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {price.likes_count} אהבו זאת
                            </span>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              עדכני
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* סטטיסטיקות */}
        <div className="mt-8 grid grid-cols-1 gap-4">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="font-bold text-lg mb-2">סה"כ מוצרים</h3>
            <p className="text-3xl font-bold text-blue-600">{filteredProducts.length}</p>
          </div>
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="font-bold text-lg mb-2">סה"כ קמעונאים</h3>
            <p className="text-3xl font-bold text-green-600">{retailers.length}</p>
          </div>
          <div className="bg-purple-50 p-6 rounded-lg">
            <h3 className="font-bold text-lg mb-2">סה"כ מחירים</h3>
            <p className="text-3xl font-bold text-purple-600">{priceReports.length}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">השוואת מחירי בשר</h1>
        <p className="text-gray-600 mb-6">
          השווה מחירים בין {retailers.length} קמעונאים ו-{filteredProducts.length} מוצרים
        </p>

        {/* פילטרים */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">קטגוריה</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border rounded-lg px-3 py-2"
            >
              <option value="all">כל הקטגוריות</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">מיון</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'avgPrice')}
              className="border rounded-lg px-3 py-2"
            >
              <option value="name">לפי שם</option>
              <option value="avgPrice">לפי מחיר ממוצע</option>
            </select>
          </div>
          
          <button
            onClick={() => fetchData(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mt-6"
          >
            רענן נתונים
          </button>
        </div>

        {showOfflineData && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <WifiOff className="w-4 h-4" />
              <span className="font-medium">מציג נתונים שמורים</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              הנתונים המוצגים נשמרו מהחיבור האחרון לשרת
            </p>
          </div>
        )}
      </div>

      {/* תצוגת מוצרים עם מחירים עדכניים */}
      <div className="space-y-8">
        {filteredProducts.map((product) => {
          const latestPrices = getLatestPricePerRetailer(product.id);
          const sortedPrices = sortPricesByPrice(latestPrices);
          
          return (
            <div key={product.id} className="bg-white rounded-lg shadow-md border overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b">
                <h3 className="text-xl font-semibold">{product.name}</h3>
                <p className="text-gray-600">{product.category}</p>
                {sortedPrices.length > 0 && (
                  <div className="mt-2 flex items-center gap-4">
                    <span className="text-sm text-green-600">
                      💰 הזול ביותר: {formatPrice(
                        sortedPrices[0].sale_price && sortedPrices[0].sale_price < sortedPrices[0].regular_price 
                          ? sortedPrices[0].sale_price 
                          : sortedPrices[0].regular_price
                      )}
                    </span>
                    <span className="text-sm text-gray-500">
                      ב{getRetailerName(sortedPrices[0].retailer_id)}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="p-6">
                {sortedPrices.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    אין דיווחי מחיר עדכניים עבור מוצר זה
                  </p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {sortedPrices.map((price) => (
                      <div key={`${price.retailer_id}-${price.id}`} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">
                            {getRetailerName(price.retailer_id)}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {new Date(price.reported_at).toLocaleDateString('he-IL')}
                          </span>
                        </div>
                        
                        <div className="space-y-1 mb-3">
                          {price.sale_price && price.sale_price < price.regular_price ? (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="text-xl font-bold text-red-600">
                                  {formatPrice(price.sale_price)}
                                </span>
                                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                                  מבצע
                                </span>
                              </div>
                              <div className="text-sm text-gray-500 line-through">
                                {formatPrice(price.regular_price)}
                              </div>
                            </>
                          ) : (
                            <div className="text-xl font-bold text-gray-900">
                              {formatPrice(price.regular_price)}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {price.likes_count} אהבו זאת
                          </span>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            עדכני
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* סטטיסטיקות */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="font-bold text-lg mb-2">סה"כ מוצרים</h3>
          <p className="text-3xl font-bold text-blue-600">{filteredProducts.length}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="font-bold text-lg mb-2">סה"כ קמעונאים</h3>
          <p className="text-3xl font-bold text-green-600">{retailers.length}</p>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg">
          <h3 className="font-bold text-lg mb-2">סה"כ מחירים</h3>
          <p className="text-3xl font-bold text-purple-600">{priceReports.length}</p>
        </div>
      </div>
    </div>
  );
}