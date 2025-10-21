import React, { useState } from 'react';
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
  IconButton,
  InputAdornment,
  Divider,
  Fade,
  Slide,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Login as LoginIcon,
  School as SchoolIcon,
  AdminPanelSettings as AdminIcon,
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = ({ onBackToLanding }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();


  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        console.log('Login successful:', result.user.role);
        
        // Redirect based on user role
        if (result.user.role === 'admin') {
          navigate('/dashboard');
        } else if (result.user.role === 'teacher') {
          navigate('/schedule-viewer');
        } else {
          navigate('/dashboard');
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

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #610202ff 20%, #ffe100ff 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          zIndex: 1,
        }}
      />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 2, py: 4 }}>
        <Fade in timeout={800}>
          <Paper
            elevation={24}
            sx={{
              borderRadius: 4,
              overflow: 'hidden',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            {/* Header Section */}
            <Box
              sx={{
                background: 'linear-gradient(135deg, #000e79ff 0%, #42a5f5 100%)',
                color: 'white',
                p: 4,
                textAlign: 'center',
                position: 'relative'
              }}
            >
              {/* Back Button */}
              {onBackToLanding && (
                <IconButton
                  onClick={onBackToLanding}
                  sx={{
                    position: 'absolute',
                    left: 16,
                    top: 16,
                    color: 'white',
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                    }
                  }}
                >
                  <ArrowBackIcon />
                </IconButton>
              )}

              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  mb: 2,
                  mx: 'auto'
                }}
              >
                <SchoolIcon sx={{ fontSize: 40 }} />
              </Avatar>
              
              <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                Welcome Back
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Sign in to your SchedEase account
              </Typography>
            </Box>

            {/* Form Section */}
            <CardContent sx={{ p: 4 }}>
              <form onSubmit={handleSubmit}>
                <Slide direction="up" in timeout={1000}>
                  <Box>
                    {/* Email Field */}
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
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main',
                          },
                        },
                      }}
                    />

                    {/* Password Field */}
                    <TextField
                      fullWidth
                      label="Password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      margin="normal"
                      required
                      autoComplete="current-password"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={handleClickShowPassword}
                              edge="end"
                              size="small"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main',
                          },
                        },
                      }}
                    />

                    {/* Error Alert */}
                    {error && (
                      <Slide direction="down" in timeout={500}>
                        <Alert 
                          severity="error" 
                          sx={{ 
                            mt: 2, 
                            borderRadius: 2,
                            '& .MuiAlert-icon': {
                              fontSize: '1.2rem'
                            }
                          }}
                        >
                          {error}
                        </Alert>
                      </Slide>
                    )}

                    {/* Login Button */}
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
                      sx={{ 
                        mt: 3, 
                        mb: 2, 
                        py: 1.5,
                        borderRadius: 2,
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        textTransform: 'none',
                        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 8px 25px rgba(25, 118, 210, 0.3)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {loading ? 'Signing In...' : 'Sign In'}
                    </Button>
                  </Box>
                </Slide>
              </form>

              {/* Divider */}
              <Box sx={{ my: 3 }}>
                <Divider>
                  <Chip 
                    label="Secure Access" 
                    size="small" 
                    icon={<SecurityIcon />}
                    sx={{ bgcolor: 'rgba(25, 118, 210, 0.1)', color: 'primary.main' }}
                  />
                </Divider>
              </Box>

              {/* Back to Home Button */}
              {onBackToLanding && (
                <Slide direction="up" in timeout={1200}>
                  <Box textAlign="center">
                    <Button
                      variant="outlined"
                      startIcon={<ArrowBackIcon />}
                      onClick={onBackToLanding}
                      sx={{ 
                        borderRadius: 2,
                        px: 4,
                        py: 1.5,
                        textTransform: 'none',
                        fontWeight: 'medium',
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        '&:hover': {
                          bgcolor: 'primary.main',
                          color: 'white',
                          transform: 'translateY(-1px)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      Back to Home
                    </Button>
                  </Box>
                </Slide>
              )}
            </CardContent>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default Login;
