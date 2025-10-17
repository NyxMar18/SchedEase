import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Chip,
  Grid,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { teacherAPI } from '../services/api';
import { subjectAPI } from '../firebase/subjectService';
import { userAPI } from '../services/userService';

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [open, setOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    subject: '',
    availableStartTime: '',
    availableEndTime: '',
    availableDays: [],
    notes: '',
  });

  const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teachersRes, subjectsRes] = await Promise.all([
        teacherAPI.getAll(),
        subjectAPI.getAll()
      ]);
      setTeachers(teachersRes.data);
      setSubjects(subjectsRes.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (teacher = null) => {
    if (teacher) {
      setEditingTeacher(teacher);
      setFormData({
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        email: teacher.email,
        subject: teacher.subject,
        availableStartTime: teacher.availableStartTime || '',
        availableEndTime: teacher.availableEndTime || '',
        availableDays: teacher.availableDays || [],
        notes: teacher.notes || '',
      });
    } else {
      setEditingTeacher(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        subject: '',
        availableStartTime: '',
        availableEndTime: '',
        availableDays: [],
        notes: '',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingTeacher(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      subject: '',
      availableStartTime: '',
      availableEndTime: '',
      availableDays: [],
      notes: '',
    });
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.firstName.trim()) {
        setError('First name is required');
        return;
      }
      if (!formData.lastName.trim()) {
        setError('Last name is required');
        return;
      }
      if (!formData.email.trim()) {
        setError('Email is required');
        return;
      }
      if (!formData.subject) {
        setError('Subject is required');
        return;
      }
      if (!formData.availableStartTime.trim()) {
        setError('Available start time is required');
        return;
      }
      if (!formData.availableEndTime.trim()) {
        setError('Available end time is required');
        return;
      }
      if (formData.availableDays.length === 0) {
        setError('At least one available day is required');
        return;
      }

      const teacherData = {
        ...formData,
        availableDays: formData.availableDays.map(day => day.toUpperCase()),
      };

      if (editingTeacher) {
        await teacherAPI.update(editingTeacher.id, teacherData);
        setSuccess('Teacher updated successfully');
      } else {
        // Create teacher
        const result = await teacherAPI.create(teacherData);
        
        // Create user account for the teacher
        if (result.success || result.data) {
          const teacherId = result.data?.id || result.id;
          const userAccountData = {
            ...teacherData,
            id: teacherId
          };
          
          try {
            await userAPI.createTeacherAccount(userAccountData);
            setSuccess('Teacher created successfully with login account');
          } catch (userError) {
            console.warn('Teacher created but user account creation failed:', userError);
            setSuccess('Teacher created successfully (login account creation failed)');
          }
        } else {
          setSuccess('Teacher created successfully');
        }
      }

      handleClose();
      fetchData();
    } catch (err) {
      setError(editingTeacher ? 'Failed to update teacher' : 'Failed to create teacher');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        await teacherAPI.delete(id);
        setSuccess('Teacher deleted successfully');
        fetchData();
      } catch (err) {
        setError('Failed to delete teacher');
      }
    }
  };

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };


  const handleDayChange = (day) => (event) => {
    setFormData(prev => ({
      ...prev,
      availableDays: event.target.checked
        ? [...prev.availableDays, day]
        : prev.availableDays.filter(d => d !== day),
    }));
  };

  return (
    <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Teacher Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
          >
            Add Teacher
          </Button>
        </Box>

        {loading ? (
          <Typography>Loading...</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Available Days</TableCell>
                  <TableCell>Available Time</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {teachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell>{teacher.firstName} {teacher.lastName}</TableCell>
                    <TableCell>{teacher.email}</TableCell>
                    <TableCell>
                      <Chip label={teacher.subject} color="secondary" size="small" />
                    </TableCell>
                    <TableCell>
                      {teacher.availableDays?.map(day => (
                        <Chip key={day} label={day} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                      ))}
                    </TableCell>
                    <TableCell>
                      {teacher.availableStartTime} - {teacher.availableEndTime}
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpen(teacher)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(teacher.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="First Name"
                  value={formData.firstName}
                  onChange={handleChange('firstName')}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Last Name"
                  value={formData.lastName}
                  onChange={handleChange('lastName')}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange('email')}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Subject</InputLabel>
                  <Select
                    value={formData.subject}
                    onChange={handleChange('subject')}
                    label="Subject"
                  >
                    {subjects.map((subject) => (
                      <MenuItem key={subject.id} value={subject.name}>
                        {subject.name} ({subject.code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Available Start Time"
                  value={formData.availableStartTime}
                  onChange={handleChange('availableStartTime')}
                  fullWidth
                  required
                  placeholder="e.g., 08:00"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Available End Time"
                  value={formData.availableEndTime}
                  onChange={handleChange('availableEndTime')}
                  fullWidth
                  required
                  placeholder="e.g., 17:00"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Available Days *
                </Typography>
                <FormGroup row>
                  {daysOfWeek.map((day) => (
                    <FormControlLabel
                      key={day}
                      control={
                        <Checkbox
                          checked={formData.availableDays.includes(day)}
                          onChange={handleDayChange(day)}
                        />
                      }
                      label={day}
                    />
                  ))}
                </FormGroup>
                {formData.availableDays.length === 0 && (
                  <Typography variant="caption" color="error">
                    Please select at least one available day
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
              
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Notes"
                  value={formData.notes}
                  onChange={handleChange('notes')}
                  fullWidth
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingTeacher ? 'Update' : 'Create'}
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
  );
};

export default TeacherManagement;
