import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  AutoAwesome as AutoAwesomeIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { schoolYearAPI, schoolYearScheduleAPI } from '../firebase/schoolYearService';
import { teacherAPI, classroomAPI } from '../services/api';

const YearlyScheduleGenerator = () => {
  const [schoolYears, setSchoolYears] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState('');
  const [scheduleRequests, setScheduleRequests] = useState([]);
  const [generatedSchedules, setGeneratedSchedules] = useState([]);
  const [failedRequests, setFailedRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [open, setOpen] = useState(false);
  const [currentRequest, setCurrentRequest] = useState({
    startTime: null,
    endTime: null,
    dayOfWeek: '',
    subject: '',
    requiredCapacity: '',
    roomType: '',
    notes: '',
    isRecurring: false,
  });

  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Geography', 'Computer Science', 'Art', 'Music'];
  const roomTypes = ['Lecture Hall', 'Laboratory', 'Computer Lab', 'Library', 'Auditorium', 'Meeting Room'];
  const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schoolYearsRes, teachersRes, classroomsRes] = await Promise.all([
        schoolYearAPI.getAll(),
        teacherAPI.getAll(),
        classroomAPI.getAll(),
      ]);
      
      setSchoolYears(schoolYearsRes.data);
      setTeachers(teachersRes.data);
      setClassrooms(classroomsRes.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format time values
  const formatTime = (time) => {
    if (!time) return '';
    if (time.format && typeof time.format === 'function') {
      return time.format('HH:mm');
    }
    return time.toString();
  };

  const handleAddRequest = () => {
    if (validateRequest(currentRequest)) {
      setScheduleRequests([...scheduleRequests, { ...currentRequest }]);
      setCurrentRequest({
        startTime: null,
        endTime: null,
        dayOfWeek: '',
        subject: '',
        requiredCapacity: '',
        roomType: '',
        notes: '',
        isRecurring: false,
      });
      setOpen(false);
    } else {
      setError('Please fill in all required fields');
    }
  };

  const validateRequest = (request) => {
    return request.startTime && 
           request.endTime && 
           request.dayOfWeek && 
           request.subject && 
           request.requiredCapacity && 
           request.roomType;
  };

  const handleRemoveRequest = (index) => {
    setScheduleRequests(scheduleRequests.filter((_, i) => i !== index));
  };

  const handleGenerateYearlySchedule = async () => {
    if (!selectedSchoolYear) {
      setError('Please select a school year');
      return;
    }

    if (scheduleRequests.length === 0) {
      setError('Please add at least one scheduling request');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const requests = scheduleRequests.map(req => ({
        ...req,
        date: new Date().toISOString().split('T')[0], // Today's date
        requiredCapacity: parseInt(req.requiredCapacity),
      }));

      const response = await schoolYearScheduleAPI.generateYearlySchedule(
        selectedSchoolYear,
        teachers,
        classrooms,
        requests
      );
      
      setGeneratedSchedules(response.data);
      setFailedRequests(response.failedRequests);
      
      if (response.data && response.data.length > 0) {
        const summary = response.summary;
        setSuccess(`Successfully generated ${summary.successful} out of ${summary.totalRequests} schedules (${summary.successRate} success rate) for the school year!`);
      } else {
        setError('No schedules could be generated. Please check teacher and classroom availability.');
      }
    } catch (err) {
      setError('Failed to generate yearly schedules. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (event) => {
    setCurrentRequest(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleTimeChange = (field) => (newTime) => {
    setCurrentRequest(prev => ({
      ...prev,
      [field]: newTime,
    }));
  };

  const handleCheckboxChange = (field) => (event) => {
    setCurrentRequest(prev => ({
      ...prev,
      [field]: event.target.checked,
    }));
  };

  const getStatusIcon = (schedule) => {
    return <CheckCircleIcon color="success" />;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            <AutoAwesomeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Yearly Schedule Generator
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
          >
            Add Request
          </Button>
        </Box>

        {/* School Year Selection */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Select School Year
            </Typography>
            <FormControl fullWidth>
              <InputLabel>School Year</InputLabel>
              <Select
                value={selectedSchoolYear}
                onChange={(e) => setSelectedSchoolYear(e.target.value)}
                label="School Year"
              >
                {schoolYears.map((schoolYear) => (
                  <MenuItem key={schoolYear.id} value={schoolYear.id}>
                    {schoolYear.name} ({schoolYear.startDate} - {schoolYear.endDate})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Scheduling Requests ({scheduleRequests.length})
                </Typography>
                {scheduleRequests.length === 0 ? (
                  <Typography color="textSecondary">
                    No requests added yet. Click "Add Request" to get started.
                  </Typography>
                ) : (
                  <Box>
                    {scheduleRequests.map((request, index) => (
                      <Card key={index} sx={{ mb: 2, p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1" gutterBottom>
                              {request.subject} - {request.dayOfWeek}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Time: {formatTime(request.startTime)} - {formatTime(request.endTime)}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Room: {request.roomType} (Capacity: {request.requiredCapacity})
                            </Typography>
                            {request.notes && (
                              <Typography variant="body2" color="textSecondary">
                                Notes: {request.notes}
                              </Typography>
                            )}
                            {request.isRecurring && (
                              <Chip label="Recurring" color="primary" size="small" sx={{ mt: 1 }} />
                            )}
                          </Box>
                          <IconButton onClick={() => handleRemoveRequest(index)} color="error">
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Card>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Generated Schedules ({generatedSchedules.length})
                </Typography>
                {loading ? (
                  <Box>
                    <Typography gutterBottom>Generating yearly schedules...</Typography>
                    <LinearProgress />
                  </Box>
                ) : generatedSchedules.length === 0 ? (
                  <Typography color="textSecondary">
                    No schedules generated yet. Add requests and click "Generate Yearly Schedule".
                  </Typography>
                ) : (
                  <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Teacher</TableCell>
                          <TableCell>Classroom</TableCell>
                          <TableCell>Time</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {generatedSchedules.map((schedule, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {schedule.teacher?.firstName} {schedule.teacher?.lastName}
                            </TableCell>
                            <TableCell>{schedule.classroom?.roomName}</TableCell>
                            <TableCell>
                              {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                            </TableCell>
                            <TableCell>
                              {getStatusIcon(schedule)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Failed Requests ({failedRequests.length})
                </Typography>
                {failedRequests.length === 0 ? (
                  <Typography color="textSecondary">
                    No failed requests.
                  </Typography>
                ) : (
                  <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {failedRequests.map((failed, index) => (
                      <Card key={index} sx={{ mb: 1, p: 1, bgcolor: 'error.light' }}>
                        <Typography variant="body2" color="error.contrastText">
                          <strong>{failed.request.subject}</strong> - {failed.request.dayOfWeek}
                        </Typography>
                        <Typography variant="caption" color="error.contrastText">
                          {formatTime(failed.request.startTime)} - {formatTime(failed.request.endTime)}
                        </Typography>
                        <Typography variant="caption" color="error.contrastText" display="block">
                          Reason: {failed.reason}
                        </Typography>
                        <Typography variant="caption" color="error.contrastText" display="block">
                          Available Teachers: {failed.eligibleTeachers} | Available Classrooms: {failed.eligibleClassrooms}
                        </Typography>
                      </Card>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<AutoAwesomeIcon />}
            onClick={handleGenerateYearlySchedule}
            disabled={scheduleRequests.length === 0 || loading || !selectedSchoolYear}
            sx={{ px: 4, py: 1.5 }}
          >
            {loading ? 'Generating...' : 'Generate Yearly Schedule'}
          </Button>
        </Box>

        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add Scheduling Request</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TimePicker
                  label="Start Time"
                  value={currentRequest.startTime}
                  onChange={handleTimeChange('startTime')}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TimePicker
                  label="End Time"
                  value={currentRequest.endTime}
                  onChange={handleTimeChange('endTime')}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Day of Week</InputLabel>
                  <Select
                    value={currentRequest.dayOfWeek}
                    onChange={handleChange('dayOfWeek')}
                    label="Day of Week"
                  >
                    {daysOfWeek.map((day) => (
                      <MenuItem key={day} value={day}>
                        {day}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Subject</InputLabel>
                  <Select
                    value={currentRequest.subject}
                    onChange={handleChange('subject')}
                    label="Subject"
                  >
                    {subjects.map((subject) => (
                      <MenuItem key={subject} value={subject}>
                        {subject}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Required Capacity"
                  type="number"
                  value={currentRequest.requiredCapacity}
                  onChange={handleChange('requiredCapacity')}
                  fullWidth
                  required
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Room Type</InputLabel>
                  <Select
                    value={currentRequest.roomType}
                    onChange={handleChange('roomType')}
                    label="Room Type"
                  >
                    {roomTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Notes"
                  value={currentRequest.notes}
                  onChange={handleChange('notes')}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleAddRequest} variant="contained">
              Add Request
            </Button>
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
    </LocalizationProvider>
  );
};

export default YearlyScheduleGenerator;