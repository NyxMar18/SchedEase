import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  School as SchoolIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { classroomAPI, teacherAPI, scheduleAPI } from '../services/api';
import FirebaseConfigChecker from './FirebaseConfigChecker';

const StatCard = ({ title, value, icon, color = 'primary' }) => {
  const colorMap = {
    primary: { main: '#1976d2', light: '#1976d215', gradient: 'linear-gradient(135deg, #1976d215 0%, #1976d205 100%)' },
    secondary: { main: '#dc004e', light: '#dc004e15', gradient: 'linear-gradient(135deg, #dc004e15 0%, #dc004e05 100%)' },
    success: { main: '#2e7d32', light: '#2e7d3215', gradient: 'linear-gradient(135deg, #2e7d3215 0%, #2e7d3205 100%)' },
  };
  
  const colors = colorMap[color] || colorMap.primary;

  return (
    <Card
      sx={{
        height: '100%',
        background: colors.gradient,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        borderLeft: `4px solid ${colors.main}`,
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: 6,
          borderLeftWidth: '6px',
        },
      }}
    >
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography
              color="textSecondary"
              gutterBottom
              variant="h6"
              sx={{
                fontWeight: 500,
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                mb: 1.5,
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="h3"
              component="div"
              sx={{
                fontWeight: 700,
                color: colors.main,
                lineHeight: 1.2,
              }}
            >
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              color: colors.main,
              p: 2.5,
              borderRadius: 2,
              bgcolor: colors.light,
              transition: 'all 0.3s ease-in-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '&:hover': {
                transform: 'scale(1.15) rotate(5deg)',
                bgcolor: `${colors.main}25`,
              },
              '& svg': {
                fontSize: 48,
              },
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalClassrooms: 0,
    totalTeachers: 0,
    totalSchedules: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [classroomsRes, teachersRes, schedulesRes] = await Promise.all([
          classroomAPI.getAll(),
          teacherAPI.getAll(),
          scheduleAPI.getAll(),
        ]);

        setStats({
          totalClassrooms: classroomsRes.data.length,
          totalTeachers: teachersRes.data.length,
          totalSchedules: schedulesRes.data.length,
          loading: false,
          error: null,
        });
      } catch (error) {
        setStats(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to fetch dashboard data',
        }));
      }
    };

    fetchStats();
  }, []);

  if (stats.loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #1976d2 0%, #dc004e 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 3,
          }}
        >
          Dashboard
        </Typography>
        <LinearProgress sx={{ height: 6, borderRadius: 3 }} />
      </Box>
    );
  }

  if (stats.error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #1976d2 0%, #dc004e 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 3,
          }}
        >
          Dashboard
        </Typography>
        <Alert severity="error" sx={{ borderRadius: 2 }}>{stats.error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, pb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #1976d2 0%, #dc004e 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
          }}
        >
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
          Welcome to your scheduling management center
        </Typography>
      </Box>


      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Classrooms"
            value={stats.totalClassrooms}
            icon={<SchoolIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Teachers"
            value={stats.totalTeachers}
            icon={<PersonIcon />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Schedules"
            value={stats.totalSchedules}
            icon={<ScheduleIcon />}
            color="success"
          />
        </Grid>

      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              height: '100%',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                boxShadow: 4,
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  mb: 2.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <ScheduleIcon sx={{ fontSize: 24, color: 'primary.main' }} />
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                <Chip
                  label="Add Classroom"
                  color="primary"
                  variant="outlined"
                  onClick={() => navigate('/classrooms')}
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    py: 2.5,
                    borderWidth: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      bgcolor: 'primary.main',
                      color: 'white',
                      transform: 'translateY(-2px)',
                      boxShadow: 2,
                    },
                  }}
                />
                <Chip
                  label="Add Teacher"
                  color="secondary"
                  variant="outlined"
                  onClick={() => navigate('/teachers')}
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    py: 2.5,
                    borderWidth: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      bgcolor: 'secondary.main',
                      color: 'white',
                      transform: 'translateY(-2px)',
                      boxShadow: 2,
                    },
                  }}
                />
                <Chip
                  label="Teacher Accounts"
                  color="secondary"
                  variant="outlined"
                  onClick={() => navigate('/teacher-accounts')}
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    py: 2.5,
                    borderWidth: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      bgcolor: 'secondary.main',
                      color: 'white',
                      transform: 'translateY(-2px)',
                      boxShadow: 2,
                    },
                  }}
                />
                <Chip
                  label="Generate Schedule"
                  color="success"
                  variant="outlined"
                  onClick={() => navigate('/auto-schedule')}
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    py: 2.5,
                    borderWidth: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      bgcolor: 'success.main',
                      color: 'white',
                      transform: 'translateY(-2px)',
                      boxShadow: 2,
                    },
                  }}
                />
                <Chip
                  label="View Schedules"
                  color="info"
                  variant="outlined"
                  onClick={() => navigate('/schedule-viewer')}
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    py: 2.5,
                    borderWidth: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      bgcolor: 'info.main',
                      color: 'white',
                      transform: 'translateY(-2px)',
                      boxShadow: 2,
                    },
                  }}
                />
                <Chip
                  label="Add Sections"
                  color="warning"
                  variant="outlined"
                  onClick={() => navigate('/sections')}
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    py: 2.5,
                    borderWidth: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      bgcolor: 'warning.main',
                      color: 'white',
                      transform: 'translateY(-2px)',
                      boxShadow: 2,
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              height: '100%',
              background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                boxShadow: 4,
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  mb: 2.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Box
                  component="span"
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: 'success.main',
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.5 },
                    },
                  }}
                />
                System Status
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'rgba(46, 125, 50, 0.08)',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      bgcolor: 'rgba(46, 125, 50, 0.12)',
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Database Connection
                  </Typography>
                  <Chip
                    label="Connected"
                    color="success"
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'rgba(46, 125, 50, 0.08)',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      bgcolor: 'rgba(46, 125, 50, 0.12)',
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Scheduling Engine
                  </Typography>
                  <Chip
                    label="Ready"
                    color="success"
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'rgba(25, 118, 210, 0.08)',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      bgcolor: 'rgba(25, 118, 210, 0.12)',
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Last Sync
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 500, color: 'primary.main' }}
                  >
                    {new Date().toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <FirebaseConfigChecker />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
