import React from 'react';
import UserManagement from '@/components/UserManagement';

const UsersPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <UserManagement />
    </div>
  );
};

export default UsersPage;