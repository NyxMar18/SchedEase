import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Paper,
  Divider,
} from '@mui/material';
import {
  Login as LoginIcon,
  School as SchoolIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/');
      } else if (user.role === 'teacher') {
        navigate('/schedule-viewer');
      }
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        console.log('Login successful:', result.user);
        
        // Redirect based on user role
        if (result.user.role === 'admin') {
          navigate('/');
        } else if (result.user.role === 'teacher') {
          navigate('/schedule-viewer');
        } else {
          navigate('/');
        }
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (type) => {
    if (type === 'admin') {
      setFormData({
        email: 'admin@sched.com',
        password: 'admin123'
      });
    } else if (type === 'teacher') {
      setFormData({
        email: 'teacher@example.com',
        password: '1234'
      });
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          py: 4
        }}
      >
        <Paper elevation={10} sx={{ width: '100%', maxWidth: 500 }}>
          <Card>
            <CardContent sx={{ p: 4 }}>
              {/* Header */}
              <Box textAlign="center" mb={4}>
                <SchoolIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                  SchedEase
                </Typography>
                <Typography variant="subtitle1" color="textSecondary">
                  School Scheduling System
                </Typography>
              </Box>

              {/* Login Form */}
              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  margin="normal"
                  required
                  autoComplete="email"
                  autoFocus
                />
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  margin="normal"
                  required
                  autoComplete="current-password"
                />

                {error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                  </Alert>
                )}

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
                  sx={{ mt: 3, mb: 2, py: 1.5 }}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>

              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="textSecondary">
                  Demo Accounts
                </Typography>
              </Divider>

              {/* Demo Login Buttons */}
              <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
                <Button
                  variant="outlined"
                  startIcon={<AdminIcon />}
                  onClick={() => handleDemoLogin('admin')}
                  fullWidth
                  sx={{ py: 1.5 }}
                >
                  Admin Demo
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<SchoolIcon />}
                  onClick={() => handleDemoLogin('teacher')}
                  fullWidth
                  sx={{ py: 1.5 }}
                >
                  Teacher Demo
                </Button>
              </Box>

              {/* Login Instructions */}
              <Box mt={3} p={2} bgcolor="grey.50" borderRadius={1}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  <strong>Login Instructions:</strong>
                </Typography>
                <Typography variant="body2" color="textSecondary" component="div">
                  <strong>Admin:</strong> admin@sched.com / admin123
                </Typography>
                <Typography variant="body2" color="textSecondary" component="div">
                  <strong>Teachers:</strong> Use your email address / 1234 (default)
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                  Teachers can change their password after first login
                </Typography>
              </Box>

              {/* Admin Setup Link */}
              <Box mt={3} textAlign="center">
                <Button
                  variant="text"
                  color="primary"
                  onClick={() => window.location.href = '/create-admin'}
                  sx={{ textDecoration: 'underline', mr: 2 }}
                >
                  Need to create admin account?
                </Button>
                <Button
                  variant="text"
                  color="secondary"
                  onClick={() => window.location.href = '/database-test'}
                  sx={{ textDecoration: 'underline', mr: 2 }}
                >
                  Database connection issues?
                </Button>
                <Button
                  variant="text"
                  color="info"
                  onClick={() => window.location.href = '/teacher-accounts'}
                  sx={{ textDecoration: 'underline' }}
                >
                  Manage teacher accounts?
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
