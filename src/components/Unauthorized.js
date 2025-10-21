import React from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Card,
  CardContent,
} from '@mui/material';
import {
  Block as BlockIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleGoHome = () => {
    if (user?.role === 'admin') {
      navigate('/dashboard');
    } else if (user?.role === 'teacher') {
      navigate('/schedule-viewer');
    } else {
      navigate('/');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4
        }}
      >
        <Card sx={{ width: '100%', textAlign: 'center' }}>
          <CardContent sx={{ p: 4 }}>
            <BlockIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
            
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              Access Denied
            </Typography>
            
            <Typography variant="body1" color="textSecondary" paragraph>
              You don't have permission to access this page.
            </Typography>

            {user && (
              <Typography variant="body2" color="textSecondary" paragraph>
                Current role: <strong>{user.role}</strong>
              </Typography>
            )}

            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                startIcon={<HomeIcon />}
                onClick={handleGoHome}
              >
                Go to Dashboard
              </Button>
              
              <Button
                variant="outlined"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Unauthorized;

