import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  AutoAwesome as AutoAwesomeIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Book as BookIcon,
  Group as GroupIcon,
  Schedule as ScheduleIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { scheduleApi, teacherApi, classroomApi, sectionApi, subjectApi } from '../services/backendApi';

const EnhancedAutoSchedule = () => {
  const [sections, setSections] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [generatedSchedules, setGeneratedSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [schedulingResult, setSchedulingResult] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

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

  useEffect(() => {
    fetchData();
    loadExistingSchedules();
  }, []);

  const loadExistingSchedules = async () => {
    try {
      const result = await scheduleApi.getAll();
      if (result.success) {
        setGeneratedSchedules(result.data);
      }
    } catch (error) {
      console.log('No existing schedules found or error loading:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sectionsRes, teachersRes, classroomsRes, subjectsRes] = await Promise.all([
        sectionApi.getAll(),
        teacherApi.getAll(),
        classroomApi.getAll(),
        subjectApi.getAll(),
      ]);

      if (sectionsRes.success) setSections(sectionsRes.data);
      if (teachersRes.success) setTeachers(teachersRes.data);
      if (classroomsRes.success) setClassrooms(classroomsRes.data);
      if (subjectsRes.success) setSubjects(subjectsRes.data);

      setError(null);
    } catch (err) {
      setError('Failed to fetch data from backend');
    } finally {
      setLoading(false);
    }
  };

  const generateOptimizedSchedule = async () => {
    if (sections.length === 0) {
      setError('Please add sections first');
      return;
    }
    if (teachers.length === 0) {
      setError('Please add teachers first');
      return;
    }
    if (classrooms.length === 0) {
      setError('Please add classrooms first');
      return;
    }
    if (subjects.length === 0) {
      setError('Please add subjects first');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      console.log('🚀 Generating optimized schedule...');
      const result = await scheduleApi.generateOptimized();

      if (result.success) {
        setSchedulingResult(result.data);
        setGeneratedSchedules(result.data.schedules || []);
        
        const message = result.data.success 
          ? `✅ ${result.data.message}` 
          : `❌ ${result.data.message}`;
        
        if (result.data.success) {
          setSuccess(message);
          console.log('📊 Scheduling Statistics:', result.data.statistics);
        } else {
          setError(message);
        }
      } else {
        setError('Failed to generate schedule: ' + result.error);
      }
    } catch (err) {
      setError('Failed to generate schedule: ' + err.message);
    } finally {
      setLoading(false);
    }
  };


  const deleteAllSchedules = async () => {
    if (!window.confirm('Are you sure you want to delete ALL generated schedules? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🗑️ Starting to delete all schedules...');
      
      // Get all existing schedules
      const result = await scheduleApi.getAll();
      if (!result.success) {
        setError('Failed to fetch schedules for deletion');
        return;
      }
      
      const schedules = result.data;
      console.log(`📋 Found ${schedules.length} schedules to delete`);
      
      let deletedCount = 0;
      let failedCount = 0;
      
      // Delete each schedule
      for (const schedule of schedules) {
        try {
          await scheduleApi.delete(schedule.id);
          deletedCount++;
          console.log(`✅ Deleted schedule ${deletedCount}: ${schedule.subject?.name || 'Unknown'} - ${schedule.dayOfWeek} ${schedule.startTime}`);
        } catch (deleteError) {
          failedCount++;
          console.error(`❌ Failed to delete schedule ${schedule.id}:`, deleteError);
        }
      }
      
      // Clear local state
      setGeneratedSchedules([]);
      setSchedulingResult(null);
      
      if (failedCount === 0) {
        setSuccess(`✅ Successfully deleted all ${deletedCount} schedules from the database!`);
      } else {
        setError(`⚠️ Deleted ${deletedCount} schedules, but ${failedCount} failed to delete. Check console for details.`);
      }
      
      console.log(`🗑️ Deletion complete: ${deletedCount} deleted, ${failedCount} failed`);
      
    } catch (error) {
      console.error('❌ Error during schedule deletion:', error);
      setError('Failed to delete schedules: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getValidationStatus = () => {
    const issues = [];
    
    if (sections.length === 0) issues.push('No sections defined');
    if (teachers.length === 0) issues.push('No teachers defined');
    if (classrooms.length === 0) issues.push('No classrooms defined');
    if (subjects.length === 0) issues.push('No subjects defined');
    
    // Check if teachers can cover all subjects
    const subjectNames = subjects.map(s => s.name);
    const teacherSubjects = teachers.map(t => t.subject);
    const missingSubjects = subjectNames.filter(subject => !teacherSubjects.includes(subject));
    if (missingSubjects.length > 0) {
      issues.push(`No teachers for subjects: ${missingSubjects.join(', ')}`);
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  };

  const validation = getValidationStatus();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        <AutoAwesomeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Advanced Auto Schedule Generator
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Generate an optimized, conflict-free schedule using advanced constraint satisfaction algorithms.
        The system considers teacher availability, classroom capacity, subject priorities, and workload balancing
        to create the best possible schedule for your institution.
      </Typography>

      {/* System Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            System Status
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <GroupIcon color={sections.length > 0 ? "success" : "error"} sx={{ mr: 1 }} />
                <Typography variant="h6">Sections: {sections.length}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PersonIcon color={teachers.length > 0 ? "success" : "error"} sx={{ mr: 1 }} />
                <Typography variant="h6">Teachers: {teachers.length}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SchoolIcon color={classrooms.length > 0 ? "success" : "error"} sx={{ mr: 1 }} />
                <Typography variant="h6">Classrooms: {classrooms.length}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BookIcon color={subjects.length > 0 ? "success" : "error"} sx={{ mr: 1 }} />
                <Typography variant="h6">Subjects: {subjects.length}</Typography>
              </Box>
            </Grid>
          </Grid>

          {!validation.isValid && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Issues to resolve:</Typography>
              <ul>
                {validation.issues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            </Alert>
          )}

          {validation.isValid && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <CheckCircleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              All prerequisites met! Ready to generate schedule.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<AutoAwesomeIcon />}
          onClick={generateOptimizedSchedule}
          disabled={loading || !validation.isValid}
        >
          Generate Optimized Schedule
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={deleteAllSchedules}
          disabled={loading}
          sx={{ 
            borderColor: 'error.main',
            color: 'error.main',
            '&:hover': {
              borderColor: 'error.dark',
              backgroundColor: 'error.light',
              color: 'error.dark'
            }
          }}
        >
          Delete All Schedules
        </Button>
        {schedulingResult && (
          <Button
            variant="outlined"
            onClick={() => setShowDetails(true)}
          >
            View Details
          </Button>
        )}
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Scheduling Result Statistics */}
      {schedulingResult && schedulingResult.statistics && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Schedule Statistics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Teacher Utilization:</Typography>
                {Object.entries(schedulingResult.statistics.teacherUtilization || {}).map(([teacher, count]) => (
                  <Box key={teacher} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">{teacher}:</Typography>
                    <Chip label={`${count} hours`} size="small" color="primary" />
                  </Box>
                ))}
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Classroom Utilization:</Typography>
                {Object.entries(schedulingResult.statistics.classroomUtilization || {}).map(([classroom, count]) => (
                  <Box key={classroom} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">{classroom}:</Typography>
                    <Chip label={`${count} hours`} size="small" color="secondary" />
                  </Box>
                ))}
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Generated Schedule Table */}
      {generatedSchedules.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Generated Schedule ({generatedSchedules.length} entries)
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Section</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Teacher</TableCell>
                    <TableCell>Classroom</TableCell>
                    <TableCell>Day</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {generatedSchedules.map((schedule, index) => (
                    <TableRow key={schedule.id || index}>
                      <TableCell>
                        <Chip label={schedule.section?.sectionName || 'N/A'} color="primary" size="small" />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
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
                      <TableCell>{`${schedule.teacher?.firstName || ''} ${schedule.teacher?.lastName || ''}`.trim() || 'N/A'}</TableCell>
                      <TableCell>{schedule.classroom?.roomName || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip label={schedule.dayOfWeek || 'N/A'} color="secondary" size="small" />
                      </TableCell>
                      <TableCell>{`${schedule.startTime || 'N/A'} - ${schedule.endTime || 'N/A'}`}</TableCell>
                      <TableCell>
                        <Chip label={schedule.status || 'SCHEDULED'} color="success" size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Details Dialog */}
      <Dialog open={showDetails} onClose={() => setShowDetails(false)} maxWidth="md" fullWidth>
        <DialogTitle>Scheduling Details</DialogTitle>
        <DialogContent>
          {schedulingResult && (
            <Box>
              <Typography variant="h6" gutterBottom>Result Summary</Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {schedulingResult.message}
              </Typography>

              {schedulingResult.warnings && schedulingResult.warnings.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">Warnings:</Typography>
                  <ul>
                    {schedulingResult.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </Alert>
              )}

              {schedulingResult.statistics && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Detailed Statistics</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <pre>{JSON.stringify(schedulingResult.statistics, null, 2)}</pre>
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetails(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EnhancedAutoSchedule;
