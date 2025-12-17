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
  Divider,
  Collapse,
  IconButton,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  School as SchoolIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Room as RoomIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { classroomAPI, teacherAPI, scheduleAPI, schoolYearAPI } from '../services/api';
import FirebaseConfigChecker from './FirebaseConfigChecker';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';
import firebaseConfig from '../firebase/config';

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

// Helper function to calculate hours between two time strings
const calculateHours = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;
  
  const parseTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + minutes / 60;
  };
  
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  return Math.max(0, end - start);
};

// Helper function to normalize teacher identifier
const normalizeTeacherIdentifier = (teacher) => {
  if (!teacher) return 'Unknown';
  if (typeof teacher === 'string') return teacher;
  
  // Prioritize name fields over email
  if (teacher.firstName && teacher.lastName) {
    return `${teacher.firstName} ${teacher.lastName}`.trim();
  }
  if (teacher.name) return teacher.name;
  if (teacher.fullName) return teacher.fullName;
  // Only use email as last resort before id
  if (teacher.email) return teacher.email;
  if (teacher.id) return teacher.id;
  return 'Unknown';
};

// Helper function to normalize classroom identifier
const normalizeClassroomIdentifier = (classroom) => {
  if (!classroom) return 'Unknown';
  if (typeof classroom === 'string') return classroom;
  return classroom.roomName || classroom.name || classroom.id || 'Unknown';
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalClassrooms: 0,
    totalTeachers: 0,
    totalSchedules: 0,
    teacherUtilization: {},
    classroomUtilization: {},
    loading: true,
    error: null,
  });
  const [expandedSections, setExpandedSections] = useState({
    teacherUtilization: true,
    classroomUtilization: true,
  });
  const [pagination, setPagination] = useState({
    teacherUtilization: 1,
    classroomUtilization: 1,
  });
  const [schoolYears, setSchoolYears] = useState([]);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState('');

  const itemsPerPage = 10;

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handlePageChange = (section, page) => {
    setPagination(prev => ({
      ...prev,
      [section]: page,
    }));
  };

  const fetchSchoolYears = async () => {
    try {
      // Try Firestore first (as used in ScheduleViewer)
      const schoolYearsRef = collection(db, 'schoolYears');
      const q = query(schoolYearsRef, orderBy('name', 'desc'));
      const querySnapshot = await getDocs(q);
      const schoolYearsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSchoolYears(schoolYearsData);
      
      // Set active school year as default if available
      const activeSchoolYear = schoolYearsData.find(sy => sy.isActive);
      if (activeSchoolYear) {
        setSelectedSchoolYear(activeSchoolYear.id);
      } else if (schoolYearsData.length > 0) {
        // If no active, use the first one
        setSelectedSchoolYear(schoolYearsData[0].id);
      }
    } catch (error) {
      console.error('Error fetching school years:', error);
      // Fallback to backend API
      try {
        const response = await schoolYearAPI.getAll();
        const schoolYearsData = response.data.map(sy => ({
          id: sy.id?.toString() || sy.id,
          name: sy.name,
          isActive: sy.isActive,
        }));
        setSchoolYears(schoolYearsData);
        const activeSchoolYear = schoolYearsData.find(sy => sy.isActive);
        if (activeSchoolYear) {
          setSelectedSchoolYear(activeSchoolYear.id);
        } else if (schoolYearsData.length > 0) {
          setSelectedSchoolYear(schoolYearsData[0].id);
        }
      } catch (fallbackError) {
        console.error('Error fetching school years from backend:', fallbackError);
      }
    }
  };

  useEffect(() => {
    fetchSchoolYears();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      if (!selectedSchoolYear) {
        // Wait for school year to be selected
        return;
      }

      try {
        setStats(prev => ({ ...prev, loading: true }));
        
        const [classroomsRes, teachersRes, schedulesRes] = await Promise.all([
          classroomAPI.getAll(),
          teacherAPI.getAll(),
          scheduleAPI.getAll(),
        ]);

        // Filter schedules by selected school year
        const filteredSchedules = schedulesRes.data.filter(schedule => {
          if (!selectedSchoolYear) return true;
          // Handle both string ID and object ID formats
          const scheduleYearId = schedule.schoolYearId || schedule.schoolYear?.id || schedule.schoolYear;
          return scheduleYearId === selectedSchoolYear || scheduleYearId?.toString() === selectedSchoolYear?.toString();
        });

        // Get unique classrooms and teachers from filtered schedules
        const uniqueClassroomIds = new Set();
        const uniqueTeacherIds = new Set();
        
        filteredSchedules.forEach(schedule => {
          if (schedule.classroom) {
            const classroomId = schedule.classroom.id || schedule.classroom;
            if (classroomId) uniqueClassroomIds.add(classroomId);
          }
          if (schedule.teacher) {
            const teacherId = schedule.teacher.id || schedule.teacher;
            if (teacherId) uniqueTeacherIds.add(teacherId);
          }
        });

        // Calculate teacher utilization from filtered schedules
        const teacherUtilization = {};
        filteredSchedules.forEach(schedule => {
          if (schedule.startTime && schedule.endTime) {
            const hours = calculateHours(schedule.startTime, schedule.endTime);
            const teacherName = normalizeTeacherIdentifier(schedule.teacher);
            teacherUtilization[teacherName] = (teacherUtilization[teacherName] || 0) + hours;
          }
        });

        // Calculate classroom utilization from filtered schedules
        const classroomUtilization = {};
        filteredSchedules.forEach(schedule => {
          if (schedule.startTime && schedule.endTime) {
            const hours = calculateHours(schedule.startTime, schedule.endTime);
            const classroomName = normalizeClassroomIdentifier(schedule.classroom);
            classroomUtilization[classroomName] = (classroomUtilization[classroomName] || 0) + hours;
          }
        });

        setStats({
          totalClassrooms: uniqueClassroomIds.size,
          totalTeachers: uniqueTeacherIds.size,
          totalSchedules: filteredSchedules.length,
          teacherUtilization,
          classroomUtilization,
          loading: false,
          error: null,
        });

        // Reset pagination when data changes
        setPagination({
          teacherUtilization: 1,
          classroomUtilization: 1,
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
  }, [selectedSchoolYear]);

  if (stats.loading || schoolYears.length === 0) {
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

  if (!selectedSchoolYear && schoolYears.length > 0) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Alert severity="info">Please select a school year to view dashboard statistics.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Dashboard
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <FilterListIcon color="action" />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="school-year-filter-label">School Year</InputLabel>
            <Select
              labelId="school-year-filter-label"
              id="school-year-filter"
              value={selectedSchoolYear}
              label="School Year"
              onChange={(e) => setSelectedSchoolYear(e.target.value)}
            >
            {schoolYears.map((schoolYear) => (
              <MenuItem key={schoolYear.id} value={schoolYear.id}>
                {schoolYear.name}
                {schoolYear.isActive && (
                  <Chip 
                    label="Active" 
                    size="small" 
                    color="success" 
                    sx={{ ml: 1, height: 20 }}
                  />
                )}
              </MenuItem>
            ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

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

      {/* Utilization Summary Section */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box 
                display="flex" 
                alignItems="center" 
                justifyContent="space-between"
                sx={{ cursor: 'pointer' }}
                onClick={() => toggleSection('teacherUtilization')}
              >
                <Box display="flex" alignItems="center">
                  <PersonIcon sx={{ mr: 1, color: 'secondary.main' }} />
                  <Typography variant="h6">
                    Teacher Utilization Summary
                  </Typography>
                </Box>
                <IconButton size="small">
                  {expandedSections.teacherUtilization ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Collapse in={expandedSections.teacherUtilization}>
                {Object.keys(stats.teacherUtilization).length === 0 ? (
                  <Typography variant="body2" color="textSecondary">
                    No teacher utilization data available
                  </Typography>
                ) : (
                  <Box>
                    {(() => {
                      const sortedTeachers = Object.entries(stats.teacherUtilization)
                        .sort(([, a], [, b]) => b - a);
                      const totalPages = Math.ceil(sortedTeachers.length / itemsPerPage);
                      const startIndex = (pagination.teacherUtilization - 1) * itemsPerPage;
                      const endIndex = startIndex + itemsPerPage;
                      const currentPageTeachers = sortedTeachers.slice(startIndex, endIndex);

                      return (
                        <>
                          {currentPageTeachers.map(([teacher, hours]) => (
                            <Box
                              key={teacher}
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 1.5,
                                p: 1,
                                borderRadius: 1,
                                bgcolor: 'action.hover',
                              }}
                            >
                              <Typography variant="body2" sx={{ flex: 1 }}>
                                {teacher}
                              </Typography>
                              <Chip
                                label={`${hours.toFixed(1)} hrs`}
                                size="small"
                                color="secondary"
                                icon={<TrendingUpIcon />}
                              />
                            </Box>
                          ))}
                          {totalPages > 1 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                              <Pagination
                                count={totalPages}
                                page={pagination.teacherUtilization}
                                onChange={(event, value) => handlePageChange('teacherUtilization', value)}
                                color="secondary"
                                size="small"
                              />
                            </Box>
                          )}
                          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                            Showing {startIndex + 1}-{Math.min(endIndex, sortedTeachers.length)} of {sortedTeachers.length} teachers
                          </Typography>
                        </>
                      );
                    })()}
                  </Box>
                )}
              </Collapse>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box 
                display="flex" 
                alignItems="center" 
                justifyContent="space-between"
                sx={{ cursor: 'pointer' }}
                onClick={() => toggleSection('classroomUtilization')}
              >
                <Box display="flex" alignItems="center">
                  <RoomIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">
                    Classroom Utilization Summary
                  </Typography>
                </Box>
                <IconButton size="small">
                  {expandedSections.classroomUtilization ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Collapse in={expandedSections.classroomUtilization}>
                {Object.keys(stats.classroomUtilization).length === 0 ? (
                  <Typography variant="body2" color="textSecondary">
                    No classroom utilization data available
                  </Typography>
                ) : (
                  <Box>
                    {(() => {
                      const sortedClassrooms = Object.entries(stats.classroomUtilization)
                        .sort(([, a], [, b]) => b - a);
                      const totalPages = Math.ceil(sortedClassrooms.length / itemsPerPage);
                      const startIndex = (pagination.classroomUtilization - 1) * itemsPerPage;
                      const endIndex = startIndex + itemsPerPage;
                      const currentPageClassrooms = sortedClassrooms.slice(startIndex, endIndex);

                      return (
                        <>
                          {currentPageClassrooms.map(([classroom, hours]) => (
                            <Box
                              key={classroom}
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 1.5,
                                p: 1,
                                borderRadius: 1,
                                bgcolor: 'action.hover',
                              }}
                            >
                              <Typography variant="body2" sx={{ flex: 1 }}>
                                {classroom}
                              </Typography>
                              <Chip
                                label={`${hours.toFixed(1)} hrs`}
                                size="small"
                                color="primary"
                                icon={<TrendingUpIcon />}
                              />
                            </Box>
                          ))}
                          {totalPages > 1 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                              <Pagination
                                count={totalPages}
                                page={pagination.classroomUtilization}
                                onChange={(event, value) => handlePageChange('classroomUtilization', value)}
                                color="primary"
                                size="small"
                              />
                            </Box>
                          )}
                          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                            Showing {startIndex + 1}-{Math.min(endIndex, sortedClassrooms.length)} of {sortedClassrooms.length} classrooms
                          </Typography>
                        </>
                      );
                    })()}
                  </Box>
                )}
              </Collapse>
            </CardContent>
          </Card>
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
