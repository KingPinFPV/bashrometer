'use client';

import React, { useState, useEffect } from 'react';
import { StatsCard } from '@/components/ui/StatsCard';
import { PriceTrendChart } from '@/components/analytics/PriceTrendChart';
import { analyticsApi, PriceTrendData, RetailerAnalytics, UserActivityData } from '@/lib/analyticsApi';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  RefreshCw,
  BarChart3,
  Package,
  Store,
  DollarSign
} from 'lucide-react';

export default function AnalyticsPage() {
  const { user, token } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [priceTrends, setPriceTrends] = useState<PriceTrendData[]>([]);
  const [retailers, setRetailers] = useState<RetailerAnalytics[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fix hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (token && user?.role === 'admin' && mounted) {
      fetchAnalyticsData();
    }
  }, [selectedTimeRange, token, user, mounted]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [trendsData, retailersData, activityData] = await Promise.all([
        analyticsApi.getPriceTrends(undefined, selectedTimeRange as any),
        analyticsApi.getRetailerComparison(undefined, selectedTimeRange as any),
        analyticsApi.getUserActivity(selectedTimeRange as any)
      ]);

      setPriceTrends(trendsData);
      setRetailers(retailersData);
      setUserActivity(activityData);
    } catch (error: any) {
      console.error('Error fetching analytics data:', error);
      setError('שגיאה בטעינת נתוני האנליטיקה');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalReports = priceTrends.reduce((sum, item) => sum + (item.report_count || 0), 0);
  const avgPrice = priceTrends.length > 0 ? 
    priceTrends.reduce((sum, item) => sum + (item.average_price || 0), 0) / priceTrends.length : 0;
  const avgNormalizedPrice = priceTrends.length > 0 ? 
    priceTrends.reduce((sum, item) => sum + (item.normalized_price || 0), 0) / priceTrends.length : 0;
  const totalUsers = userActivity.length > 0 ?
    userActivity.reduce((sum, item) => sum + (item.active_users || 0), 0) / userActivity.length : 0;

  // Show loading during hydration
  if (!mounted) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">טוען דף אנליטיקה...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="text-center py-10">
          <p className="text-red-600">אין לך הרשאה לצפות בדף זה</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="p-6">
        <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">אנליטיקה ודוחות</h1>
            <p className="mt-2 text-gray-600">מגמות מחירים, השוואות ופעילות משתמשים</p>
          </div>
          <div className="flex items-center space-x-3 space-x-reverse">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7d">7 ימים אחרונים</option>
              <option value="30d">30 ימים אחרונים</option>
              <option value="90d">90 ימים אחרונים</option>
              <option value="1y">שנה אחרונה</option>
            </select>
            <button
              onClick={fetchAnalyticsData}
              disabled={loading}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
              רענן נתונים
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">טוען נתוני אנליטיקה...</p>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="דיווחים בתקופה"
                value={totalReports}
                change={12.5}
                icon={<BarChart3 className="w-6 h-6 text-white" />}
                color="bg-blue-500"
                subtitle="דיווחי מחיר חדשים"
              />
              <StatsCard
                title="מחיר ממוצע"
                value={`₪${avgPrice.toFixed(2)}`}
                change={-1.8}
                icon={<DollarSign className="w-6 h-6 text-white" />}
                color="bg-green-500"
                subtitle="לק״ג בשר"
              />
              <StatsCard
                title="מחיר מנורמל"
                value={`₪${avgNormalizedPrice.toFixed(2)}`}
                change={-2.4}
                icon={<Package className="w-6 h-6 text-white" />}
                color="bg-purple-500"
                subtitle="ל-100 גרם"
              />
              <StatsCard
                title="קמעונאים פעילים"
                value={retailers.length}
                change={15.2}
                icon={<Store className="w-6 h-6 text-white" />}
                color="bg-orange-500"
                subtitle="רשתות מדווחות"
              />
            </div>

            {/* Price Trends Chart */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">מגמות מחירים</h3>
                <div className="flex items-center space-x-4 space-x-reverse text-sm">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600">מחיר מנורמל (100 גרם)</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <div className="w-3 h-1 bg-green-500"></div>
                    <span className="text-gray-600">מחיר ממוצע</span>
                  </div>
                </div>
              </div>
              {priceTrends.length > 0 ? (
                <PriceTrendChart data={priceTrends} showNormalizedPrice={true} height={400} />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  אין נתונים להצגה בתקופה הנבחרת
                </div>
              )}
            </div>

            {/* Retailer Analytics */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">השוואת קמעונאים</h3>
              {retailers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-right py-3 px-4 font-medium text-gray-700">קמעונאי</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">מחיר ממוצע</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">מספר דיווחים</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">חלק שוק</th>
                      </tr>
                    </thead>
                    <tbody>
                      {retailers.map((retailer, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-3 px-4 font-medium">{retailer.retailer_name}</td>
                          <td className="py-3 px-4">₪{Number(retailer.average_price).toFixed(2)}</td>
                          <td className="py-3 px-4">{retailer.report_count}</td>
                          <td className="py-3 px-4">{Number(retailer.market_share).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  אין נתוני קמעונאים להצגה
                </div>
              )}
            </div>

            {/* User Activity - Only show if there's data */}
            {userActivity.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">פעילות משתמשים יומית</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-right py-3 px-4 font-medium text-gray-700">תאריך</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">דיווחים חדשים</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">משתמשים פעילים</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">לייקים</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userActivity.slice(-7).map((activity, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-3 px-4">
                            {new Date(activity.date).toLocaleDateString('he-IL')}
                          </td>
                          <td className="py-3 px-4">{activity.new_reports}</td>
                          <td className="py-3 px-4">{activity.active_users}</td>
                          <td className="py-3 px-4">{activity.likes_given}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </ErrorBoundary>
  );
}