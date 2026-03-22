import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, requireOwner }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><div className="loader"></div></div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (requireOwner && user.role !== 'owner') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
