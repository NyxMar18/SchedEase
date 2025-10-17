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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { classroomAPI } from '../services/api';

const ClassroomManagement = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [open, setOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [formData, setFormData] = useState({
    roomName: '',
    roomCode: '',
    roomType: '',
    capacity: '',
    location: '',
    description: '',
  });

  const roomTypes = ['Lecture Hall', 'Laboratory', 'Computer Lab', 'Library', 'Auditorium', 'Meeting Room'];

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      const response = await classroomAPI.getAll();
      setClassrooms(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch classrooms');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (classroom = null) => {
    if (classroom) {
      setEditingClassroom(classroom);
      setFormData({
        roomName: classroom.roomName,
        roomCode: classroom.roomCode || '',
        roomType: classroom.roomType,
        capacity: classroom.capacity.toString(),
        location: classroom.location || '',
        description: classroom.description || '',
      });
    } else {
      setEditingClassroom(null);
      setFormData({
        roomName: '',
        roomCode: '',
        roomType: '',
        capacity: '',
        location: '',
        description: '',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingClassroom(null);
    setFormData({
      roomName: '',
      roomCode: '',
      roomType: '',
      capacity: '',
      location: '',
      description: '',
    });
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.roomName.trim()) {
        setError('Room name is required');
        return;
      }
      if (!formData.roomCode.trim()) {
        setError('Room code is required');
        return;
      }
      if (!formData.roomType) {
        setError('Room type is required');
        return;
      }
      if (!formData.capacity || formData.capacity <= 0) {
        setError('Capacity must be a positive number');
        return;
      }
      if (!formData.location.trim()) {
        setError('Location is required');
        return;
      }

      const classroomData = {
        ...formData,
        capacity: parseInt(formData.capacity),
      };

      if (editingClassroom) {
        await classroomAPI.update(editingClassroom.id, classroomData);
        setSuccess('Classroom updated successfully');
      } else {
        await classroomAPI.create(classroomData);
        setSuccess('Classroom created successfully');
      }

      handleClose();
      fetchClassrooms();
    } catch (err) {
      setError(editingClassroom ? 'Failed to update classroom' : 'Failed to create classroom');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this classroom?')) {
      try {
        await classroomAPI.delete(id);
        setSuccess('Classroom deleted successfully');
        fetchClassrooms();
      } catch (err) {
        setError('Failed to delete classroom');
      }
    }
  };

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Classroom Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Add Classroom
        </Button>
      </Box>

      {loading ? (
        <Typography>Loading...</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Room Name</TableCell>
                <TableCell>Room Code</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Capacity</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {classrooms.map((classroom) => (
                <TableRow key={classroom.id}>
                  <TableCell>{classroom.roomName}</TableCell>
                  <TableCell>{classroom.roomCode || '-'}</TableCell>
                  <TableCell>
                    <Chip label={classroom.roomType} color="primary" size="small" />
                  </TableCell>
                  <TableCell>{classroom.capacity}</TableCell>
                  <TableCell>{classroom.location || '-'}</TableCell>
                  <TableCell>{classroom.description || '-'}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpen(classroom)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(classroom.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingClassroom ? 'Edit Classroom' : 'Add New Classroom'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Room Name"
                value={formData.roomName}
                onChange={handleChange('roomName')}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Room Code"
                value={formData.roomCode}
                onChange={handleChange('roomCode')}
                fullWidth
                required
                placeholder="e.g., R101, LAB1"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Room Type</InputLabel>
                <Select
                  value={formData.roomType}
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
            <Grid item xs={12} sm={6}>
              <TextField
                label="Capacity"
                type="number"
                value={formData.capacity}
                onChange={handleChange('capacity')}
                fullWidth
                required
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Location"
                value={formData.location}
                onChange={handleChange('location')}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                value={formData.description}
                onChange={handleChange('description')}
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
            {editingClassroom ? 'Update' : 'Create'}
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

export default ClassroomManagement;
