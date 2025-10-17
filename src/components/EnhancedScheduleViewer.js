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
  Tabs,
  Tab,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon,
  TableChart as TableChartIcon,
  CalendarViewWeek as CalendarViewWeekIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { scheduleApi, classroomApi, teacherApi, sectionApi, subjectApi } from '../services/backendApi';

const EnhancedScheduleViewer = () => {
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState(null);

  // Filter states
  const [filterType, setFilterType] = useState('all');
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [tabValue, setTabValue] = useState(0);

  // Load all data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [schedulesRes, classroomsRes, teachersRes, sectionsRes, subjectsRes] = await Promise.all([
          scheduleApi.getAll(),
          classroomApi.getAll(),
          teacherApi.getAll(),
          sectionApi.getAll(),
          subjectApi.getAll(),
        ]);

        if (schedulesRes.success) setSchedules(schedulesRes.data);
        if (classroomsRes.success) setClassrooms(classroomsRes.data);
        if (teachersRes.success) setTeachers(teachersRes.data);
        if (sectionsRes.success) setSections(sectionsRes.data);
        if (subjectsRes.success) setSubjects(subjectsRes.data);

        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load schedule data from backend');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Load statistics
  useEffect(() => {
    const loadStatistics = async () => {
      try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30); // Last 30 days
        const endDate = new Date();
        
        const result = await scheduleApi.getStatistics(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );
        
        if (result.success) {
          setStatistics(result.data);
        }
      } catch (error) {
        console.error('Failed to load statistics:', error);
      }
    };

    if (schedules.length > 0) {
      loadStatistics();
    }
  }, [schedules]);

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
        const sectionName = schedule.section?.sectionName || '';
        const subjectName = schedule.subject?.name || '';
        
        return (
          subjectName.toLowerCase().includes(searchLower) ||
          teacherName.includes(searchLower) ||
          classroomName.toLowerCase().includes(searchLower) ||
          sectionName.toLowerCase().includes(searchLower) ||
          schedule.dayOfWeek?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply specific filters
    if (filterType === 'classroom' && selectedClassroom) {
      filtered = filtered.filter(schedule => schedule.classroom?.id === parseInt(selectedClassroom));
    } else if (filterType === 'teacher' && selectedTeacher) {
      filtered = filtered.filter(schedule => schedule.teacher?.id === parseInt(selectedTeacher));
    } else if (filterType === 'section' && selectedSection) {
      filtered = filtered.filter(schedule => schedule.section?.id === parseInt(selectedSection));
    } else if (filterType === 'subject' && selectedSubject) {
      filtered = filtered.filter(schedule => schedule.subject?.id === parseInt(selectedSubject));
    }

    setFilteredSchedules(filtered);
  }, [schedules, filterType, selectedClassroom, selectedTeacher, selectedSection, selectedSubject, searchTerm]);

  const handleFilterTypeChange = (event) => {
    setFilterType(event.target.value);
    setSelectedClassroom('');
    setSelectedTeacher('');
    setSelectedSection('');
    setSelectedSubject('');
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      const result = await scheduleApi.getAll();
      if (result.success) {
        setSchedules(result.data);
        setError(null);
      } else {
        setError('Failed to refresh schedule data');
      }
    } catch (err) {
      console.error('Error refreshing schedules:', err);
      setError('Failed to refresh schedule data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Day', 'Time', 'Subject', 'Teacher', 'Classroom', 'Section', 'Status', 'Duration Index'],
      ...filteredSchedules.map(schedule => [
        schedule.dayOfWeek || '',
        `${schedule.startTime || ''} - ${schedule.endTime || ''}`,
        schedule.subject?.name || '',
        schedule.teacher ? `${schedule.teacher.firstName || ''} ${schedule.teacher.lastName || ''}` : '',
        schedule.classroom?.roomName || '',
        schedule.section?.sectionName || '',
        schedule.status || '',
        schedule.durationIndex !== undefined ? schedule.durationIndex + 1 : '',
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
      case 'SCHEDULED': return 'success';
      case 'CONFIRMED': return 'info';
      case 'CANCELLED': return 'error';
      case 'POSTPONED': return 'warning';
      case 'COMPLETED': return 'primary';
      default: return 'default';
    }
  };

  const formatTime = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A';
    return `${startTime} - ${endTime}`;
  };

  const renderStatistics = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Schedule Statistics
        </Typography>
        {statistics ? (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>Subject Distribution:</Typography>
              {Object.entries(statistics.subjectDistribution || {}).map(([subject, count]) => (
                <Box key={subject} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">{subject}:</Typography>
                  <Chip label={count} size="small" color="primary" />
                </Box>
              ))}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>Day Distribution:</Typography>
              {Object.entries(statistics.dayDistribution || {}).map(([day, count]) => (
                <Box key={day} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">{day}:</Typography>
                  <Chip label={count} size="small" color="secondary" />
                </Box>
              ))}
            </Grid>
          </Grid>
        ) : (
          <Typography variant="body2" color="textSecondary">
            No statistics available
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Enhanced Schedule Viewer
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Enhanced Schedule Viewer
        </Typography>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Enhanced Schedule Viewer
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
        View and analyze schedules with advanced filtering and statistics
      </Typography>

      {/* Tabs for different views */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Schedule View" />
          <Tab label="Statistics" />
        </Tabs>
      </Box>

      {tabValue === 0 ? (
        <>
          {/* Filters */}
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
                      <MenuItem value="subject">By Subject</MenuItem>
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
                {filterType === 'subject' && (
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Select Subject</InputLabel>
                      <Select
                        value={selectedSubject}
                        label="Select Subject"
                        onChange={(e) => setSelectedSubject(e.target.value)}
                      >
                        {subjects.map((subject) => (
                          <MenuItem key={subject.id} value={subject.id}>
                            {subject.name} ({subject.durationPerWeek}h/week)
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Results Summary */}
          <Box mb={2}>
            <Typography variant="h6">
              Showing {filteredSchedules.length} of {schedules.length} schedules
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
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {schedule.subject?.name || 'N/A'}
                            </Typography>
                            {schedule.notes && schedule.notes.includes('consecutive') && (
                              <Typography variant="caption" color="primary">
                                🔗 Consecutive Hours
                              </Typography>
                            )}
                            {schedule.durationIndex !== undefined && !schedule.notes?.includes('consecutive') && (
                              <Typography variant="caption" color="textSecondary">
                                Hour {schedule.durationIndex + 1}/{schedule.subject?.durationPerWeek || 1}
                              </Typography>
                            )}
                          </Box>
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
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {schedule.section?.sectionName || 'N/A'}
                          </Typography>
                          {schedule.section?.gradeLevel && (
                            <Typography variant="caption" color="textSecondary">
                              ({schedule.section.gradeLevel})
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={schedule.status || 'SCHEDULED'}
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
                                        {scheduleForSlot.subject?.name || 'N/A'}
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
                                        {scheduleForSlot.section?.sectionName || 'N/A'}
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
        </>
      ) : (
        renderStatistics()
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

export default EnhancedScheduleViewer;
