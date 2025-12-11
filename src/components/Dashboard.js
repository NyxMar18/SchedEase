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
  Collapse,
} from '@mui/material';
import {
  School as SchoolIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { classroomAPI, teacherAPI, scheduleAPI } from '../services/api';
import { sectionAPI } from '../firebase/sectionService';
import { subjectAPI } from '../firebase/subjectService';
import { userAPI } from '../services/userService';
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
  const [schedules, setSchedules] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    scheduleDistribution: true,
    scheduleSummary: false,
    classroomUtilization: false,
    teacherWorkload: false,
  });

  // Toggle section collapse
  const toggleSection = (sectionName) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  // Time slots for distribution display
  const timeSlots = [
    { name: 'Session 1', start: '07:30', end: '09:00' },
    { name: 'Session 2', start: '09:15', end: '10:45' },
    { name: 'Session 3', start: '10:45', end: '12:15' },
    { name: 'Session 4', start: '13:15', end: '14:45' },
    { name: 'Session 5', start: '14:45', end: '16:15' },
    { name: 'Session 6', start: '16:30', end: '18:00' },
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [classroomsRes, teachersRes, schedulesRes, sectionsRes, subjectsRes, usersRes] = await Promise.all([
          classroomAPI.getAll(),
          teacherAPI.getAll(),
          scheduleAPI.getAll(),
          sectionAPI.getAll(),
          subjectAPI.getAll(),
          userAPI.getAll(),
        ]);

        setStats({
          totalClassrooms: classroomsRes.data?.length || 0,
          totalTeachers: teachersRes.data?.length || 0,
          totalSchedules: schedulesRes.data?.length || 0,
          loading: false,
          error: null,
        });
        
        setSchedules(schedulesRes.data || []);
        setSections(sectionsRes.data || []);
        setSubjects(subjectsRes.data || []);
        setClassrooms(classroomsRes.data || []);
        setTeachers(teachersRes.data || []);
        setUsers(usersRes.success ? (usersRes.data || []) : []);
      } catch (error) {
        console.error('Dashboard fetch error:', error);
        setStats(prev => ({
          ...prev,
          loading: false,
          error: `Failed to fetch dashboard data: ${error.message || error.toString()}`,
        }));
        // Set empty arrays on error to prevent crashes
        setSchedules([]);
        setSections([]);
        setSubjects([]);
        setClassrooms([]);
        setTeachers([]);
        setUsers([]);
      }
    };

    fetchStats();
  }, []);
  
  // Helper function to get teacher users
  const getTeacherUsers = () => {
    return users.filter(user => user.role === 'teacher');
  };
  
  // Helper function to get teacher data for a user
  const getTeacherDataForUser = (user) => {
    return teachers.find(teacher => 
      teacher.id === user.id || 
      teacher.email === user.email ||
      (teacher.firstName === user.firstName && teacher.lastName === user.lastName)
    );
  };

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

      {/* Schedule Distribution Dashboard */}
      {schedules.length > 0 && (
        <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 3, mt: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <ScheduleIcon sx={{ mr: 2, color: 'primary.main', fontSize: 28 }} />
              <Typography variant="h5" fontWeight="bold" color="primary.main">
                Schedule Distribution Overview
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              📊 Visual breakdown of how your schedules are distributed across days and time slots
            </Typography>

            <Grid container spacing={3}>
              {/* Days Distribution */}
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  borderRadius: 2, 
                  p: 2.5, 
                  height: '100%',
                  border: '1px solid',
                  borderColor: 'grey.200'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                      📅 Days Distribution
                    </Typography>
                    <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                      Classes per day
                    </Typography>
                  </Box>
                  
                  {Object.entries({ MONDAY: 0, TUESDAY: 0, WEDNESDAY: 0, THURSDAY: 0, FRIDAY: 0 }).map(([day, _]) => {
                    const count = schedules.filter(s => s.dayOfWeek === day).length;
                    const percentage = schedules.length > 0 ? Math.round((count / schedules.length) * 100) : 0;
                    const maxCount = Math.max(...Object.values({ MONDAY: 0, TUESDAY: 0, WEDNESDAY: 0, THURSDAY: 0, FRIDAY: 0 }).map((_, index) => 
                      schedules.filter(s => s.dayOfWeek === Object.keys({ MONDAY: 0, TUESDAY: 0, WEDNESDAY: 0, THURSDAY: 0, FRIDAY: 0 })[index]).length
                    ));
                    
                    return (
                      <Box key={day} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" fontWeight="medium" color="text.primary">
                            {day.charAt(0) + day.slice(1).toLowerCase()}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              {percentage}%
                            </Typography>
                            <Chip 
                              label={count} 
                              size="small" 
                              sx={{ 
                                bgcolor: count > 0 ? 'primary.main' : 'grey.300',
                                color: count > 0 ? 'white' : 'grey.600',
                                fontWeight: 'bold',
                                minWidth: '40px'
                              }} 
                            />
                          </Box>
                        </Box>
                        
                        {/* Progress Bar */}
                        <Box sx={{ 
                          width: '100%', 
                          height: 6, 
                          bgcolor: 'grey.200', 
                          borderRadius: 3,
                          overflow: 'hidden'
                        }}>
                          <Box sx={{ 
                            width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%`, 
                            height: '100%', 
                            bgcolor: count > 0 ? 'primary.main' : 'grey.300',
                            borderRadius: 3,
                            transition: 'width 0.3s ease'
                          }} />
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Grid>

              {/* Time Distribution */}
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  borderRadius: 2, 
                  p: 2.5, 
                  height: '100%',
                  border: '1px solid',
                  borderColor: 'grey.200'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold" color="secondary.main">
                      ⏰ Time Distribution
                    </Typography>
                    <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                      Classes per time slot
                    </Typography>
                  </Box>
                  
                  <Box sx={{ maxHeight: 300, overflowY: 'auto', pr: 1 }}>
                    {timeSlots.map((timeSlot, slotIndex) => {
                      const count = schedules.filter(s => s.startTime === timeSlot.start).length;
                      const percentage = schedules.length > 0 ? Math.round((count / schedules.length) * 100) : 0;
                      const maxCount = Math.max(...timeSlots.map(slot => 
                        schedules.filter(s => s.startTime === slot.start).length
                      ));
                      
                      return (
                        <Box key={`time-slot-${timeSlot.start}-${timeSlot.end}-${slotIndex}`} sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" fontWeight="medium" color="text.primary">
                              {timeSlot.start}-{timeSlot.end}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                {percentage}%
                              </Typography>
                              <Chip 
                                label={count} 
                                size="small" 
                                sx={{ 
                                  bgcolor: count > 0 ? 'secondary.main' : 'grey.300',
                                  color: count > 0 ? 'white' : 'grey.600',
                                  fontWeight: 'bold',
                                  minWidth: '40px'
                                }} 
                              />
                            </Box>
                          </Box>
                          
                          {/* Progress Bar */}
                          <Box sx={{ 
                            width: '100%', 
                            height: 6, 
                            bgcolor: 'grey.200', 
                            borderRadius: 3,
                            overflow: 'hidden'
                          }}>
                            <Box sx={{ 
                              width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%`, 
                              height: '100%', 
                              bgcolor: count > 0 ? 'secondary.main' : 'grey.300',
                              borderRadius: 3,
                              transition: 'width 0.3s ease'
                            }} />
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </Grid>
            </Grid>

            {/* Summary Statistics */}
            <Box sx={{ 
              mt: 3, 
              p: 2, 
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'grey.200'
            }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: 'text.primary' }}>
                📈 Quick Stats
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                      {schedules.length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total Classes
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight="bold" color="secondary.main">
                      {new Set(schedules.map(s => s.dayOfWeek)).size}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Active Days
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight="bold" color="success.main">
                      {new Set(schedules.map(s => s.startTime)).size}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Time Slots Used
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight="bold" color="warning.main">
                      {Math.round(schedules.length / 5)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Avg/Day
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
      )}

    

      {/* Classroom Utilization */}
      {schedules.length > 0 && classrooms.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => toggleSection('classroomUtilization')}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 0 }}>
                <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Classroom Utilization
              </Typography>
              {expandedSections.classroomUtilization ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Box>
          </CardContent>
          <Collapse in={expandedSections.classroomUtilization}>
            <CardContent sx={{ pt: 0 }}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Shows how schedules are distributed across all available classrooms for optimal resource usage.
              </Typography>
              <Grid container spacing={2}>
                {classrooms.map(classroom => {
                  const usageCount = schedules.filter(s => 
                    s.classroom?.id === classroom.id || 
                    s.classroom === classroom.id ||
                    s.classroom?.roomName === classroom.roomName
                  ).length;
                  const totalCapacity = classroom.capacity || 0;
                  const utilizationPercent = totalCapacity > 0 ? Math.round((usageCount / totalCapacity) * 15) : 0;
                  
                  return (
                    <Grid item xs={12} sm={6} md={4} key={classroom.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {classroom.roomName}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Type: {classroom.roomType || 'N/A'}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Capacity: {totalCapacity} students
                          </Typography>
                          <Box sx={{ mt: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2">Usage:</Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {usageCount} schedules
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2">Utilization:</Typography>
                              <Chip 
                                label={`${utilizationPercent}%`} 
                                size="small" 
                                color={utilizationPercent > 80 ? 'success' : utilizationPercent > 50 ? 'warning' : 'info'}
                              />
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Collapse>
        </Card>
      )}

      {/* Teacher Workload Distribution */}
      {schedules.length > 0 && teachers.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => toggleSection('teacherWorkload')}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 0 }}>
                <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Teacher Workload Distribution
              </Typography>
              {expandedSections.teacherWorkload ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Box>
          </CardContent>
          <Collapse in={expandedSections.teacherWorkload}>
            <CardContent sx={{ pt: 0 }}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Shows how schedules are distributed across all teachers for balanced workload.
              </Typography>
              <Grid container spacing={2}>
                {teachers.map(teacher => {
                  const scheduleCount = schedules.filter(s => {
                    const scheduleTeacherId = s.teacher?.id || s.teacher;
                    return scheduleTeacherId === teacher.id;
                  }).length;
                  
                  const teacherSubjects = teacher.subjects || [];
                  const maxPossibleLoad = teacherSubjects.length * 108; // Assuming 3 hours per subject
                  const workloadPercent = maxPossibleLoad > 0 ? Math.round((scheduleCount / maxPossibleLoad) * 100) : 0;
                  
                  return (
                    <Grid item xs={12} sm={6} md={4} key={teacher.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {teacher.firstName} {teacher.lastName}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Subject: {teacherSubjects.length > 0 ? teacherSubjects.join(', ') : 'N/A'}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Max Possible Load: {maxPossibleLoad} hours/week
                          </Typography>
                          <Box sx={{ mt: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2">Current Load:</Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {scheduleCount} schedules
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2">Workload:</Typography>
                              <Chip 
                                label={`${workloadPercent}%`} 
                                size="small" 
                                color={workloadPercent > 80 ? 'success' : workloadPercent > 50 ? 'warning' : 'info'}
                              />
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Collapse>
        </Card>
      )}
    </Box>
  );
};

export default Dashboard;
