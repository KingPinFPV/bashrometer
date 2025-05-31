"use client";

import React, { useState, useEffect } from 'react';
import { authenticatedApiCall } from '@/config/api';

interface User {
  id: number;
  email: string;
  role: string;
  created_at: string;
  last_login?: string;
  products_count: number;
  reports_count: number;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    fetchUsers();
  }, [searchTerm]);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        limit: '20',
        offset: '0',
        search: searchTerm
      });
      
      const data = await authenticatedApiCall(`/api/admin/users?${params.toString()}`);
      setUsers(data.users || []);
      
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('שגיאה בטעינת משתמשים');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await authenticatedApiCall(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole })
      });
      
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('שגיאה בעדכון תפקיד המשתמש');
    }
  };
  
  const handleDeleteUser = async (userId: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את המשתמש?')) return;
    
    try {
      await authenticatedApiCall(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
      
      setUsers(prev => prev.filter(user => user.id !== userId));
      
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('שגיאה במחיקת המשתמש');
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-lg">טוען משתמשים...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-red-600 text-center py-8">
        {error}
        <button 
          onClick={fetchUsers}
          className="block mx-auto mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          נסה שוב
        </button>
      </div>
    );
  }
  
  return (
    <div className="user-management">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">ניהול משתמשים</h1>
        
        <div className="mb-4">
          <input
            type="text"
            placeholder="חיפוש לפי אימייל..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                אימייל
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                תפקיד
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                תאריך הצטרפות
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                מוצרים
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                דיווחים
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                פעולות
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  לא נמצאו משתמשים
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="user">משתמש</option>
                      <option value="admin">מנהל</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('he-IL')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.products_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.reports_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                    >
                      מחק
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;