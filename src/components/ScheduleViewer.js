import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  LinearProgress,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon,
  TableChart as TableChartIcon,
  CalendarViewWeek as CalendarViewWeekIcon,
} from '@mui/icons-material';
import { scheduleAPI, classroomAPI, teacherAPI } from '../services/api';
import { sectionFirestoreAPI } from '../firebase/sectionFirestoreService';
import { useAuth } from '../contexts/AuthContext';

const ScheduleViewer = () => {
  const { user, isTeacher } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [filterType, setFilterType] = useState(isTeacher() ? 'teacher' : 'all'); // 'all', 'classroom', 'teacher', 'section'
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(isTeacher() ? user?.email : '');
  const [selectedSection, setSelectedSection] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table', 'weekly'

  // Load all data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [schedulesRes, classroomsRes, teachersRes, sectionsRes] = await Promise.all([
          scheduleAPI.getAll(),
          classroomAPI.getAll(),
          teacherAPI.getAll(),
          sectionFirestoreAPI.getAll(),
        ]);

        setSchedules(schedulesRes.data);
        setClassrooms(classroomsRes.data);
        setTeachers(teachersRes.data);
        setSections(sectionsRes.data);
        setError(null);
        
        // Debug logging
        console.log('📊 ScheduleViewer data loaded:', {
          totalSchedules: schedulesRes.data.length,
          totalTeachers: teachersRes.data.length,
          currentUser: user,
          isTeacher: isTeacher(),
          selectedTeacher: isTeacher() ? user?.email : ''
        });
        
        if (isTeacher()) {
          console.log('👤 Teacher schedules:', schedulesRes.data.filter(s => 
            s.teacher?.email === user?.email
          ));
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load schedule data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update selectedTeacher when user changes
  useEffect(() => {
    if (isTeacher() && user?.email) {
      setSelectedTeacher(user.email);
      console.log('🔄 Updated selectedTeacher to:', user.email);
    }
  }, [user, isTeacher]);

  // Apply filters
  useEffect(() => {
    let filtered = [...schedules];

    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(schedule => {
        const searchLower = searchTerm.toLowerCase();
        const teacherName = schedule.teacher ? 
          `${schedule.teacher.firstName || ''} ${schedule.teacher.lastName || ''}`.toLowerCase() : '';
        const classroomName = schedule.classroom?.roomName || '';
        const sectionName = typeof schedule.section === 'string' 
          ? schedule.section 
          : schedule.section?.sectionName || schedule.section?.name || '';
        
        return (
          schedule.subject?.toLowerCase().includes(searchLower) ||
          teacherName.includes(searchLower) ||
          classroomName.toLowerCase().includes(searchLower) ||
          sectionName.toLowerCase().includes(searchLower) ||
          schedule.dayOfWeek?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply specific filters
    if (filterType === 'classroom' && selectedClassroom) {
      filtered = filtered.filter(schedule => schedule.classroom?.id === selectedClassroom);
    } else if (filterType === 'teacher' && selectedTeacher) {
      // Filter by teacher email for better matching
      filtered = filtered.filter(schedule => {
        const teacherEmail = schedule.teacher?.email || '';
        console.log('🔍 Teacher filter check:', {
          scheduleTeacherEmail: teacherEmail,
          selectedTeacherEmail: selectedTeacher,
          match: teacherEmail === selectedTeacher
        });
        return teacherEmail === selectedTeacher;
      });
    } else if (filterType === 'section' && selectedSection) {
      filtered = filtered.filter(schedule => schedule.section?.id === selectedSection);
    }

    console.log('🔍 Filter results:', {
      originalCount: schedules.length,
      filteredCount: filtered.length,
      filterType,
      selectedTeacher,
      isTeacher: isTeacher()
    });

    setFilteredSchedules(filtered);
  }, [schedules, filterType, selectedClassroom, selectedTeacher, selectedSection, searchTerm]);

  const handleFilterTypeChange = (event) => {
    setFilterType(event.target.value);
    // Reset specific filters when changing filter type
    setSelectedClassroom('');
    setSelectedTeacher('');
    setSelectedSection('');
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      const schedulesRes = await scheduleAPI.getAll();
      setSchedules(schedulesRes.data);
      setError(null);
    } catch (err) {
      console.error('Error refreshing schedules:', err);
      setError('Failed to refresh schedule data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Day', 'Time', 'Subject', 'Teacher', 'Classroom', 'Section', 'Status'],
      ...filteredSchedules.map(schedule => [
        schedule.dayOfWeek || '',
        `${schedule.startTime || ''} - ${schedule.endTime || ''}`,
        schedule.subject || '',
        schedule.teacher ? `${schedule.teacher.firstName || ''} ${schedule.teacher.lastName || ''}` : '',
        schedule.classroom?.roomName || '',
        schedule.section?.sectionName || schedule.section?.name || '',
        schedule.status || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedules_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const formatTime = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A';
    return `${startTime} - ${endTime}`;
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Schedule Viewer
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Schedule Viewer
        </Typography>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Schedule Viewer
        </Typography>
        <Box>
          <Tooltip title="Table View">
            <IconButton 
              onClick={() => setViewMode('table')} 
              color={viewMode === 'table' ? 'primary' : 'default'}
            >
              <TableChartIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Weekly View">
            <IconButton 
              onClick={() => setViewMode('weekly')} 
              color={viewMode === 'weekly' ? 'primary' : 'default'}
            >
              <CalendarViewWeekIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export CSV">
            <IconButton onClick={handleExport} color="primary">
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print">
            <IconButton onClick={handlePrint} color="primary">
              <PrintIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        {isTeacher() 
          ? `View your personal schedule - ${user?.name}` 
          : 'View and filter schedules by classroom, teacher, or section'
        }
      </Typography>

      {/* Filters - Only show for admin */}
      {!isTeacher() && (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <FilterListIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Filters
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                placeholder="Search by subject, teacher, classroom..."
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Filter By</InputLabel>
                <Select
                  value={filterType}
                  label="Filter By"
                  onChange={handleFilterTypeChange}
                >
                  <MenuItem value="all">All Schedules</MenuItem>
                  <MenuItem value="classroom">By Classroom</MenuItem>
                  <MenuItem value="teacher">By Teacher</MenuItem>
                  <MenuItem value="section">By Section</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {filterType === 'classroom' && (
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Select Classroom</InputLabel>
                  <Select
                    value={selectedClassroom}
                    label="Select Classroom"
                    onChange={(e) => setSelectedClassroom(e.target.value)}
                  >
                    {classrooms.map((classroom) => (
                      <MenuItem key={classroom.id} value={classroom.id}>
                        {classroom.roomName} ({classroom.roomType})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            {filterType === 'teacher' && (
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Select Teacher</InputLabel>
                  <Select
                    value={selectedTeacher}
                    label="Select Teacher"
                    onChange={(e) => setSelectedTeacher(e.target.value)}
                  >
                    {teachers.map((teacher) => (
                      <MenuItem key={teacher.id} value={teacher.id}>
                        {teacher.firstName} {teacher.lastName} ({teacher.subject})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            {filterType === 'section' && (
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Select Section</InputLabel>
                  <Select
                    value={selectedSection}
                    label="Select Section"
                    onChange={(e) => setSelectedSection(e.target.value)}
                  >
                    {sections.map((section) => (
                      <MenuItem key={section.id} value={section.id}>
                        {section.sectionName} ({section.gradeLevel || 'Grade'})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
      )}

      {/* Teacher Schedule Summary */}
      {filterType === 'teacher' && selectedTeacher && filteredSchedules.length > 0 && (
        <Card sx={{ mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📅 Teacher Schedule Summary
            </Typography>
            {(() => {
              const selectedTeacherData = teachers.find(t => t.id === selectedTeacher);
              const teacherSchedules = filteredSchedules;
              const subjects = [...new Set(teacherSchedules.map(s => s.subject))];
              const classrooms = [...new Set(teacherSchedules.map(s => s.classroom?.roomName))];
              const sections = [...new Set(teacherSchedules.map(s => s.section?.sectionName || s.section?.name))];
              
              return (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                      <strong>Teacher:</strong> {selectedTeacherData?.firstName} {selectedTeacherData?.lastName}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Subject Expertise:</strong> {selectedTeacherData?.subject}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Total Classes:</strong> {teacherSchedules.length}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Subjects Teaching:</strong> {subjects.join(', ')}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Classrooms Used:</strong> {classrooms.join(', ')}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Sections Assigned:</strong> {sections.join(', ')}
                    </Typography>
                  </Grid>
                </Grid>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      <Box mb={2}>
        <Typography variant="h6">
          Showing {filteredSchedules.length} of {schedules.length} schedules
          {filterType === 'teacher' && selectedTeacher && (
            <Typography variant="body2" color="textSecondary" component="span">
              {' '}for selected teacher
            </Typography>
          )}
        </Typography>
      </Box>

      {/* Schedules Display */}
      {viewMode === 'table' ? (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Day</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Teacher</TableCell>
              <TableCell>Classroom</TableCell>
              <TableCell>Section</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSchedules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="textSecondary">
                    No schedules found matching your criteria
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredSchedules.map((schedule) => (
                <TableRow key={schedule.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {schedule.dayOfWeek || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatTime(schedule.startTime, schedule.endTime)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {schedule.subject || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {schedule.teacher ? `${schedule.teacher.firstName || ''} ${schedule.teacher.lastName || ''}`.trim() : 'N/A'}
                    </Typography>
                    {schedule.teacher?.subject && (
                      <Typography variant="caption" color="textSecondary">
                        ({schedule.teacher.subject})
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {schedule.classroom?.roomName || 'N/A'}
                    </Typography>
                    {schedule.classroom?.roomType && (
                      <Typography variant="caption" color="textSecondary">
                        ({schedule.classroom.roomType})
                      </Typography>
                    )}
                      {schedule.classroom?.capacity && (
                        <Typography variant="caption" color="textSecondary" display="block">
                          Capacity: {schedule.classroom.capacity}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {typeof schedule.section === 'string' 
                          ? schedule.section 
                          : schedule.section?.sectionName || schedule.section?.name || 'N/A'
                        }
                    </Typography>
                    {typeof schedule.section === 'object' && schedule.section?.gradeLevel && (
                      <Typography variant="caption" color="textSecondary">
                        ({schedule.section.gradeLevel})
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={schedule.status || 'Unknown'}
                      color={getStatusColor(schedule.status)}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      ) : (
        /* Weekly View */
        <Box>
          {(() => {
            const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
            const timeSlots = [
              { start: '08:00', end: '09:00' },
              { start: '09:00', end: '10:00' },
              { start: '10:00', end: '11:00' },
              { start: '11:00', end: '12:00' },
              { start: '13:00', end: '14:00' },
              { start: '14:00', end: '15:00' },
              { start: '15:00', end: '16:00' },
            ];

            return (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ minWidth: 100 }}>Time</TableCell>
                      {daysOfWeek.map(day => (
                        <TableCell key={day} align="center" sx={{ minWidth: 200 }}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {day}
                          </Typography>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {timeSlots.map(timeSlot => (
                      <TableRow key={`${timeSlot.start}-${timeSlot.end}`}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {timeSlot.start} - {timeSlot.end}
                          </Typography>
                        </TableCell>
                        {daysOfWeek.map(day => {
                          const scheduleForSlot = filteredSchedules.find(schedule => 
                            schedule.dayOfWeek === day && 
                            schedule.startTime === timeSlot.start &&
                            schedule.endTime === timeSlot.end
                          );
                          
                          return (
                            <TableCell key={`${day}-${timeSlot.start}`} align="center">
                              {scheduleForSlot ? (
                                <Card sx={{ 
                                  p: 1, 
                                  bgcolor: 'primary.light', 
                                  color: 'primary.contrastText',
                                  minHeight: 80,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'center'
                                }}>
                                  <Typography variant="caption" fontWeight="bold">
                                    {scheduleForSlot.subject}
                                  </Typography>
                                  <Typography variant="caption" display="block">
                                    {scheduleForSlot.teacher ? 
                                      `${scheduleForSlot.teacher.firstName} ${scheduleForSlot.teacher.lastName}` : 
                                      'N/A'
                                    }
                                  </Typography>
                                  <Typography variant="caption" display="block">
                                    {scheduleForSlot.classroom?.roomName || 'N/A'}
                                  </Typography>
                                  <Typography variant="caption" display="block">
                                    {typeof scheduleForSlot.section === 'string' 
                                      ? scheduleForSlot.section 
                                      : scheduleForSlot.section?.sectionName || scheduleForSlot.section?.name || 'N/A'
                                    }
                                  </Typography>
                                </Card>
                              ) : (
                                <Box sx={{ minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Typography variant="caption" color="textSecondary">
                                    Free
                                  </Typography>
                                </Box>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            );
          })()}
        </Box>
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .MuiAppBar-root,
          .MuiDrawer-root,
          .MuiButton-root,
          .MuiIconButton-root {
            display: none !important;
          }
          .MuiTableContainer-root {
            box-shadow: none !important;
          }
        }
      `}</style>
    </Box>
  );
};

export default ScheduleViewer;
