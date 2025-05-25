// src/app/report-price/page.tsx
"use client";

import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Product {
  id: number;
  name: string;
  brand?: string | null;
}

interface Retailer {
  id: number;
  name: string;
}

export default function ReportPricePage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [retailers, setRetailers] = useState<Retailer[]>([]);

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedRetailerId, setSelectedRetailerId] = useState<string>('');
  const [regularPrice, setRegularPrice] = useState<string>('');
  const [salePrice, setSalePrice] = useState<string>('');
  const [isOnSale, setIsOnSale] = useState<boolean>(false);
  const [unitForPrice, setUnitForPrice] = useState<string>('kg');
  const [quantityForPrice, setQuantityForPrice] = useState<string>('1');
  const [notes, setNotes] = useState<string>('');
  
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [initialDataLoading, setInitialDataLoading] = useState<boolean>(true);


  useEffect(() => {
    const productIdFromQuery = searchParams.get('productId');
    if (productIdFromQuery) {
      setSelectedProductId(productIdFromQuery);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/report-price${selectedProductId ? `?productId=${selectedProductId}&productName=${encodeURIComponent(searchParams.get('productName') || '')}` : ''}`);
    }
  }, [user, authLoading, router, selectedProductId, searchParams]);

  useEffect(() => {
    if (user) { 
      const fetchData = async () => {
        setInitialDataLoading(true);
        setMessage('');
        try {
          const productsPromise = fetch('https://automatic-space-pancake-gr4rjjxpxg5fwj6w-3000.app.github.dev/api/products?limit=1000')
            .then(res => {
              if (!res.ok) throw new Error(`Failed to fetch products: ${res.statusText}`);
              return res.json();
            });
          const retailersPromise = fetch('https://automatic-space-pancake-gr4rjjxpxg5fwj6w-3000.app.github.dev/api/retailers?limit=1000')
            .then(res => {
              if (!res.ok) throw new Error(`Failed to fetch retailers: ${res.statusText}`);
              return res.json();
            });

          const [productsData, retailersData] = await Promise.all([productsPromise, retailersPromise]);

          setProducts(productsData.data || []);
          setRetailers(retailersData.data || []);
        } catch (error: any) {
          console.error("Failed to fetch products/retailers:", error);
          setMessage(`שגיאה בטעינת נתונים לטופס: ${error.message}`);
        } finally {
          setInitialDataLoading(false);
        }
      };
      fetchData();
    } else {
        setInitialDataLoading(false); // If no user, no need to load products/retailers for the form
    }
  }, [user]); // Rerun if user changes

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setMessage("אינך מחובר. אנא התחבר כדי לדווח על מחיר.");
      setIsSubmitting(false); // Ensure button is re-enabled
      return;
    }
    if (!selectedProductId || !selectedRetailerId || !regularPrice) {
      setMessage("אנא מלא את כל שדות החובה (מוצר, קמעונאי, מחיר רגיל).");
      setIsSubmitting(false);
      return;
    }
    if (isOnSale && !salePrice) {
        setMessage("כאשר 'מוצר במבצע' מסומן, חובה להזין מחיר מבצע.");
        setIsSubmitting(false);
        return;
    }


    setIsSubmitting(true);
    setMessage('');

    const reportData = {
      product_id: parseInt(selectedProductId),
      retailer_id: parseInt(selectedRetailerId),
      regular_price: parseFloat(regularPrice),
      sale_price: salePrice && isOnSale ? parseFloat(salePrice) : null, // Send sale_price only if on sale
      is_on_sale: isOnSale,
      unit_for_price: unitForPrice,
      quantity_for_price: parseFloat(quantityForPrice),
      source: 'user_report', 
      report_type: 'community', 
      notes: notes || null,
      // status will default to 'approved' on the backend if not sent
    };

    const apiUrl = 'https://automatic-space-pancake-gr4rjjxpxg5fwj6w-3000.app.github.dev/api/prices';
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(reportData),
      });

      const responseData = await response.json();

      if (response.ok) { // 200 or 201
        const successMsg = response.status === 201 ? 'הדיווח נוצר ונשלח בהצלחה! תודה רבה.' : 'הדיווח עודכן בהצלחה! תודה רבה.';
        setMessage(successMsg);
        
        // Optional: Reset form after successful submission
        // setSelectedProductId(''); // Keep product if they want to report another price for it
        // setSelectedRetailerId(''); // Or clear this one
        setRegularPrice('');
        setSalePrice('');
        setIsOnSale(false);
        // setUnitForPrice('kg');
        // setQuantityForPrice('1');
        // setNotes('');

        // Navigate back to the product page after a short delay
        setTimeout(() => {
            if(selectedProductId) {
                router.push(`/products/${selectedProductId}`);
            } else {
                router.push('/products'); // Fallback
            }
        }, 2000);

      } else {
        setMessage(responseData.error || 'אירעה שגיאה בשליחת הדיווח.');
      }
    } catch (error: any) {
      console.error("Failed to submit price report:", error);
      setMessage(`שגיאת רשת בשליחת הדיווח: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || initialDataLoading) {
    return <div className="text-center py-10">טוען נתונים...</div>;
  }
  
  if (!user && !authLoading) { 
    return (
      <div className="text-center py-10">
        <p className="text-xl text-slate-700 mb-4">עליך להתחבר כדי לדווח על מחיר.</p>
        <Link href={`/login?redirect=/report-price${selectedProductId ? `?productId=${selectedProductId}&productName=${encodeURIComponent(searchParams.get('productName') || '')}` : ''}`} className="text-sky-600 hover:text-sky-700 font-semibold">
          עבור לדף ההתחברות
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 sm:p-8 bg-white rounded-lg shadow-xl">
      <h1 className="text-2xl sm:text-3xl font-bold text-center text-slate-700 mb-8">דיווח על מחיר חדש</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="product" className="block text-sm font-medium text-slate-700">
            בחר מוצר <span className="text-red-500">*</span>
          </label>
          <select
            id="product"
            name="product_id" // Good practice for forms
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            required
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md"
          >
            <option value="" disabled>
              {searchParams.get('productName') && selectedProductId ? decodeURIComponent(searchParams.get('productName')!) : '-- בחר מוצר --'}
            </option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name} {p.brand ? `(${p.brand})` : ''}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="retailer" className="block text-sm font-medium text-slate-700">
            בחר קמעונאי <span className="text-red-500">*</span>
          </label>
          <select
            id="retailer"
            name="retailer_id"
            value={selectedRetailerId}
            onChange={(e) => setSelectedRetailerId(e.target.value)}
            required
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md"
          >
            <option value="" disabled>-- בחר קמעונאי --</option>
            {retailers.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="regularPrice" className="block text-sm font-medium text-slate-700">
            מחיר רגיל (₪) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="regularPrice"
            name="regular_price"
            value={regularPrice}
            onChange={(e) => setRegularPrice(e.target.value)}
            required
            step="0.01"
            min="0.01" // Price should be positive
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>
        
        <div className="flex items-center">
          <input
            id="isOnSale"
            name="is_on_sale"
            type="checkbox"
            checked={isOnSale}
            onChange={(e) => {
                setIsOnSale(e.target.checked);
                if (!e.target.checked) { // If unchecked, clear sale price
                    setSalePrice('');
                }
            }}
            className="h-4 w-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
          />
          <label htmlFor="isOnSale" className="ml-2 block text-sm text-slate-900 rtl:mr-2 rtl:ml-0">
            מוצר זה במבצע?
          </label>
        </div>

        {isOnSale && (
          <div>
            <label htmlFor="salePrice" className="block text-sm font-medium text-slate-700">
              מחיר מבצע (₪) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="salePrice"
              name="sale_price"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              required={isOnSale}
              step="0.01"
              min="0.01" // Price should be positive
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="unitForPrice" className="block text-sm font-medium text-slate-700">
              יחידת מידה למחיר <span className="text-red-500">*</span>
            </label>
            <select
              id="unitForPrice"
              name="unit_for_price"
              value={unitForPrice}
              onChange={(e) => setUnitForPrice(e.target.value)}
              required
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md"
            >
              <option value="kg">ק"ג (kg)</option>
              <option value="100g">100 גרם (100g)</option>
              <option value="g">גרם (g)</option>
              <option value="unit">יחידה (unit)</option>
              <option value="package">מארז (package)</option>
            </select>
          </div>
          <div>
            <label htmlFor="quantityForPrice" className="block text-sm font-medium text-slate-700">
              כמות עבור המחיר <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="quantityForPrice"
              name="quantity_for_price"
              value={quantityForPrice}
              onChange={(e) => setQuantityForPrice(e.target.value)}
              required
              step="0.01" // Allow for fractions like 0.5 kg
              min="0.01" 
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-slate-700">
            הערות (אופציונלי)
          </label>
          <textarea
            id="notes"
            name="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>

        {message && (
          <p className={`text-sm p-3 rounded-md ${message.includes('בהצלחה') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || authLoading || !user || initialDataLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50"
        >
          {isSubmitting ? 'שולח דיווח...' : 'שלח דיווח'}
        </button>
      </form>
    </div>
  );
}