import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,

  useTheme,
  useMediaQuery,
  Fade,
  Slide,
} from '@mui/material';
import {
  School as SchoolIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Class as ClassIcon,
  AutoAwesome as AutoAwesomeIcon,
  Visibility as VisibilityIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import Login from './Login';

const AppLandingPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      // If user is already logged in, redirect to appropriate page
      if (user.role === 'admin') {
        navigate('/dashboard');
      } else if (user.role === 'teacher') {
        navigate('/schedule-viewer');
      }
    }
  }, [user, loading, navigate]);

  // If user is already logged in, don't show landing page
  if (!loading && user) {
    return null;
  }

  // If showing login form
  if (showLogin) {
    return <Login onBackToLanding={() => setShowLogin(false)} />;
  }

  const features = [
    {
      icon: <AutoAwesomeIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Smart Scheduling',
      description: 'AI-powered schedule generation that optimizes classroom and teacher utilization.'
    },
    {
      icon: <ClassIcon sx={{ fontSize: 40, color: 'secondary.main' }} />,
      title: 'Classroom Management',
      description: 'Efficiently manage classrooms, sections, and subject assignments.'
    },
    {
      icon: <PersonIcon sx={{ fontSize: 40, color: 'success.main' }} />,
      title: 'Teacher Management',
      description: 'Organize teacher profiles, subjects, and workload distribution.'
    },
    {
      icon: <VisibilityIcon sx={{ fontSize: 40, color: 'info.main' }} />,
      title: 'Real-time Viewing',
      description: 'View and manage schedules with interactive weekly and table views.'
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
      title: 'Secure Access',
      description: 'Role-based access control for administrators and teachers.'
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 40, color: 'error.main' }} />,
      title: 'Fast & Reliable',
      description: 'Built with modern technology for optimal performance and reliability.'
    }
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: 'white',
          py: 8,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Fade in timeout={1000}>
            <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
              <SchoolIcon sx={{ fontSize: 80, mb: 2, opacity: 0.9 }} />
              <Typography
                variant={isMobile ? 'h3' : 'h2'}
                component="h1"
                gutterBottom
                sx={{ fontWeight: 'bold', mb: 2 }}
              >
                SchedEase
              </Typography>
              <Typography
                variant={isMobile ? 'h6' : 'h5'}
                sx={{ mb: 4, opacity: 0.9, maxWidth: 600, mx: 'auto' }}
              >
               School Scheduling Management System
              </Typography>
              <Typography
                variant="body1"
                sx={{ mb: 4, opacity: 0.8, maxWidth: 500, mx: 'auto' }}
              >
                Streamline your school's scheduling process with our intelligent, 
                user-friendly platform designed for administrators and teachers.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => setShowLogin(true)}
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  '&:hover': {
                    bgcolor: 'grey.100',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Log in
              </Button>
            </Box>
          </Fade>
        </Container>
        
        {/* Decorative Elements */}
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
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
            Why Choose SchedEase?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Our platform combines powerful scheduling algorithms with an intuitive interface 
            to make school management effortless.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Slide direction="up" in timeout={800 + index * 100}>
                <Card
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    p: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: theme.shadows[8],
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ mb: 2 }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Slide>
            </Grid>
          ))}
        </Grid>
      </Container>

 

      {/* Footer */}
      <Box sx={{ bgcolor: 'grey.900', color: 'white', py: 4 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              ScheduleEase
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              © 2025 SchedEase. Empowering educational institutions with smart scheduling solutions.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default AppLandingPage;

