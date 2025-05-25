// src/app/admin/retailers/edit/[retailerId]/page.tsx
"use client";

import React, { useState, useEffect, FormEvent, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext'; //

// ממשק לנתוני טופס הקמעונאי
interface RetailerFormData {
  name: string;
  chain?: string | null;
  address?: string | null;
  type: string; 
  geo_lat?: number | null;
  geo_lon?: number | null;
  opening_hours?: string | null;
  phone?: string | null;
  website?: string | null;
  notes?: string | null;
  is_active?: boolean;
  // שדות נוספים שניתן לערוך (כמו user_rating, rating_count - אם רלוונטי דרך ממשק זה)
}

// ממשק לקמעונאי כפי שהוא מגיע מה-API (יכול לכלול id, created_at וכו')
interface Retailer extends RetailerFormData {
  id: number;
  user_rating?: number | null; // לדוגמה, אם השרת מחזיר אותם
  rating_count?: number;
}

export default function EditRetailerPage() {
  const { token, user, isLoading: authIsLoading } = useAuth(); //
  const router = useRouter();
  const params = useParams();
  const retailerId = params.retailerId as string;

  const [formData, setFormData] = useState<Partial<RetailerFormData>>({});
  const [originalRetailer, setOriginalRetailer] = useState<Retailer | null>(null);
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchRetailerToEdit = useCallback(async () => {
    if (!retailerId || !token || (user && user.role !== 'admin')) {
      if (user && user.role !== 'admin') setMessage("אין לך הרשאה לערוך קמעונאים.");
      else if (!token) setMessage("אנא התחבר כדי לערוך קמעונאי.");
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setMessage('');
    const apiUrl = `https://automatic-space-pancake-gr4rjjxpxg5fwj6w-3000.app.github.dev/api/retailers/${retailerId}`;

    try {
      const response = await fetch(apiUrl, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to parse retailer data" }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const retailerData: Retailer = await response.json();
      setOriginalRetailer(retailerData);
      setFormData({ // אכלוס הטופס עם הנתונים הקיימים
        name: retailerData.name,
        chain: retailerData.chain,
        address: retailerData.address,
        type: retailerData.type,
        geo_lat: retailerData.geo_lat,
        geo_lon: retailerData.geo_lon,
        opening_hours: retailerData.opening_hours,
        phone: retailerData.phone,
        website: retailerData.website,
        notes: retailerData.notes,
        is_active: retailerData.is_active,
      });
    } catch (error: any) {
      console.error("Failed to fetch retailer for editing:", error);
      setMessage(`שגיאה בטעינת הקמעונאי לעריכה: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [retailerId, token, user]);

  useEffect(() => {
    if (retailerId && !authIsLoading) { // טען רק אם יש retailerId והאימות הסתיים
        if (user && token) {
            fetchRetailerToEdit();
        } else {
            setMessage("יש להתחבר כאדמין כדי לערוך קמעונאי.");
            setIsLoading(false);
        }
    }
  }, [retailerId, authIsLoading, user, token, fetchRetailerToEdit]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value === '' ? null : parseFloat(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || (user && user.role !== 'admin')) {
      setMessage("שגיאה: אין לך הרשאה לבצע פעולה זו.");
      return;
    }
    if (!formData.name?.trim() || !formData.type?.trim()) {
      setMessage("שגיאה: שם קמעונאי וסוג הם שדות חובה.");
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    const apiUrl = `https://automatic-space-pancake-gr4rjjxpxg5fwj6w-3000.app.github.dev/api/retailers/${retailerId}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const responseData: Retailer | { error: string } = await response.json();

      if (response.ok && 'id' in responseData) {
        setMessage(`קמעונאי "${responseData.name}" עודכן בהצלחה!`);
        setOriginalRetailer(responseData as Retailer);
        setTimeout(() => {
          router.push('/admin/retailers');
        }, 1500);
      } else {
        setMessage((responseData as { error: string }).error || 'אירעה שגיאה בעדכון הקמעונאי.');
      }
    } catch (error: any) {
      console.error("Failed to update retailer:", error);
      setMessage(`שגיאת רשת בעדכון הקמעונאי: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const retailerTypes = ['סופרמרקט', 'קצביה', 'מעדניה', 'חנות נוחות', 'אונליין', 'שוק']; // מהסכמה שלך

  if (isLoading || authIsLoading) {
    return <div className="text-center py-10">טוען פרטי קמעונאי לעריכה...</div>;
  }

  if (!originalRetailer && !isLoading && !authIsLoading) { 
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl text-center">
        <h1 className="text-2xl font-bold text-red-700 mb-4">שגיאה</h1>
        <p className="text-slate-600 mb-4">{message || "הקמעונאי המבוקש לא נמצא או שאין לך הרשאה לצפות בו."}</p>
        <Link href="/admin/retailers" className="text-sky-600 hover:text-sky-700">
          &larr; חזרה לרשימת הקמעונאים
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">עריכת קמעונאי: {originalRetailer?.name || ''}</h1>
        <Link href="/admin/retailers" className="text-sky-600 hover:text-sky-700">
          &larr; חזרה לרשימת הקמעונאים
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-lg shadow-md space-y-6">
        {/* שם קמעונאי (שדה חובה) */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700">
            שם הקמעונאי <span className="text-red-500">*</span>
          </label>
          <input type="text" name="name" id="name" value={formData.name || ''} onChange={handleChange} required
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
        </div>

        {/* רשת */}
        <div>
          <label htmlFor="chain" className="block text-sm font-medium text-slate-700">רשת</label>
          <input type="text" name="chain" id="chain" value={formData.chain || ''} onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
        </div>

        {/* סוג (שדה חובה) */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-slate-700">
            סוג קמעונאי <span className="text-red-500">*</span>
          </label>
          <select name="type" id="type" value={formData.type || 'סופרמרקט'} onChange={handleChange} required
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md">
            {retailerTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
        
        {/* כתובת */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-slate-700">כתובת</label>
          <input type="text" name="address" id="address" value={formData.address || ''} onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
        </div>

        {/* קואורדינטות */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="geo_lat" className="block text-sm font-medium text-slate-700">קו רוחב (Lat)</label>
            <input type="number" name="geo_lat" id="geo_lat" value={formData.geo_lat === null || formData.geo_lat === undefined ? '' : formData.geo_lat} onChange={handleChange} step="any"
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="geo_lon" className="block text-sm font-medium text-slate-700">קו אורך (Lon)</label>
            <input type="number" name="geo_lon" id="geo_lon" value={formData.geo_lon === null || formData.geo_lon === undefined ? '' : formData.geo_lon} onChange={handleChange} step="any"
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
          </div>
        </div>

        {/* שעות פתיחה, טלפון, אתר, הערות - בדומה לטופס היצירה */}
        {/* ... הוסף כאן את שאר השדות כפי שהם מופיעים בטופס יצירת קמעונאי ... */}
        <div>
            <label htmlFor="opening_hours" className="block text-sm font-medium text-slate-700">שעות פתיחה</label>
            <input type="text" name="opening_hours" id="opening_hours" value={formData.opening_hours || ''} onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
        </div>
        <div>
            <label htmlFor="phone" className="block text-sm font-medium text-slate-700">טלפון</label>
            <input type="tel" name="phone" id="phone" value={formData.phone || ''} onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
        </div>
        <div>
            <label htmlFor="website" className="block text-sm font-medium text-slate-700">אתר אינטרנט</label>
            <input type="url" name="website" id="website" value={formData.website || ''} onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
        </div>
        <div>
            <label htmlFor="notes" className="block text-sm font-medium text-slate-700">הערות</label>
            <textarea name="notes" id="notes" value={formData.notes || ''} onChange={handleChange} rows={3}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
        </div>
        
        {/* קמעונאי פעיל? */}
        <div className="flex items-center">
          <input type="checkbox" name="is_active" id="is_active" checked={formData.is_active === undefined ? true : formData.is_active} onChange={handleChange}
            className="h-4 w-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500" />
          <label htmlFor="is_active" className="ml-2 block text-sm text-slate-900 rtl:mr-2 rtl:ml-0">קמעונאי פעיל</label>
        </div>

        {message && (
          <p className={`text-sm p-3 rounded-md ${message.includes('בהצלחה') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </p>
        )}

        <div className="pt-2">
          <button type="submit" disabled={isSubmitting || isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50"
          >
            {isSubmitting ? 'מעדכן קמעונאי...' : 'שמור שינויים'}
          </button>
        </div>
      </form>
    </div>
  );
}