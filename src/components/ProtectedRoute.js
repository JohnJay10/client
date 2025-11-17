// components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // Check ALL possible storage keys
  const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
  const role = localStorage.getItem('role') || localStorage.getItem('adminRole');

  console.log('🔐 PROTECTED ROUTE DEBUG ======================');
  console.log('  - token from localStorage:', localStorage.getItem('token'));
  console.log('  - role from localStorage:', localStorage.getItem('role'));
  console.log('  - adminToken from localStorage:', localStorage.getItem('adminToken'));
  console.log('  - adminRole from localStorage:', localStorage.getItem('adminRole'));
  console.log('  - Using token:', token);
  console.log('  - Using role:', role);
  console.log('  - Token exists:', !!token);
  console.log('  - Role exists:', !!role);
  console.log('  - Role value:', role);
  console.log('  - Required roles: admin or super_admin');

  // Allow both admin and super_admin roles
  const isAuthorized = token && (role === 'admin' || role === 'super_admin');
  
  console.log('  - Is authorized:', isAuthorized);
  console.log('=============================================');

  if (!isAuthorized) {
    console.log('❌ ACCESS DENIED - Redirecting to login');
    return <Navigate to="/" replace />;
  }

  console.log('✅ ACCESS GRANTED - Rendering admin content');
  return <Outlet />;
};

export default ProtectedRoute;