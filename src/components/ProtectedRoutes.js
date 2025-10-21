import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, loading } = useAuth();

  console.log('🛡️ ProtectedRoute check:', user?.role || 'no user');

  if (loading) {
    console.log('⏳ ProtectedRoute: Loading...');
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
      >
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading...
        </Typography>
      </Box>
    );
  }

  if (!user) {
    console.log('❌ ProtectedRoute: No user, redirecting to login');
    return <Navigate to="/" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    console.log('🚫 ProtectedRoute: Role mismatch');
    return <Navigate to="/unauthorized" replace />;
  }

  console.log('✅ ProtectedRoute: Access granted');
  return children;
};

export default ProtectedRoute;
