import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AuthorityRoute = ({ children }) => {
  const { isAuthenticated, isAuthority, loading } = useAuth();

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAuthority) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AuthorityRoute;
