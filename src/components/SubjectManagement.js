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
  Alert,
  Snackbar,
  Chip,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Book as BookIcon,
} from '@mui/icons-material';
import { subjectAPI } from '../firebase/subjectService';

const SubjectManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [open, setOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    category: '',
    requiredRoomType: '',
    durationPerWeek: '',
  });

  const categories = [
    'Mathematics',
    'Science',
    'Social Science',
    'Social Studies',
    'Physical Education',
    'English',
    'ABM',
    'Filipino'

  

  ];


  const roomTypes = [
    'Chemistry Lab',
    'Biology Lab',
    'Physics Lab',
    'Computer Lab',
    'Lecture Room',
    'Physical Education Area',
  ];

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await subjectAPI.getAll();
      setSubjects(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (subject = null) => {
    if (subject) {
      setEditingSubject(subject);
      setFormData({
        name: subject.name,
        code: subject.code,
        description: subject.description || '',
        category: subject.category || '',
        requiredRoomType: subject.requiredRoomType || '',
        durationPerWeek: subject.durationPerWeek || '',
      });
    } else {
      setEditingSubject(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        category: '',
        requiredRoomType: '',
        durationPerWeek: '',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingSubject(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      category: '',
      requiredRoomType: '',
      durationPerWeek: '',
    });
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.name.trim()) {
        setError('Subject name is required');
        return;
      }
      if (!formData.code.trim()) {
        setError('Subject code is required');
        return;
      }
      if (!formData.category) {
        setError('Subject category is required');
        return;
      }
      if (!formData.requiredRoomType) {
        setError('Required room type is required');
        return;
      }
      if (!formData.durationPerWeek || formData.durationPerWeek <= 0) {
        setError('Duration per week must be a positive number');
        return;
      }

      if (editingSubject) {
        await subjectAPI.update(editingSubject.id, formData);
        setSuccess('Subject updated successfully');
      } else {
        await subjectAPI.create(formData);
        setSuccess('Subject created successfully');
      }

      handleClose();
      fetchSubjects();
    } catch (err) {
      setError(editingSubject ? 'Failed to update subject' : 'Failed to create subject');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      try {
        await subjectAPI.delete(id);
        setSuccess('Subject deleted successfully');
        fetchSubjects();
      } catch (err) {
        setError('Failed to delete subject');
      }
    }
  };

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const getCategoryChip = (category) => {
    const categoryColors = {
      'Mathematics': 'primary',
      'Science': 'success',
      'Social Science': 'info',
      'Physical Education': 'secondary',
      'English': 'error',
      'ABM': 'default',
      'Filipino': 'primary'
    };
    
    return (
      <Chip 
        label={category} 
        color={categoryColors[category] || 'default'} 
        size="small" 
      />
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          <BookIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Subject Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Add Subject
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary">
                {subjects.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Subjects
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="success.main">
                {new Set(subjects.map(s => s.category)).size}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Categories
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="info.main">
                {subjects.filter(s => s.category === 'Mathematics').length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Math Subjects
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="warning.main">
                {subjects.filter(s => s.category === 'Science').length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Science Subjects
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {loading ? (
        <Typography>Loading...</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
                <TableRow>
                  <TableCell>Subject Name</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Required Room</TableCell>
                  <TableCell>Duration/Week</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
              {subjects.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {subject.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={subject.code} color="primary" size="small" />
                  </TableCell>
                  <TableCell>
                    {getCategoryChip(subject.category)}
                  </TableCell>
                  <TableCell>
                    <Chip label={subject.requiredRoomType || 'Any'} color="info" size="small" />
                  </TableCell>
                  <TableCell>{subject.durationPerWeek || '-'} hours</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpen(subject)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(subject.id)} color="error">
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
          {editingSubject ? 'Edit Subject' : 'Add New Subject'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Subject Name"
                value={formData.name}
                onChange={handleChange('name')}
                fullWidth
                required
                placeholder="e.g., Advanced Mathematics"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Subject Code"
                value={formData.code}
                onChange={handleChange('code')}
                fullWidth
                required
                placeholder="e.g., MATH101"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                value={formData.category}
                onChange={handleChange('category')}
                fullWidth
                select
                SelectProps={{
                  native: true,
                }}
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                value={formData.requiredRoomType}
                onChange={handleChange('requiredRoomType')}
                fullWidth
                select
                required
                SelectProps={{
                  native: true,
                }}
              >
                <option value="">Select Room Type</option>
                {roomTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Duration Per Week (hours)"
                type="number"
                value={formData.durationPerWeek}
                onChange={handleChange('durationPerWeek')}
                fullWidth
                required
                inputProps={{ min: 1, max: 20 }}
                placeholder="e.g., 3"
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
                placeholder="Brief description of the subject"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingSubject ? 'Update' : 'Create'}
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

export default SubjectManagement;
