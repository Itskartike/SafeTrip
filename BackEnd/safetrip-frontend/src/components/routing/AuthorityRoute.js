import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Protects routes for AUTHORITY role only (e.g. alerts dashboard).
 * Users with role USER are redirected to home.
 */
const AuthorityRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== 'AUTHORITY') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AuthorityRoute;
