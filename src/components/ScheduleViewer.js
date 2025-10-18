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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon,
  TableChart as TableChartIcon,
  CalendarViewWeek as CalendarViewWeekIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { scheduleAPI, classroomAPI, teacherAPI } from '../services/api';
import { sectionFirestoreAPI } from '../firebase/sectionFirestoreService';
import { useAuth } from '../contexts/AuthContext';

const ScheduleViewer = () => {
  const { user, isAdmin, isTeacher } = useAuth();
  
  // Debug logging
  console.log('🔍 ScheduleViewer Debug:', {
    user: user,
    userRole: user?.role,
    isAdmin: isAdmin(),
    isTeacher: isTeacher()
  });
  const [schedules, setSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [filterType, setFilterType] = useState('all'); // 'all', 'classroom', 'teacher', 'section'
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table', 'weekly'

  // Edit states
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    startTime: '',
    endTime: '',
    dayOfWeek: '',
    teacher: '',
    classroom: '',
    subject: '',
    notes: ''
  });
  const [conflicts, setConflicts] = useState([]);
  const [showConflictWarning, setShowConflictWarning] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);

  // Add/Delete states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    dayOfWeek: '',
    teacher: '',
    classroom: '',
    section: '',
    subject: '',
    notes: '',
    isRecurring: false
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);

  // Drag and Drop states
  const [draggedSchedule, setDraggedSchedule] = useState(null);
  const [dragOverSlot, setDragOverSlot] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Load all data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch schedules
        const schedulesRes = await scheduleAPI.getAll();
        let allSchedules = schedulesRes.data;
        
        // If user is a teacher, filter schedules to only show their own
        if (isTeacher() && user?.teacherId) {
          allSchedules = allSchedules.filter(schedule => {
            // Check if the schedule's teacher ID matches the logged-in teacher's ID
            return schedule.teacher?.id === user.teacherId;
          });
          console.log(`👨‍🏫 Teacher ${user.name} (ID: ${user.teacherId}) - Filtered to ${allSchedules.length} schedules`);
        }
        
        setSchedules(allSchedules);
        
        // For teachers, we don't need to load all classrooms, teachers, and sections
        // since they can only see their own schedules
        if (isAdmin()) {
          const [classroomsRes, teachersRes, sectionsRes] = await Promise.all([
            classroomAPI.getAll(),
            teacherAPI.getAll(),
            sectionFirestoreAPI.getAll(),
          ]);
          
          setClassrooms(classroomsRes.data);
          setTeachers(teachersRes.data);
          setSections(sectionsRes.data);
        } else {
          // For teachers, we still need some data for display purposes
          const [classroomsRes, teachersRes, sectionsRes] = await Promise.all([
            classroomAPI.getAll(),
            teacherAPI.getAll(),
            sectionFirestoreAPI.getAll(),
          ]);
          
          setClassrooms(classroomsRes.data);
          setTeachers(teachersRes.data);
          setSections(sectionsRes.data);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load schedule data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, isTeacher, isAdmin]);


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
      const selectedTeacherData = teachers.find(t => t.id === selectedTeacher);
      console.log('🔍 Filtering by teacher:', selectedTeacherData);
      console.log('📚 Teacher subject:', selectedTeacherData?.subject);
      
      filtered = filtered.filter(schedule => {
        const matchesTeacher = schedule.teacher?.id === selectedTeacher;
        const scheduleSubject = schedule.subject;
        
        console.log(`📋 Schedule: ${scheduleSubject} | Teacher: ${selectedTeacherData?.subject} | Matches: ${matchesTeacher}`);
        
        // Additional check: ensure the teacher actually teaches this subject
        const teacherTeachesSubject = scheduleSubject === selectedTeacherData?.subject;
        
        if (matchesTeacher && !teacherTeachesSubject) {
          console.warn(`⚠️ WARNING: Teacher ${selectedTeacherData?.firstName} ${selectedTeacherData?.lastName} is assigned to teach ${scheduleSubject} but their subject is ${selectedTeacherData?.subject}`);
          // Don't show this schedule if teacher doesn't actually teach this subject
          return false;
        }
        
        return matchesTeacher && teacherTeachesSubject;
      });
    } else if (filterType === 'section' && selectedSection) {
      filtered = filtered.filter(schedule => schedule.section?.id === selectedSection);
    }

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

  // Conflict detection function
  const detectConflicts = (scheduleId, newData) => {
    const detectedConflicts = [];
    
    // Check for teacher conflicts
    const teacherConflicts = schedules.filter(schedule => 
      schedule.id !== scheduleId &&
      schedule.teacher?.id === newData.teacher &&
      schedule.dayOfWeek === newData.dayOfWeek &&
      timeOverlaps(schedule.startTime, schedule.endTime, newData.startTime, newData.endTime)
    );
    
    // Check for classroom conflicts
    const classroomConflicts = schedules.filter(schedule => 
      schedule.id !== scheduleId &&
      schedule.classroom?.id === newData.classroom &&
      schedule.dayOfWeek === newData.dayOfWeek &&
      timeOverlaps(schedule.startTime, schedule.endTime, newData.startTime, newData.endTime)
    );

    teacherConflicts.forEach(conflict => {
      detectedConflicts.push({
        type: 'teacher',
        message: `Teacher ${conflict.teacher?.firstName} ${conflict.teacher?.lastName} is already scheduled for ${conflict.subject} at ${conflict.startTime}-${conflict.endTime}`,
        conflictingSchedule: conflict
      });
    });

    classroomConflicts.forEach(conflict => {
      detectedConflicts.push({
        type: 'classroom',
        message: `Classroom ${conflict.classroom?.roomName} is already booked for ${conflict.subject} at ${conflict.startTime}-${conflict.endTime}`,
        conflictingSchedule: conflict
      });
    });

    return detectedConflicts;
  };

  // Helper function to check time overlaps
  const timeOverlaps = (start1, end1, start2, end2) => {
    const start1Time = new Date(`2000-01-01 ${start1}`);
    const end1Time = new Date(`2000-01-01 ${end1}`);
    const start2Time = new Date(`2000-01-01 ${start2}`);
    const end2Time = new Date(`2000-01-01 ${end2}`);

    return start1Time < end2Time && start2Time < end1Time;
  };

  // Handle edit button click
  const handleEditSchedule = (schedule) => {
    setEditingSchedule(schedule);
    setEditFormData({
      startTime: schedule.startTime || '',
      endTime: schedule.endTime || '',
      dayOfWeek: schedule.dayOfWeek || '',
      teacher: schedule.teacher?.id || '',
      classroom: schedule.classroom?.id || '',
      subject: schedule.subject || '',
      notes: schedule.notes || ''
    });
    setConflicts([]);
    setShowConflictWarning(false);
    setEditDialogOpen(true);
  };

  // Handle form data changes
  const handleEditFormChange = (field) => (event) => {
    const newValue = event.target.value;
    setEditFormData(prev => ({
      ...prev,
      [field]: newValue
    }));

    // Check for conflicts when time or day changes
    if (['startTime', 'endTime', 'dayOfWeek', 'teacher', 'classroom'].includes(field)) {
      const newData = { ...editFormData, [field]: newValue };
      if (newData.startTime && newData.endTime && newData.dayOfWeek && newData.teacher && newData.classroom) {
        const detectedConflicts = detectConflicts(editingSchedule?.id, newData);
        setConflicts(detectedConflicts);
        setShowConflictWarning(detectedConflicts.length > 0);
      }
    }
  };

  // Handle save schedule
  const handleSaveSchedule = async () => {
    try {
      setLoading(true);
      
      // Final conflict check
      const finalConflicts = detectConflicts(editingSchedule?.id, editFormData);
      
      if (finalConflicts.length > 0) {
        setConflicts(finalConflicts);
        setShowConflictWarning(true);
        return;
      }

      // Prepare update data
      const selectedTeacher = teachers.find(t => t.id === editFormData.teacher);
      const selectedClassroom = classrooms.find(c => c.id === editFormData.classroom);
      
      const updateData = {
        startTime: editFormData.startTime,
        endTime: editFormData.endTime,
        dayOfWeek: editFormData.dayOfWeek,
        teacher: selectedTeacher,
        classroom: selectedClassroom,
        subject: editFormData.subject,
        notes: editFormData.notes,
        // Keep original values for fields not being edited
        date: editingSchedule.date,
        section: editingSchedule.section,
        isRecurring: editingSchedule.isRecurring,
        status: editingSchedule.status
      };

      await scheduleAPI.update(editingSchedule.id, updateData);
      
      // Refresh schedules
      const schedulesRes = await scheduleAPI.getAll();
      let allSchedules = schedulesRes.data;
      
      if (isTeacher() && user?.teacherId) {
        allSchedules = allSchedules.filter(schedule => {
          return schedule.teacher?.id === user.teacherId;
        });
      }
      
      setSchedules(allSchedules);
      setEditDialogOpen(false);
      setSuccessMessage('Schedule updated successfully!');
      setShowSuccessSnackbar(true);
      
    } catch (err) {
      setError('Failed to update schedule');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditDialogOpen(false);
    setEditingSchedule(null);
    setEditFormData({
      startTime: '',
      endTime: '',
      dayOfWeek: '',
      teacher: '',
      classroom: '',
      subject: '',
      notes: ''
    });
    setConflicts([]);
    setShowConflictWarning(false);
  };

  // Handle add schedule
  const handleAddSchedule = () => {
    setAddFormData({
      date: new Date().toISOString().split('T')[0], // Today's date
      startTime: '',
      endTime: '',
      dayOfWeek: '',
      teacher: '',
      classroom: '',
      section: '',
      subject: '',
      notes: '',
      isRecurring: false
    });
    setAddDialogOpen(true);
  };

  // Handle add form changes
  const handleAddFormChange = (field) => (event) => {
    const newValue = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setAddFormData(prev => ({
      ...prev,
      [field]: newValue
    }));

    // Auto-set day of week when date changes
    if (field === 'date' && newValue) {
      const date = new Date(newValue);
      const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      setAddFormData(prev => ({
        ...prev,
        dayOfWeek: days[date.getDay()]
      }));
    }
  };

  // Handle save new schedule
  const handleSaveNewSchedule = async () => {
    try {
      setLoading(true);
      
      // Prepare schedule data
      const selectedTeacher = teachers.find(t => t.id === addFormData.teacher);
      const selectedClassroom = classrooms.find(c => c.id === addFormData.classroom);
      const selectedSection = sections.find(s => s.id === addFormData.section);
      
      const scheduleData = {
        date: addFormData.date,
        startTime: addFormData.startTime,
        endTime: addFormData.endTime,
        dayOfWeek: addFormData.dayOfWeek,
        teacher: selectedTeacher,
        classroom: selectedClassroom,
        section: selectedSection,
        subject: addFormData.subject,
        notes: addFormData.notes,
        isRecurring: addFormData.isRecurring,
        status: 'scheduled'
      };

      await scheduleAPI.create(scheduleData);
      
      // Refresh schedules
      const schedulesRes = await scheduleAPI.getAll();
      let allSchedules = schedulesRes.data;
      
      if (isTeacher() && user?.teacherId) {
        allSchedules = allSchedules.filter(schedule => {
          return schedule.teacher?.id === user.teacherId;
        });
      }
      
      setSchedules(allSchedules);
      setAddDialogOpen(false);
      setSuccessMessage('Schedule created successfully!');
      setShowSuccessSnackbar(true);
      
    } catch (err) {
      setError('Failed to create schedule');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel add
  const handleCancelAdd = () => {
    setAddDialogOpen(false);
    setAddFormData({
      date: '',
      startTime: '',
      endTime: '',
      dayOfWeek: '',
      teacher: '',
      classroom: '',
      section: '',
      subject: '',
      notes: '',
      isRecurring: false
    });
  };

  // Handle delete schedule
  const handleDeleteSchedule = (schedule) => {
    setScheduleToDelete(schedule);
    setDeleteDialogOpen(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
      
      await scheduleAPI.delete(scheduleToDelete.id);
      
      // Refresh schedules
      const schedulesRes = await scheduleAPI.getAll();
      let allSchedules = schedulesRes.data;
      
      if (isTeacher() && user?.teacherId) {
        allSchedules = allSchedules.filter(schedule => {
          return schedule.teacher?.id === user.teacherId;
        });
      }
      
      setSchedules(allSchedules);
      setDeleteDialogOpen(false);
      setScheduleToDelete(null);
      setSuccessMessage('Schedule deleted successfully!');
      setShowSuccessSnackbar(true);
      
    } catch (err) {
      setError('Failed to delete schedule');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel delete
  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setScheduleToDelete(null);
  };

  // Drag and Drop handlers
  const handleDragStart = (e, schedule) => {
    setDraggedSchedule(schedule);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
  };

  const handleDragOver = (e, day, timeSlot) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlot({ day, timeSlot });
  };

  const handleDragLeave = (e) => {
    setDragOverSlot(null);
  };

  const handleDrop = async (e, targetDay, targetTimeSlot) => {
    e.preventDefault();
    
    if (!draggedSchedule || !isAdmin()) {
      setDraggedSchedule(null);
      setDragOverSlot(null);
      setIsDragging(false);
      return;
    }

    // Check if the target slot is the same as the current slot
    if (draggedSchedule.dayOfWeek === targetDay && 
        draggedSchedule.startTime === targetTimeSlot.start &&
        draggedSchedule.endTime === targetTimeSlot.end) {
      setDraggedSchedule(null);
      setDragOverSlot(null);
      setIsDragging(false);
      return;
    }

    try {
      setLoading(true);
      
      // Check for conflicts in the target slot
      const conflicts = detectConflictsForSlot(targetDay, targetTimeSlot, draggedSchedule);
      
      if (conflicts.length > 0) {
        setError(`Cannot move schedule: ${conflicts.map(c => c.message).join(', ')}`);
        setDraggedSchedule(null);
        setDragOverSlot(null);
        setIsDragging(false);
        return;
      }

      // Update the schedule
      const updatedSchedule = {
        ...draggedSchedule,
        dayOfWeek: targetDay,
        startTime: targetTimeSlot.start,
        endTime: targetTimeSlot.end,
        notes: draggedSchedule.notes ? 
          `${draggedSchedule.notes} (Moved via drag & drop)` : 
          'Moved via drag & drop'
      };

      await scheduleAPI.update(draggedSchedule.id, updatedSchedule);
      
      // Refresh schedules
      const schedulesRes = await scheduleAPI.getAll();
      let allSchedules = schedulesRes.data;
      
      if (isTeacher() && user?.teacherId) {
        allSchedules = allSchedules.filter(schedule => {
          return schedule.teacher?.id === user.teacherId;
        });
      }
      
      setSchedules(allSchedules);
      setSuccessMessage('Schedule moved successfully!');
      setShowSuccessSnackbar(true);
      
    } catch (err) {
      setError('Failed to move schedule');
    } finally {
      setDraggedSchedule(null);
      setDragOverSlot(null);
      setIsDragging(false);
      setLoading(false);
    }
  };

  const handleDragEnd = () => {
    setDraggedSchedule(null);
    setDragOverSlot(null);
    setIsDragging(false);
  };

  // Helper function to detect conflicts for a specific slot
  const detectConflictsForSlot = (day, timeSlot, scheduleToMove) => {
    const conflicts = [];
    
    // Check for teacher conflicts
    const teacherConflicts = filteredSchedules.filter(schedule => 
      schedule.id !== scheduleToMove.id &&
      schedule.dayOfWeek === day &&
      schedule.startTime === timeSlot.start &&
      schedule.endTime === timeSlot.end &&
      schedule.teacher?.id === scheduleToMove.teacher?.id
    );
    
    if (teacherConflicts.length > 0) {
      conflicts.push({
        message: `Teacher ${scheduleToMove.teacher?.firstName} ${scheduleToMove.teacher?.lastName} is already scheduled at this time`
      });
    }
    
    // Check for classroom conflicts
    const classroomConflicts = filteredSchedules.filter(schedule => 
      schedule.id !== scheduleToMove.id &&
      schedule.dayOfWeek === day &&
      schedule.startTime === timeSlot.start &&
      schedule.endTime === timeSlot.end &&
      schedule.classroom?.id === scheduleToMove.classroom?.id
    );
    
    if (classroomConflicts.length > 0) {
      conflicts.push({
        message: `Classroom ${scheduleToMove.classroom?.roomName} is already occupied at this time`
      });
    }
    
    return conflicts;
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
          {/* Add Schedule Button - Only for admins */}
          {isAdmin() && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddSchedule}
              sx={{ mr: 2 }}
            >
              Add Schedule
            </Button>
          )}
          
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
          ? `Viewing your personal schedule for ${user?.name || 'Teacher'}`
          : 'View and filter schedules by classroom, teacher, or section'
        }
      </Typography>
      
      {/* Debug info - remove this after testing */}
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          Debug Info: User Role = {user?.role || 'Not logged in'}, 
          isAdmin = {isAdmin() ? 'Yes' : 'No'}, 
          isTeacher = {isTeacher() ? 'Yes' : 'No'}
        </Typography>
      </Alert>

      {/* Filters - Only show for admins */}
      {isAdmin() && (
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

      {/* Simple Search for Teachers */}
      {isTeacher() && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <SearchIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Search Your Schedule
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={4}>
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
                  placeholder="Search by subject, classroom, section..."
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      <Box mb={2}>
        <Typography variant="h6">
          Showing {filteredSchedules.length} of {schedules.length} schedules
        </Typography>
        
        {/* Subject Mismatch Warning - Only for admins */}
        {isAdmin() && filterType === 'teacher' && selectedTeacher && (() => {
          const selectedTeacherData = teachers.find(t => t.id === selectedTeacher);
          const mismatchedSchedules = filteredSchedules.filter(schedule => 
            schedule.subject !== selectedTeacherData?.subject
          );
          
          if (mismatchedSchedules.length > 0) {
            return (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  ⚠️ <strong>Warning:</strong> Found {mismatchedSchedules.length} schedule(s) where the teacher is assigned to teach subjects they don't specialize in.
                  <br />
                  Teacher specializes in: <strong>{selectedTeacherData?.subject}</strong>
                  <br />
                  Assigned subjects: <strong>{[...new Set(mismatchedSchedules.map(s => s.subject))].join(', ')}</strong>
                </Typography>
              </Alert>
            );
          }
          return null;
        })()}
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
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSchedules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {schedule.subject || 'N/A'}
                      </Typography>
                      {schedule.teacher && schedule.subject !== schedule.teacher.subject && (
                        <Tooltip title={`⚠️ Warning: Teacher's subject is "${schedule.teacher.subject}" but assigned to teach "${schedule.subject}"`}>
                          <Chip 
                            label="⚠️" 
                            size="small" 
                            color="warning" 
                            variant="outlined"
                            sx={{ minWidth: 'auto', height: '20px' }}
                          />
                        </Tooltip>
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
                  <TableCell>
                    <Box display="flex" gap={1}>
                      {/* Edit Button */}
                      <Tooltip title="Edit Schedule">
                        <IconButton
                          size="small"
                          onClick={() => handleEditSchedule(schedule)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      
                      {/* Delete Button */}
                      <Tooltip title="Delete Schedule">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteSchedule(schedule)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
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
          {isAdmin() && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                💡 <strong>Drag & Drop:</strong> You can drag schedule cards to move them between time slots and days. 
                The system will automatically detect conflicts and prevent invalid moves.
              </Typography>
            </Alert>
          )}
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
                          
                          const isDragOver = dragOverSlot && 
                            dragOverSlot.day === day && 
                            dragOverSlot.timeSlot.start === timeSlot.start;
                          
                          const isBeingDragged = draggedSchedule && 
                            draggedSchedule.dayOfWeek === day && 
                            draggedSchedule.startTime === timeSlot.start;
                          
                          return (
                            <TableCell 
                              key={`${day}-${timeSlot.start}`} 
                              align="center"
                              onDragOver={(e) => handleDragOver(e, day, timeSlot)}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => handleDrop(e, day, timeSlot)}
                              sx={{
                                border: isDragOver ? '2px dashed #1976d2' : '1px solid #e0e0e0',
                                backgroundColor: isDragOver ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
                                transition: 'all 0.2s ease',
                                position: 'relative'
                              }}
                            >
                              {scheduleForSlot ? (
                                <Card 
                                  draggable={isAdmin()}
                                  onDragStart={(e) => handleDragStart(e, scheduleForSlot)}
                                  onDragEnd={handleDragEnd}
                                  sx={{ 
                                    p: 1, 
                                    bgcolor: isBeingDragged ? 'primary.main' : 'primary.light', 
                                    color: 'primary.contrastText',
                                    minHeight: 80,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    cursor: isAdmin() ? 'grab' : 'default',
                                    opacity: isBeingDragged ? 0.5 : 1,
                                    transform: isBeingDragged ? 'scale(0.95)' : 'scale(1)',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                      transform: isAdmin() ? 'scale(1.02)' : 'scale(1)',
                                      boxShadow: isAdmin() ? 3 : 1
                                    },
                                    '&:active': {
                                      cursor: isAdmin() ? 'grabbing' : 'default'
                                    }
                                  }}
                                >
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
                                  {isAdmin() && (
                                    <Typography variant="caption" display="block" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                                      Drag to move
                                    </Typography>
                                  )}
                                </Card>
                              ) : (
                                <Box 
                                  sx={{ 
                                    minHeight: 80, 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    border: isDragOver ? '2px dashed #4caf50' : '2px dashed transparent',
                                    borderRadius: 1,
                                    backgroundColor: isDragOver ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  <Typography 
                                    variant="caption" 
                                    color={isDragOver ? 'primary' : 'textSecondary'}
                                    sx={{ fontWeight: isDragOver ? 'bold' : 'normal' }}
                                  >
                                    {isDragOver ? 'Drop here' : 'Free'}
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

      {/* Add Schedule Dialog */}
      <Dialog open={addDialogOpen} onClose={handleCancelAdd} maxWidth="md" fullWidth>
        <DialogTitle>
          Add New Schedule
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={addFormData.date}
                onChange={handleAddFormChange('date')}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Time"
                type="time"
                value={addFormData.startTime}
                onChange={handleAddFormChange('startTime')}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Time"
                type="time"
                value={addFormData.endTime}
                onChange={handleAddFormChange('endTime')}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Day of Week</InputLabel>
                <Select
                  value={addFormData.dayOfWeek}
                  label="Day of Week"
                  onChange={handleAddFormChange('dayOfWeek')}
                >
                  <MenuItem value="MONDAY">Monday</MenuItem>
                  <MenuItem value="TUESDAY">Tuesday</MenuItem>
                  <MenuItem value="WEDNESDAY">Wednesday</MenuItem>
                  <MenuItem value="THURSDAY">Thursday</MenuItem>
                  <MenuItem value="FRIDAY">Friday</MenuItem>
                  <MenuItem value="SATURDAY">Saturday</MenuItem>
                  <MenuItem value="SUNDAY">Sunday</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Teacher</InputLabel>
                <Select
                  value={addFormData.teacher}
                  label="Teacher"
                  onChange={handleAddFormChange('teacher')}
                >
                  {teachers.map((teacher) => (
                    <MenuItem key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName} ({teacher.subject})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Classroom</InputLabel>
                <Select
                  value={addFormData.classroom}
                  label="Classroom"
                  onChange={handleAddFormChange('classroom')}
                >
                  {classrooms.map((classroom) => (
                    <MenuItem key={classroom.id} value={classroom.id}>
                      {classroom.roomName} ({classroom.roomType})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Section</InputLabel>
                <Select
                  value={addFormData.section}
                  label="Section"
                  onChange={handleAddFormChange('section')}
                >
                  {sections.map((section) => (
                    <MenuItem key={section.id} value={section.id}>
                      {section.sectionName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Subject"
                value={addFormData.subject}
                onChange={handleAddFormChange('subject')}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                value={addFormData.notes}
                onChange={handleAddFormChange('notes')}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={addFormData.isRecurring}
                      onChange={handleAddFormChange('isRecurring')}
                    />
                  }
                  label="Is Recurring Schedule"
                />
              </FormGroup>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelAdd} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveNewSchedule} 
            variant="contained" 
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Schedule'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCancelDelete}>
        <DialogTitle>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this schedule?
          </Typography>
          {scheduleToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="subtitle2">
                <strong>Subject:</strong> {scheduleToDelete.subject}
              </Typography>
              <Typography variant="subtitle2">
                <strong>Teacher:</strong> {scheduleToDelete.teacher ? 
                  `${scheduleToDelete.teacher.firstName} ${scheduleToDelete.teacher.lastName}` : 
                  'N/A'
                }
              </Typography>
              <Typography variant="subtitle2">
                <strong>Day:</strong> {scheduleToDelete.dayOfWeek}
              </Typography>
              <Typography variant="subtitle2">
                <strong>Time:</strong> {scheduleToDelete.startTime} - {scheduleToDelete.endTime}
              </Typography>
              <Typography variant="subtitle2">
                <strong>Classroom:</strong> {scheduleToDelete.classroom?.roomName || 'N/A'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            variant="contained" 
            color="error"
            startIcon={<DeleteIcon />}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete Schedule'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Schedule Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCancelEdit} maxWidth="md" fullWidth>
        <DialogTitle>
          Edit Schedule
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Time"
                type="time"
                value={editFormData.startTime}
                onChange={handleEditFormChange('startTime')}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Time"
                type="time"
                value={editFormData.endTime}
                onChange={handleEditFormChange('endTime')}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Day of Week</InputLabel>
                <Select
                  value={editFormData.dayOfWeek}
                  label="Day of Week"
                  onChange={handleEditFormChange('dayOfWeek')}
                >
                  <MenuItem value="MONDAY">Monday</MenuItem>
                  <MenuItem value="TUESDAY">Tuesday</MenuItem>
                  <MenuItem value="WEDNESDAY">Wednesday</MenuItem>
                  <MenuItem value="THURSDAY">Thursday</MenuItem>
                  <MenuItem value="FRIDAY">Friday</MenuItem>
                  <MenuItem value="SATURDAY">Saturday</MenuItem>
                  <MenuItem value="SUNDAY">Sunday</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Teacher</InputLabel>
                <Select
                  value={editFormData.teacher}
                  label="Teacher"
                  onChange={handleEditFormChange('teacher')}
                >
                  {teachers.map((teacher) => (
                    <MenuItem key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName} ({teacher.subject})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Classroom</InputLabel>
                <Select
                  value={editFormData.classroom}
                  label="Classroom"
                  onChange={handleEditFormChange('classroom')}
                >
                  {classrooms.map((classroom) => (
                    <MenuItem key={classroom.id} value={classroom.id}>
                      {classroom.roomName} ({classroom.roomType})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Subject"
                value={editFormData.subject}
                onChange={handleEditFormChange('subject')}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                value={editFormData.notes}
                onChange={handleEditFormChange('notes')}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>

          {/* Conflict Warning */}
          {showConflictWarning && conflicts.length > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Schedule Conflicts Detected!
              </Typography>
              {conflicts.map((conflict, index) => (
                <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                  • {conflict.message}
                </Typography>
              ))}
              <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                Please resolve these conflicts before saving.
              </Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEdit} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveSchedule} 
            variant="contained" 
            startIcon={<SaveIcon />}
            disabled={conflicts.length > 0}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccessSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSuccessSnackbar(false)}
      >
        <Alert severity="success" onClose={() => setShowSuccessSnackbar(false)}>
          {successMessage}
        </Alert>
      </Snackbar>

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
