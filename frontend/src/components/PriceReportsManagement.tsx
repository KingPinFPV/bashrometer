// src/components/PriceReportsManagement.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { filterValidReports, safeParseNumber, safeParseString } from '@/lib/typeGuards';
import { 
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Search,
  Filter,
  AlertCircle,
  Heart
} from 'lucide-react';

interface PriceReport {
  id: number;
  product_name: string;
  retailer_name: string;
  user_name?: string;
  regular_price: number;
  sale_price?: number;
  unit_for_price: string;
  quantity_for_price: number;
  is_on_sale: boolean;
  status: string;
  created_at: string;
  likes_count?: number;
  notes?: string;
}

const PriceReportsManagement: React.FC = () => {
  const { token } = useAuth();
  const [reports, setReports] = useState<PriceReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<PriceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

  // Fix hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchReports = async () => {
      if (!token || !mounted) return;

      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/prices`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('שגיאה בטעינת דיווחי המחיר');
        }

        const data = await response.json();
        // Use type guards to validate data
        const validReports = filterValidReports(data.data || []);
        setReports(validReports);

      } catch (err) {
        console.error('Error fetching price reports:', err);
        setError('שגיאה בטעינת דיווחי המחיר');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [token, API_URL, mounted]);

  // Filter reports with null checks
  useEffect(() => {
    if (!reports || reports.length === 0) {
      setFilteredReports([]);
      return;
    }
    
    let filtered = reports.filter(report => {
      // Ensure report and status exist
      if (!report || !report.status) return false;
      return true;
    });

    if (searchTerm) {
      filtered = filtered.filter(report =>
        (report.product_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (report.retailer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (report.user_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status === statusFilter);
    }

    setFilteredReports(filtered);
  }, [reports, searchTerm, statusFilter]);

  const handleStatusUpdate = async (reportId: number, newStatus: 'approved' | 'rejected') => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/prices/${reportId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('שגיאה בעדכון סטטוס הדיווח');
      }

      // Update local state
      setReports(reports.map(report => 
        report.id === reportId 
          ? { ...report, status: newStatus }
          : report
      ));

      alert(`הדיווח ${newStatus === 'approved' ? 'אושר' : 'נדחה'} בהצלחה`);

    } catch (err) {
      console.error('Error updating report status:', err);
      alert('שגיאה בעדכון סטטוס הדיווח');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'לא זמין';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'תאריך לא תקין';
      return date.toLocaleDateString('he', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'תאריך לא תקין';
    }
  };

  const formatPrice = (price: number | string) => {
    const numPrice = safeParseNumber(price);
    return `₪${(numPrice || 0).toFixed(2)}`;
  };

  const getStatusBadge = (status: string) => {
    if (!status) return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        לא זמין
      </span>
    );

    const badges = {
      pending_approval: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'ממתין לאישור' },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'אושר' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'נדחה' }
    };
    
    const badge = badges[status as keyof typeof badges];
    if (!badge) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {status}
        </span>
      );
    }
    
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3 ml-1" />
        {badge.text}
      </span>
    );
  };

  const pendingCount = reports.filter(r => r && r.status === 'pending_approval').length;
  const approvedCount = reports.filter(r => r && r.status === 'approved').length;
  const rejectedCount = reports.filter(r => r && r.status === 'rejected').length;

  // Show loading during hydration
  if (!mounted) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען ממשק ניהול...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען דיווחי מחיר...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <div className="mr-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ניהול דיווחי מחיר</h1>
        <p className="mt-1 text-gray-600">נהל ואשר דיווחי מחיר מהמשתמשים</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{reports.length}</div>
          <div className="text-sm text-gray-600">סה״כ דיווחים</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          <div className="text-sm text-gray-600">ממתינים לאישור</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
          <div className="text-sm text-gray-600">אושרו</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
          <div className="text-sm text-gray-600">נדחו</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="חיפוש לפי שם מוצר או קמעונאי..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">כל הסטטוסים</option>
              <option value="pending_approval">ממתין לאישור</option>
              <option value="approved">אושר</option>
              <option value="rejected">נדחה</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">מוצר</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">קמעונאי</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">מחיר</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">סטטוס</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">תאריך</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">לייקים</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">פעולות</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{safeParseString(report.product_name) || 'לא זמין'}</div>
                    <div className="text-sm text-gray-500">#{report.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {safeParseString(report.retailer_name) || 'לא זמין'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatPrice(report.regular_price)} / {report.unit_for_price || 'יחידה'}
                    </div>
                    {report.is_on_sale && report.sale_price && (
                      <div className="text-sm text-green-600">
                        מבצע: {formatPrice(report.sale_price)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(report.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(report.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Heart className="w-4 h-4 text-red-400 ml-1" />
                      {report.likes_count || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2 space-x-reverse">
                      {report.status === 'pending_approval' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(report.id, 'approved')}
                            className="text-green-600 hover:text-green-900 p-1 rounded"
                            title="אשר דיווח"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(report.id, 'rejected')}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="דחה דיווח"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <a
                        href={`/products/${report.id}`}
                        target="_blank"
                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        title="צפה בפרטים"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReports.length === 0 && (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">לא נמצאו דיווחי מחיר התואמים לחיפוש</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceReportsManagement;