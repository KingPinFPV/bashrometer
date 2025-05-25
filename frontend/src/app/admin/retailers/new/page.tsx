// src/app/admin/retailers/new/page.tsx
"use client";

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext'; //

// ממשק לנתוני טופס הקמעונאי (התאם לשדות בטבלת retailers)
interface RetailerFormData {
  name: string; // שדה חובה
  chain?: string | null;
  address?: string | null;
  type: string; // שדה חובה (למשל, 'סופרמרקט', 'קצביה')
  geo_lat?: number | null;
  geo_lon?: number | null;
  opening_hours?: string | null;
  phone?: string | null;
  website?: string | null;
  notes?: string | null;
  is_active?: boolean;
}

// ממשק לתשובת ה-API לאחר יצירה מוצלחת
interface CreatedRetailerResponse extends RetailerFormData {
  id: number;
  // הוסף שדות נוספים שהשרת מחזיר אם יש, כמו created_at, updated_at
}

export default function CreateRetailerPage() {
  const { token, user } = useAuth(); //
  const router = useRouter();

  const [formData, setFormData] = useState<RetailerFormData>({
    name: '',
    chain: '',
    address: '',
    type: 'סופרמרקט', // ערך ברירת מחדל
    geo_lat: null,
    geo_lon: null,
    opening_hours: '',
    phone: '',
    website: '',
    notes: '',
    is_active: true,
  });

  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
    if (!formData.name.trim() || !formData.type.trim()) {
      setMessage("שגיאה: שם קמעונאי וסוג הם שדות חובה.");
      return;
    }

    setIsLoading(true);
    setMessage('');
    const apiUrl = 'https://automatic-space-pancake-gr4rjjxpxg5fwj6w-3000.app.github.dev/api/retailers';

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const responseData: CreatedRetailerResponse | { error: string } = await response.json();

      if (response.ok && 'id' in responseData) {
        setMessage(`קמעונאי "${responseData.name}" נוצר בהצלחה! (ID: ${responseData.id})`);
        setFormData({ // איפוס הטופס
          name: '', chain: '', address: '', type: 'סופרמרקט', geo_lat: null, geo_lon: null,
          opening_hours: '', phone: '', website: '', notes: '', is_active: true,
        });
        setTimeout(() => {
          router.push('/admin/retailers');
        }, 2000);
      } else {
        setMessage((responseData as { error: string }).error || 'אירעה שגיאה ביצירת הקמעונאי.');
      }
    } catch (error: any) {
      console.error("Failed to create retailer:", error);
      setMessage(`שגיאת רשת ביצירת הקמעונאי: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // רשימת סוגי קמעונאים (מה-schema.sql שלך)
  const retailerTypes = ['סופרמרקט', 'קצביה', 'מעדניה', 'חנות נוחות', 'אונליין', 'שוק'];

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">הוספת קמעונאי חדש</h1>
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
          <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required
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
          <select name="type" id="type" value={formData.type} onChange={handleChange} required
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

        {/* קואורדינטות (אופציונלי) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="geo_lat" className="block text-sm font-medium text-slate-700">קו רוחב (Lat)</label>
            <input type="number" name="geo_lat" id="geo_lat" value={formData.geo_lat === null ? '' : formData.geo_lat} onChange={handleChange} step="any"
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="geo_lon" className="block text-sm font-medium text-slate-700">קו אורך (Lon)</label>
            <input type="number" name="geo_lon" id="geo_lon" value={formData.geo_lon === null ? '' : formData.geo_lon} onChange={handleChange} step="any"
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
          </div>
        </div>

        {/* שעות פתיחה */}
        <div>
          <label htmlFor="opening_hours" className="block text-sm font-medium text-slate-700">שעות פתיחה</label>
          <input type="text" name="opening_hours" id="opening_hours" value={formData.opening_hours || ''} onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
        </div>

        {/* טלפון */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-slate-700">טלפון</label>
          <input type="tel" name="phone" id="phone" value={formData.phone || ''} onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
        </div>

        {/* אתר אינטרנט */}
        <div>
          <label htmlFor="website" className="block text-sm font-medium text-slate-700">אתר אינטרנט</label>
          <input type="url" name="website" id="website" value={formData.website || ''} onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
        </div>

        {/* הערות */}
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
          <button type="submit" disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50"
          >
            {isLoading ? 'יוצר קמעונאי...' : 'הוסף קמעונאי'}
          </button>
        </div>
      </form>
    </div>
  );
}