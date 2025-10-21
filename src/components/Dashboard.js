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

const StatCard = ({ title, value, icon, color = 'primary' }) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="h6">
            {title}
          </Typography>
          <Typography variant="h4" component="div">
            {value}
          </Typography>
        </Box>
        <Box color={`${color}.main`}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

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
      <Box>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (stats.error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Alert severity="error">{stats.error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>


      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Classrooms"
            value={stats.totalClassrooms}
            icon={<SchoolIcon sx={{ fontSize: 40 }} />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Teachers"
            value={stats.totalTeachers}
            icon={<PersonIcon sx={{ fontSize: 40 }} />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Schedules"
            value={stats.totalSchedules}
            icon={<ScheduleIcon sx={{ fontSize: 40 }} />}
            color="success"
          />
        </Grid>

      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                <Chip
                  label="Add Classroom"
                  color="primary"
                  variant="outlined"
                  onClick={() => navigate('/classrooms')}
                />
                <Chip
                  label="Add Teacher"
                  color="secondary"
                  variant="outlined"
                  onClick={() => navigate('/teachers')}
                />
                <Chip
                  label="Generate Schedule"
                  color="success"
                  variant="outlined"
                  onClick={() => navigate('/auto-schedule')}
                />
                <Chip
                  label="View Schedules"
                  color="info"
                  variant="outlined"
                  onClick={() => navigate('/schedule-viewer')}
                />
                <Chip
                  label="Teacher Accounts"
                  color="warning"
                  variant="outlined"
                  onClick={() => navigate('/teacher-accounts')}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Status
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Database Connection</Typography>
                  <Chip label="Connected" color="success" size="small" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Scheduling Engine</Typography>
                  <Chip label="Ready" color="success" size="small" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Last Sync</Typography>
                  <Typography variant="body2" color="textSecondary">
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
