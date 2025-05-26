// src/app/report-price/page.tsx
"use client";

import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ProductAutocomplete from '@/components/ProductAutocomplete';
import RetailerAutocomplete from '@/components/RetailerAutocomplete';


export default function ReportPricePage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Note: Products and retailers are now loaded via Autocomplete components

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedRetailerId, setSelectedRetailerId] = useState<string>('');
  const [productSearchValue, setProductSearchValue] = useState<string>('');
  const [retailerSearchValue, setRetailerSearchValue] = useState<string>('');
  const [regularPrice, setRegularPrice] = useState<string>('');
  const [salePrice, setSalePrice] = useState<string>('');
  const [isOnSale, setIsOnSale] = useState<boolean>(false);
  const [unitForPrice, setUnitForPrice] = useState<string>('kg');
  const [quantityForPrice, setQuantityForPrice] = useState<string>('1');
  const [notes, setNotes] = useState<string>('');
  
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [initialDataLoading, setInitialDataLoading] = useState<boolean>(true);
  const [requestMessage, setRequestMessage] = useState<string>('');


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
    // No need to pre-load all products/retailers - they're loaded via Autocomplete
    setInitialDataLoading(false);
  }, [user]);

  // Handle new product request
  const handleNewProductRequest = async (productName: string) => {
    if (!token) {
      setRequestMessage("אינך מחובר. אנא התחבר כדי לבקש מוצר חדש.");
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/requests/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: productName,
          description: `מוצר שנבקש על ידי משתמש בדף דיווח מחיר`
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setRequestMessage(`בקשה למוצר "${productName}" נשלחה בהצלחה! היא תיבדק על ידי מנהל המערכת.`);
        setTimeout(() => setRequestMessage(''), 5000);
      } else {
        setRequestMessage(data.error || 'שגיאה בשליחת בקשת המוצר');
      }
    } catch (error) {
      console.error('Error requesting new product:', error);
      setRequestMessage('שגיאת רשת בשליחת בקשת המוצר');
    }
  };

  // Handle new retailer request
  const handleNewRetailerRequest = async (retailerName: string) => {
    if (!token) {
      setRequestMessage("אינך מחובר. אנא התחבר כדי לבקש קמעונאי חדש.");
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/requests/retailers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: retailerName,
          type: 'אחר', // Default type
          description: `קמעונאי שנבקש על ידי משתמש בדף דיווח מחיר`
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setRequestMessage(`בקשה לקמעונאי "${retailerName}" נשלחה בהצלחה! היא תיבדק על ידי מנהל המערכת.`);
        setTimeout(() => setRequestMessage(''), 5000);
      } else {
        setRequestMessage(data.error || 'שגיאה בשליחת בקשת הקמעונאי');
      }
    } catch (error) {
      console.error('Error requesting new retailer:', error);
      setRequestMessage('שגיאת רשת בשליחת בקשת הקמעונאי');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setMessage("אינך מחובר. אנא התחבר כדי לדווח על מחיר.");
      setIsSubmitting(false); // Ensure button is re-enabled
      return;
    }
    if (!selectedProductId) {
      setMessage("אנא בחר מוצר תקין מהרשימה. אם המוצר לא קיים, ניתן להוסיף אותו דרך דף הניהול.");
      setIsSubmitting(false);
      return;
    }
    if (!selectedRetailerId) {
      setMessage("אנא בחר קמעונאי תקין מהרשימה. אם הקמעונאי לא קיים, ניתן להוסיף אותו דרך דף הניהול.");
      setIsSubmitting(false);
      return;
    }
    if (!regularPrice) {
      setMessage("אנא הזן מחיר רגיל.");
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

    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/prices`;
    
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
    } catch (error: unknown) {
      console.error("Failed to submit price report:", error);
      setMessage(`שגיאת רשת בשליחת הדיווח: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`);
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
          <ProductAutocomplete
            placeholder="התחל להקליד שם המוצר..."
            value={productSearchValue}
            selectedProductId={selectedProductId}
            onChange={(value, product) => {
              setProductSearchValue(value);
              if (product) {
                setSelectedProductId(product.id.toString());
              } else if (!value.trim()) {
                setSelectedProductId('');
              }
            }}
            onProductSelect={(product) => {
              setSelectedProductId(product.id.toString());
            }}
            onNewProductRequest={handleNewProductRequest}
            allowNewRequests={true}
            className="mt-1"
            required={true}
            name="product_id"
            id="product"
          />
        </div>

        <div>
          <label htmlFor="retailer" className="block text-sm font-medium text-slate-700">
            בחר קמעונאי <span className="text-red-500">*</span>
          </label>
          <RetailerAutocomplete
            placeholder="התחל להקליד שם הקמעונאי..."
            value={retailerSearchValue}
            selectedRetailerId={selectedRetailerId}
            onChange={(value, retailer) => {
              setRetailerSearchValue(value);
              if (retailer) {
                setSelectedRetailerId(retailer.id.toString());
              } else if (!value.trim()) {
                setSelectedRetailerId('');
              }
            }}
            onRetailerSelect={(retailer) => {
              setSelectedRetailerId(retailer.id.toString());
            }}
            onNewRetailerRequest={handleNewRetailerRequest}
            allowNewRequests={true}
            className="mt-1"
            required={true}
            name="retailer_id"
            id="retailer"
          />
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

        {requestMessage && (
          <p className={`text-sm p-3 rounded-md ${requestMessage.includes('בהצלחה') ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
            {requestMessage}
          </p>
        )}

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