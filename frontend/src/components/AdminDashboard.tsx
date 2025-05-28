// src/components/AdminDashboard.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Package, 
  Store, 
  FileText, 
  Users,
  TrendingUp, 
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Heart,
  AlertCircle
} from 'lucide-react';

interface Stats {
  products: { total: number; change: string; changeType: 'increase' | 'decrease' };
  retailers: { total: number; change: string; changeType: 'increase' | 'decrease' };
  pendingReports: { total: number; change: string; changeType: 'increase' | 'decrease' };
  totalReports: { total: number; change: string; changeType: 'increase' | 'decrease' };
  activeUsers: { total: number; change: string; changeType: 'increase' | 'decrease' };
  approvedToday: { total: number; change: string; changeType: 'increase' | 'decrease' };
}

interface RecentReport {
  id: number;
  product_name: string;
  retailer_name: string;
  regular_price: number;
  unit_for_price: string;
  user_name?: string;
  created_at: string;
  status: string;
  likes_count?: number;
}

const AdminDashboard: React.FC = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) return;

      try {
        setLoading(true);
        
        // Fetch stats in parallel
        const [productsRes, retailersRes, pricesRes] = await Promise.all([
          fetch(`${API_URL}/api/products`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${API_URL}/api/retailers`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${API_URL}/api/prices`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        const [productsData, retailersData, pricesData] = await Promise.all([
          productsRes.ok ? productsRes.json() : { data: [], page_info: { total_items: 0 } },
          retailersRes.ok ? retailersRes.json() : { data: [], page_info: { total_items: 0 } },
          pricesRes.ok ? pricesRes.json() : { data: [] }
        ]);

        // Calculate stats
        const totalProducts = productsData.page_info?.total_items || productsData.data?.length || 0;
        const totalRetailers = retailersData.page_info?.total_items || retailersData.data?.length || 0;
        const allPrices = pricesData.data || [];
        const pendingPrices = allPrices.filter((p: any) => p.status === 'pending_approval');
        const approvedToday = allPrices.filter((p: any) => {
          const today = new Date().toDateString();
          const priceDate = new Date(p.created_at).toDateString();
          return p.status === 'approved' && priceDate === today;
        });

        const calculatedStats: Stats = {
          products: { total: totalProducts, change: '+0', changeType: 'increase' },
          retailers: { total: totalRetailers, change: '+0', changeType: 'increase' },
          pendingReports: { total: pendingPrices.length, change: '+0', changeType: 'decrease' },
          totalReports: { total: allPrices.length, change: '+0', changeType: 'increase' },
          activeUsers: { total: 0, change: '+0', changeType: 'increase' }, // Would need separate endpoint
          approvedToday: { total: approvedToday.length, change: '+0', changeType: 'increase' }
        };

        setStats(calculatedStats);
        
        // Set recent reports (last 5)
        const sortedReports = allPrices
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);
        
        setRecentReports(sortedReports);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('שגיאה בטעינת נתוני הדשבורד');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token, API_URL]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending_approval: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'ממתין' },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'אושר' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'נדחה' }
    };
    
    const badge = badges[status as keyof typeof badges];
    if (!badge) return null;
    
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3 ml-1" />
        {badge.text}
      </span>
    );
  };

  const StatsCard: React.FC<{
    title: string;
    value: number;
    change: string;
    changeType: 'increase' | 'decrease';
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, change, changeType, icon, color }) => (
    <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
      <div className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`inline-flex items-center justify-center p-3 ${color} rounded-md`}>
              {icon}
            </div>
          </div>
          <div className="mr-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
                {change !== '+0' && (
                  <div className={`mr-2 flex items-baseline text-sm font-semibold ${
                    changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendingUp className={`w-4 h-4 ml-1 ${
                      changeType === 'decrease' ? 'transform rotate-180' : ''
                    }`} />
                    {change}
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען נתוני דשבורד...</p>
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

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">דשבורד ראשי</h1>
        <p className="mt-2 text-gray-600">סקירה כללית של מערכת בשרומטר</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="סה״כ מוצרים"
          value={stats.products.total}
          change={stats.products.change}
          changeType={stats.products.changeType}
          icon={<Package className="w-6 h-6 text-white" />}
          color="bg-blue-500"
        />
        <StatsCard
          title="סה״כ קמעונאים"
          value={stats.retailers.total}
          change={stats.retailers.change}
          changeType={stats.retailers.changeType}
          icon={<Store className="w-6 h-6 text-white" />}
          color="bg-green-500"
        />
        <StatsCard
          title="דיווחים ממתינים"
          value={stats.pendingReports.total}
          change={stats.pendingReports.change}
          changeType={stats.pendingReports.changeType}
          icon={<AlertCircle className="w-6 h-6 text-white" />}
          color="bg-yellow-500"
        />
        <StatsCard
          title="סה״כ דיווחים"
          value={stats.totalReports.total}
          change={stats.totalReports.change}
          changeType={stats.totalReports.changeType}
          icon={<FileText className="w-6 h-6 text-white" />}
          color="bg-purple-500"
        />
        <StatsCard
          title="אושרו היום"
          value={stats.approvedToday.total}
          change={stats.approvedToday.change}
          changeType={stats.approvedToday.changeType}
          icon={<CheckCircle className="w-6 h-6 text-white" />}
          color="bg-indigo-500"
        />
      </div>

      {recentReports.length > 0 && (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">דיווחים אחרונים</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">מוצר</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">קמעונאי</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">מחיר</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">סטטוס</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">תאריך</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {report.product_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.retailer_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₪{report.regular_price} / {report.unit_for_price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(report.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(report.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;