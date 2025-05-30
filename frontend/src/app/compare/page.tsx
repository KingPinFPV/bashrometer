'use client'
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface PriceData {
  productId: number;
  productName: string;
  retailerId: number;
  retailerName: string;
  price: number;
  lastUpdated: string;
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

export default function ComparePage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [priceMatrix, setPriceMatrix] = useState<Map<string, PriceData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'avgPrice'>('name');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    loadComparisonData();
  }, []);

  const loadComparisonData = async () => {
    try {
      setLoading(true);
      
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      
      // טען מוצרים
      const productsRes = await fetch(`${apiBase}/api/products?limit=100`);
      const productsData = await productsRes.json();
      
      // טען קמעונאים
      const retailersRes = await fetch(`${apiBase}/api/retailers?limit=100`);
      const retailersData = await retailersRes.json();
      
      // טען מחירים
      const pricesRes = await fetch(`${apiBase}/api/prices?limit=1000&status=approved`);
      const pricesData = await pricesRes.json();
      
      setProducts(productsData.products || productsData);
      setRetailers(retailersData.retailers || retailersData);
      
      // צור מטריצת מחירים
      const matrix = new Map<string, PriceData>();
      
      if (pricesData.prices || Array.isArray(pricesData)) {
        const prices = pricesData.prices || pricesData;
        prices.forEach((price: any) => {
          const key = `${price.product_id}-${price.retailer_id}`;
          matrix.set(key, {
            productId: price.product_id,
            productName: price.product_name || 'מוצר לא ידוע',
            retailerId: price.retailer_id,
            retailerName: price.retailer_name || 'קמעונאי לא ידוע',
            price: parseFloat(price.regular_price),
            lastUpdated: price.created_at
          });
        });
      }
      
      setPriceMatrix(matrix);
    } catch (error) {
      console.error('Error loading comparison data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPrice = (productId: number, retailerId: number): PriceData | null => {
    return priceMatrix.get(`${productId}-${retailerId}`) || null;
  };

  const getPriceColor = (price: number, productId: number): string => {
    // חשב ממוצע מחירים למוצר
    const productPrices: number[] = [];
    retailers.forEach(retailer => {
      const priceData = getPrice(productId, retailer.id);
      if (priceData) {
        productPrices.push(priceData.price);
      }
    });
    
    if (productPrices.length === 0) return 'bg-gray-100';
    
    const avgPrice = productPrices.reduce((a, b) => a + b, 0) / productPrices.length;
    const minPrice = Math.min(...productPrices);
    const maxPrice = Math.max(...productPrices);
    
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">טוען נתוני השוואה...</div>
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
              onClick={loadComparisonData}
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

        <div className="space-y-4">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold text-lg mb-3">{product.name}</h3>
              <div className="text-xs text-gray-500 mb-3">{product.category}</div>
              <div className="grid grid-cols-2 gap-2">
                {retailers.map(retailer => {
                  const priceData = getPrice(product.id, retailer.id);
                  return (
                    <div 
                      key={retailer.id}
                      className={`p-2 rounded text-sm ${
                        priceData ? getPriceColor(priceData.price, product.id) : 'bg-gray-100'
                      }`}
                    >
                      <div className="font-medium">{retailer.name}</div>
                      {priceData ? (
                        <div className="font-bold">₪{priceData.price.toFixed(2)}</div>
                      ) : (
                        <div className="text-gray-400">אין מידע</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
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
            <p className="text-3xl font-bold text-purple-600">{priceMatrix.size}</p>
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
            onClick={loadComparisonData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mt-6"
          >
            רענן נתונים
          </button>
        </div>

        {/* מקרא צבעים */}
        <div className="flex gap-4 mb-6 text-sm">
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

      {/* טבלת השוואה */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full min-w-[1200px]">
          <thead>
            <tr className="bg-gray-50">
              <th className="sticky right-0 bg-gray-50 px-4 py-3 text-right font-bold border-l">
                מוצר
              </th>
              {retailers.map(retailer => (
                <th key={retailer.id} className="px-2 py-3 text-center min-w-[120px] border-l">
                  <div className="text-sm font-bold">{retailer.name}</div>
                  <div className="text-xs text-gray-500">{retailer.address}</div>
                  {retailer.website && (
                    <a 
                      href={retailer.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      אתר
                    </a>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(product => (
              <tr key={product.id} className="border-b hover:bg-gray-50">
                <td className="sticky right-0 bg-white px-4 py-3 font-medium border-l">
                  <div>{product.name}</div>
                  <div className="text-xs text-gray-500">{product.category}</div>
                </td>
                {retailers.map(retailer => {
                  const priceData = getPrice(product.id, retailer.id);
                  return (
                    <td 
                      key={`${product.id}-${retailer.id}`} 
                      className={`px-2 py-3 text-center border-l ${
                        priceData ? getPriceColor(priceData.price, product.id) : 'bg-gray-100'
                      }`}
                    >
                      {priceData ? (
                        <div>
                          <div className="font-bold">₪{priceData.price.toFixed(2)}</div>
                          <div className="text-xs">
                            {new Date(priceData.lastUpdated).toLocaleDateString('he-IL')}
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-400 text-sm">אין מידע</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
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
          <p className="text-3xl font-bold text-purple-600">{priceMatrix.size}</p>
        </div>
      </div>
    </div>
  );
}