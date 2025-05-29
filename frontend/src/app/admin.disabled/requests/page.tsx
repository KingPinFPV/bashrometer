'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ProductRequest {
  id: number;
  name: string;
  brand?: string;
  category?: string;
  description?: string;
  requested_by_username: string;
  created_at: string;
  status: string;
}

interface RetailerRequest {
  id: number;
  name: string;
  type: string;
  chain?: string;
  address?: string;
  requested_by_username: string;
  created_at: string;
  status: string;
}

export default function RequestsPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [productRequests, setProductRequests] = useState<ProductRequest[]>([]);
  const [retailerRequests, setRetailerRequests] = useState<RetailerRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'products' | 'retailers'>('products');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === 'admin' && token) {
      fetchRequests();
    }
  }, [user, token]);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      
      const [productResponse, retailerResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/requests/products/pending`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/requests/retailers/pending`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ]);

      if (!productResponse.ok || !retailerResponse.ok) {
        throw new Error('Failed to fetch requests');
      }

      const productData = await productResponse.json();
      const retailerData = await retailerResponse.json();

      setProductRequests(productData.data || []);
      setRetailerRequests(retailerData.data || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('שגיאה בטעינת הבקשות');
    } finally {
      setIsLoading(false);
    }
  };

  const processRequest = async (type: 'products' | 'retailers', id: number, action: 'approve' | 'reject', adminNotes?: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/requests/${type}/${id}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action,
          admin_notes: adminNotes
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setTimeout(() => setMessage(''), 3000);
        fetchRequests(); // Refresh the list
      } else {
        setError(data.error || 'שגיאה בעיבוד הבקשה');
      }
    } catch (err) {
      console.error('Error processing request:', err);
      setError('שגיאת רשת בעיבוד הבקשה');
    }
  };

  if (authLoading || isLoading) {
    return <div className="text-center py-10">טוען נתונים...</div>;
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center py-10">
        <p className="text-xl text-slate-700 mb-4">גישה למנהלים בלבד</p>
        <Link href="/login" className="text-sky-600 hover:text-sky-700 font-semibold">
          עבור לדף ההתחברות
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6">
      <h1 className="text-3xl font-bold text-center text-slate-700 mb-8">ניהול בקשות מוצרים וקמעונאים</h1>
      
      {message && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg mb-6">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors ${
            activeTab === 'products'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          בקשות מוצרים ({productRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('retailers')}
          className={`flex-1 py-2 px-4 rounded-md font-medium text-sm transition-colors ${
            activeTab === 'retailers'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          בקשות קמעונאים ({retailerRequests.length})
        </button>
      </div>

      {/* Product Requests */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {productRequests.length === 0 ? (
            <p className="text-center text-slate-500 py-8">אין בקשות מוצרים ממתינות</p>
          ) : (
            productRequests.map((request) => (
              <div key={request.id} className="bg-white p-6 rounded-lg shadow border">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{request.name}</h3>
                    {request.brand && (
                      <p className="text-slate-600">מותג: {request.brand}</p>
                    )}
                    {request.category && (
                      <p className="text-slate-600">קטגוריה: {request.category}</p>
                    )}
                    {request.description && (
                      <p className="text-slate-600 mt-2">{request.description}</p>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-slate-500">נבקש על ידי: {request.requested_by_username}</p>
                    <p className="text-sm text-slate-500">
                      תאריך: {new Date(request.created_at).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2 rtl:space-x-reverse">
                  <button
                    onClick={() => processRequest('products', request.id, 'approve')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
                  >
                    אשר והוסף למאגר
                  </button>
                  <button
                    onClick={() => processRequest('products', request.id, 'reject')}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
                  >
                    דחה בקשה
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Retailer Requests */}
      {activeTab === 'retailers' && (
        <div className="space-y-4">
          {retailerRequests.length === 0 ? (
            <p className="text-center text-slate-500 py-8">אין בקשות קמעונאים ממתינות</p>
          ) : (
            retailerRequests.map((request) => (
              <div key={request.id} className="bg-white p-6 rounded-lg shadow border">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{request.name}</h3>
                    <p className="text-slate-600">סוג: {request.type}</p>
                    {request.chain && (
                      <p className="text-slate-600">רשת: {request.chain}</p>
                    )}
                    {request.address && (
                      <p className="text-slate-600">כתובת: {request.address}</p>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-slate-500">נבקש על ידי: {request.requested_by_username}</p>
                    <p className="text-sm text-slate-500">
                      תאריך: {new Date(request.created_at).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2 rtl:space-x-reverse">
                  <button
                    onClick={() => processRequest('retailers', request.id, 'approve')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
                  >
                    אשר והוסף למאגר
                  </button>
                  <button
                    onClick={() => processRequest('retailers', request.id, 'reject')}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
                  >
                    דחה בקשה
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}