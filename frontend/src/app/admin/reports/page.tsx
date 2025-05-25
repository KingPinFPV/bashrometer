// src/app/admin/reports/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link'; // נשאיר למקרה שנרצה להוסיף קישורים
import { useAuth } from '@/contexts/AuthContext';
import AdminPagination from '@/components/AdminPagination'; 

// ממשק לדיווח מחיר כפי שהוא מגיע מה-API
interface PriceReport {
  id: number;
  product_id: number;
  product_name: string;
  retailer_id: number;
  retailer_name: string;
  user_id: number | null;
  reporting_user_name: string | null;
  reporting_user_email: string | null;
  price_submission_date: string;
  regular_price: string | number; 
  sale_price: string | number | null;
  is_on_sale: boolean;
  unit_for_price: string;
  quantity_for_price: number;
  status: string;
  notes: string | null;
  created_at: string;
  likes_count?: number;
  current_user_liked?: boolean;
}

interface ApiReportsResponse {
  data: PriceReport[];
  page_info?: {
    total_items?: number;
    limit?: number;
    offset?: number;
    current_page_count?: number;
    total_pages?: number;
  };
}

export default function AdminPriceReportsPage() {
  console.log("AdminPriceReportsPage.tsx - RENDERING - V8 (With Search Support)");

  const { token, user, isLoading: authIsLoading } = useAuth();
  const [reports, setReports] = useState<PriceReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('pending_approval'); 
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<Record<number, boolean>>({});

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const ITEMS_PER_PAGE = 15; 

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      if (currentPage !== 1) { 
          setCurrentPage(1); 
      }
    }, 500); 
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchAdminPriceReports = useCallback(async (pageToFetch = 1, currentSearchTerm = debouncedSearchTerm, currentFilterStatus = filterStatus) => {
    if (!token || !user || user.role !== 'admin') {
      setError("אין לך הרשאה לצפות בדף זה או שאינך מחובר.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const offset = (pageToFetch - 1) * ITEMS_PER_PAGE;
    let apiUrl = `https://automatic-space-pancake-gr4rjjxpxg5fwj6w-3000.app.github.dev/api/prices?limit=${ITEMS_PER_PAGE}&offset=${offset}&sort_by=pr.created_at&order=DESC`;
    
    if (currentFilterStatus !== 'all') {
      apiUrl += `&status=${currentFilterStatus}`;
    }
    
    // הוספת תמיכה בחיפוש טקסטואלי - עכשיו ה-API תומך בזה!
    if (currentSearchTerm.trim() !== '') {
      apiUrl += `&search=${encodeURIComponent(currentSearchTerm.trim())}`;
    }
    
    console.log("fetchAdminPriceReports: Fetching from URL:", apiUrl);

    try {
      const response = await fetch(apiUrl, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to parse error JSON" }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data: ApiReportsResponse = await response.json();
      setReports(data.data || []);
      if (data.page_info && data.page_info.total_items !== undefined && data.page_info.limit !== undefined) {
        const calculatedTotalPages = Math.ceil(data.page_info.total_items / data.page_info.limit);
        setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 0);
      } else { setTotalPages(0); }
      setCurrentPage(pageToFetch);

    } catch (e: any) {
      console.error("Failed to fetch admin price reports:", e);
      setError(e.message || 'Failed to load price reports.');
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  }, [token, user, ITEMS_PER_PAGE, debouncedSearchTerm, filterStatus]); 

  useEffect(() => {
    if (!authIsLoading) { 
      if (user && token) { 
          fetchAdminPriceReports(currentPage, debouncedSearchTerm, filterStatus); 
      } else {
          setError("יש להתחבר כאדמין כדי לצפות בדף זה.");
          setIsLoading(false); 
      }
    }
  }, [authIsLoading, user, token, currentPage, debouncedSearchTerm, filterStatus, fetchAdminPriceReports]); 

  useEffect(() => {
    if (!authIsLoading && user && token) { 
        if (currentPage !== 1) {
            setCurrentPage(1);
        } else {
            fetchAdminPriceReports(1, debouncedSearchTerm, filterStatus); // קריאה מפורשת אם כבר בדף 1
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [debouncedSearchTerm, filterStatus]); // הוספתי את התלויות שהיו חסרות כאן


  const handleUpdateStatus = async (reportId: number, newStatus: string) => {
    if (!token || !user || user.role !== 'admin') { 
      setError("אין לך הרשאה לבצע פעולה זו.");
      return; 
    }
    setActionMessage(null);
    setIsUpdatingStatus(prev => ({ ...prev, [reportId]: true }));
    const apiUrl = `https://automatic-space-pancake-gr4rjjxpxg5fwj6w-3000.app.github.dev/api/prices/${reportId}/status`;
    try {
      const response = await fetch(apiUrl, {
        method: 'PUT', 
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        const updatedReportData: PriceReport = await response.json();
        setActionMessage(`סטטוס דיווח ${reportId} עודכן ל: ${statusDisplayNames[newStatus] || newStatus}`);
        if (filterStatus === 'all' || filterStatus === newStatus) {
             setReports(prevReports => 
              prevReports.map(report => 
                report.id === reportId ? { ...report, status: updatedReportData.status } : report
              )
            );
        } else {
            fetchAdminPriceReports(currentPage, debouncedSearchTerm, filterStatus); 
        }
      } else { 
        const errorData = await response.json().catch(() => ({ error: "Failed to parse error JSON" }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
    } catch (e: any) { 
      console.error("Failed to update report status:", e);
      setActionMessage(`שגיאה בעדכון סטטוס: ${e.message}`);
    } 
    finally { 
      setIsUpdatingStatus(prev => ({ ...prev, [reportId]: false })); 
    }
  };
  
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && (totalPages === 0 || newPage <= totalPages) && newPage !== currentPage) {
      setCurrentPage(newPage);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setCurrentPage(1);
  };

  const statusOptions = ['all', 'pending_approval', 'approved', 'rejected', 'expired', 'edited'];
  const statusDisplayNames: Record<string, string> = {
    pending_approval: 'ממתין לאישור', 
    approved: 'מאושר', 
    rejected: 'נדחה',
    expired: 'פג תוקף', 
    edited: 'נערך', 
    all: 'הכל'
  };

  const formatPrice = (price: string | number | null | undefined): string => {
    if (price === null || price === undefined) return 'N/A';
    const numPrice = parseFloat(String(price));
    if (isNaN(numPrice)) return 'N/A';
    return `₪${numPrice.toFixed(2)}`;
  };

  if (authIsLoading || (isLoading && reports.length === 0 && currentPage === 1 && !debouncedSearchTerm && filterStatus === 'pending_approval')) {
    return <div className="text-center py-10">טוען נתונים...</div>;
  }
  if (error) {
    return <div className="text-center py-10 text-red-600">שגיאה: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-slate-800">ניהול דיווחי מחירים</h1>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="חפש מוצר, קמעונאי או מדווח..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 pr-10 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm w-full"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="נקה חיפוש"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <div className="w-full sm:w-auto">
            <select 
              id="statusFilter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-slate-300 rounded-md p-2 text-sm focus:ring-sky-500 focus:border-sky-500 w-full"
            >
              {statusOptions.map(statusVal => (
                <option key={statusVal} value={statusVal}>{statusDisplayNames[statusVal] || statusVal}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* הצגת מספר תוצאות ומידע על החיפוש */}
      {(debouncedSearchTerm || filterStatus !== 'all') && reports.length > 0 && (
        <div className="mb-4 text-sm text-gray-600">
          נמצאו {reports.length} דיווחים
          {debouncedSearchTerm && ` עבור החיפוש "${debouncedSearchTerm}"`}
          {filterStatus !== 'all' && ` בסטטוס ${statusDisplayNames[filterStatus]}`}
        </div>
      )}

      {actionMessage && (
        <div className={`p-4 mb-4 text-sm rounded-md ${
          actionMessage.includes('בהצלחה') || actionMessage.includes('עודכן') 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {actionMessage}
        </div>
      )}

      {/* --- מבנה תנאי מתוקן להצגת הטבלה או הודעות --- */}
      {!isLoading && reports.length === 0 && !error ? (
        <div className="text-center py-10">
          <p className="text-slate-600">
            {debouncedSearchTerm || filterStatus !== 'all' 
              ? `לא נמצאו דיווחים התואמים לחיפוש/סינון.` 
              : "לא נמצאו דיווחי מחירים במערכת."}
          </p>
          {debouncedSearchTerm && (
            <button
              onClick={handleClearSearch}
              className="mt-4 text-sky-600 hover:text-sky-800"
            >
              נקה חיפוש
            </button>
          )}
        </div>
      ) : reports.length > 0 ? ( 
        <>
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-3 py-3 text-right text-xs font-medium text-slate-500 uppercase">ID</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-slate-500 uppercase">מוצר</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-slate-500 uppercase">קמעונאי</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-slate-500 uppercase">משתמש מדווח</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-slate-500 uppercase">מחיר</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-slate-500 uppercase">תאריך דיווח</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-slate-500 uppercase">סטטוס נוכחי</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-slate-500 uppercase">פעולות</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50">
                    <td className="px-3 py-4 text-sm text-slate-500">{report.id}</td>
                    <td className="px-3 py-4 text-sm text-slate-900">{report.product_name}</td>
                    <td className="px-3 py-4 text-sm text-slate-500">{report.retailer_name}</td>
                    <td className="px-3 py-4 text-sm text-slate-500" title={report.reporting_user_email || ''}>
                      {report.reporting_user_name || 'אנונימי'}
                    </td>
                    <td className="px-3 py-4 text-sm text-slate-500">
                      {report.is_on_sale && report.sale_price != null ? 
                        (<>
                          <span className="line-through text-slate-400">
                            {formatPrice(report.regular_price)}
                          </span> 
                          <span className="font-bold text-red-600 ml-1 rtl:mr-1">
                            {formatPrice(report.sale_price)}
                          </span>
                        </>) : 
                        formatPrice(report.regular_price)
                      }
                      <span className="text-xs text-slate-400"> ({report.quantity_for_price} {report.unit_for_price})</span>
                    </td>
                    <td className="px-3 py-4 text-sm text-slate-500">
                      {new Date(report.price_submission_date).toLocaleDateString('he-IL')}
                    </td>
                    <td className="px-3 py-4 text-sm text-slate-500">
                      <span className={`px-2 py-1 inline-flex text-xs leading-tight font-semibold rounded-full ${
                          report.status === 'approved' ? 'bg-green-100 text-green-800' :
                          report.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          report.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-slate-100 text-slate-800' 
                      }`}>
                          {statusDisplayNames[report.status] || report.status}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-sm font-medium whitespace-nowrap">
                        {report.status === 'pending_approval' && (
                          <>
                            <button 
                              onClick={() => handleUpdateStatus(report.id, 'approved')} 
                              disabled={isUpdatingStatus[report.id]}
                              className="text-green-600 hover:text-green-800 mr-2 rtl:ml-2 disabled:opacity-50">
                                {isUpdatingStatus[report.id] ? 'מאשר...' : 'אשר'}
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(report.id, 'rejected')} 
                              disabled={isUpdatingStatus[report.id]}
                              className="text-red-600 hover:text-red-800 disabled:opacity-50">
                                {isUpdatingStatus[report.id] ? 'דוחה...' : 'דחה'}
                            </button>
                          </>
                        )}
                        {report.status === 'approved' && (
                           <button 
                             onClick={() => handleUpdateStatus(report.id, 'rejected')} 
                             disabled={isUpdatingStatus[report.id]}
                             className="text-orange-600 hover:text-orange-800 disabled:opacity-50">
                               {isUpdatingStatus[report.id] ? 'מעדכן...' : 'הפוך לנדחה'}
                            </button>
                        )}
                        {report.status === 'rejected' && (
                           <button 
                             onClick={() => handleUpdateStatus(report.id, 'approved')} 
                             disabled={isUpdatingStatus[report.id]}
                             className="text-blue-600 hover:text-blue-800 disabled:opacity-50">
                               {isUpdatingStatus[report.id] ? 'מעדכן...' : 'הפוך למאושר'}
                            </button>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <AdminPagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                onPageChange={handlePageChange} 
              />
            </div>
          )}
        </>
      ) : null} 
      {isLoading && reports.length > 0 && (
        <div className="text-center py-4 text-slate-500">מעדכן רשימת דיווחים...</div>
      )}
    </div>
  );
}