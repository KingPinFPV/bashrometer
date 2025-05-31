'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  Package, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  Calendar
} from 'lucide-react';

interface DashboardStats {
  products: {
    approved?: number;
    pending?: number;
    rejected?: number;
  };
  reports: {
    total_reports: number;
    reports_this_week: number;
    reports_today: number;
  };
  users: {
    total_users: number;
    new_users_month: number;
    admin_count: number;
  };
  recentActivity: Array<{
    id: number;
    admin_name: string;
    action_type: string;
    target_type: string;
    target_id: number;
    created_at: string;
    details: any;
  }>;
}

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

  const loadDashboardStats = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/admin/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.dashboard);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardStats();
  }, [token]);

  const getActionDescription = (actionType: string) => {
    switch (actionType) {
      case 'create_product_request': return 'יצר בקשה למוצר חדש';
      case 'approve_product': return 'אישר מוצר';
      case 'reject_product': return 'דחה מוצר';
      case 'update_product': return 'עדכן מוצר';
      case 'create_subtype': return 'יצר תת-סוג חדש';
      case 'update_subtype': return 'עדכן תת-סוג';
      case 'update_user_role': return 'עדכן תפקיד משתמש';
      default: return actionType;
    }
  };

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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">דשבורד מנהל</h1>
        <p className="mt-1 text-gray-600">סקירה כללית של פעילות המערכת</p>
      </div>
      
      {/* Overview Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard 
          title="מוצרים מאושרים"
          value={stats?.products?.approved || 0}
          icon={<CheckCircle className="w-6 h-6 text-green-500" />}
          color="green"
          subtitle="פעילים במערכת"
        />
        <StatsCard 
          title="ממתינים לאישור"
          value={stats?.products?.pending || 0}
          icon={<Clock className="w-6 h-6 text-yellow-500" />}
          color="yellow"
          subtitle="מוצרים חדשים"
        />
        <StatsCard 
          title="דיווחי מחיר השבוע"
          value={stats?.reports?.reports_this_week || 0}
          icon={<TrendingUp className="w-6 h-6 text-blue-500" />}
          color="blue"
          subtitle={`סה"כ ${stats?.reports?.total_reports || 0} דיווחים`}
        />
        <StatsCard 
          title="משתמשים רשומים"
          value={stats?.users?.total_users || 0}
          icon={<Users className="w-6 h-6 text-purple-500" />}
          color="purple"
          subtitle={`${stats?.users?.new_users_month || 0} חדשים החודש`}
        />
      </div>

      {/* Detailed Stats Grid */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Products Overview */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Package className="w-5 h-5 ml-2" />
            סטטיסטיקות מוצרים
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">מוצרים מאושרים</span>
              <span className="font-semibold text-green-600">
                {stats?.products?.approved || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">ממתינים לאישור</span>
              <span className="font-semibold text-yellow-600">
                {stats?.products?.pending || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">נדחו</span>
              <span className="font-semibold text-red-600">
                {stats?.products?.rejected || 0}
              </span>
            </div>
            <div className="pt-3 border-t">
              <div className="flex justify-between items-center">
                <span className="text-gray-900 font-medium">סה"כ מוצרים</span>
                <span className="font-bold text-lg">
                  {(stats?.products?.approved || 0) + 
                   (stats?.products?.pending || 0) + 
                   (stats?.products?.rejected || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Reports Overview */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 ml-2" />
            דיווחי מחירים
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">דיווחים היום</span>
              <span className="font-semibold text-blue-600">
                {stats?.reports?.reports_today || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">דיווחים השבוע</span>
              <span className="font-semibold text-blue-600">
                {stats?.reports?.reports_this_week || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">ממוצע יומי (שבוע)</span>
              <span className="font-semibold text-gray-600">
                {Math.round((stats?.reports?.reports_this_week || 0) / 7)}
              </span>
            </div>
            <div className="pt-3 border-t">
              <div className="flex justify-between items-center">
                <span className="text-gray-900 font-medium">סה"כ דיווחים</span>
                <span className="font-bold text-lg">
                  {stats?.reports?.total_reports || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Calendar className="w-5 h-5 ml-2" />
          פעילות אחרונה
        </h2>
        
        {!stats?.recentActivity?.length ? (
          <p className="text-gray-500 text-center py-8">אין פעילות אחרונה</p>
        ) : (
          <div className="space-y-3">
            {stats.recentActivity.map(action => (
              <div key={action.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">
                      {action.admin_name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-900">
                      <span className="font-medium">{action.admin_name}</span>
                      {' '}
                      <span>{getActionDescription(action.action_type)}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {action.target_type}: {action.target_id}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(action.created_at).toLocaleDateString('he-IL', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Stats Card Component
const StatsCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'green' | 'yellow' | 'blue' | 'purple';
  subtitle?: string;
}> = ({ title, value, icon, color, subtitle }) => {
  const colorClasses = {
    green: 'bg-green-50 border-green-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    blue: 'bg-blue-50 border-blue-200',
    purple: 'bg-purple-50 border-purple-200'
  };

  return (
    <div className={`p-6 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value.toLocaleString()}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex-shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );
};