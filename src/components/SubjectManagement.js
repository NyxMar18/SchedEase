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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
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
    requiredRoomTypes: [], // Array of {type: string, duration: number}
    durationPerWeek: '',
  });

  const categories = [
    'Mathematics',
    'Science',
    'Social Science',
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
      // Handle backward compatibility: convert to array of objects with duration
      let roomTypes = [];
      if (subject.requiredRoomTypes && Array.isArray(subject.requiredRoomTypes)) {
        // Check if it's already in new format (array of objects) or old format (array of strings)
        if (subject.requiredRoomTypes.length > 0 && typeof subject.requiredRoomTypes[0] === 'object') {
          roomTypes = subject.requiredRoomTypes;
        } else {
          // Old format: array of strings - distribute duration evenly
          const totalDuration = parseInt(subject.durationPerWeek) || 1;
          const perType = totalDuration / subject.requiredRoomTypes.length;
          roomTypes = subject.requiredRoomTypes.map(type => ({ type, duration: perType }));
        }
      } else if (subject.requiredRoomType) {
        // Old format: single string
        roomTypes = [{ type: subject.requiredRoomType, duration: parseInt(subject.durationPerWeek) || 1 }];
      }
      
      setFormData({
        name: subject.name,
        code: subject.code,
        description: subject.description || '',
        category: subject.category || '',
        requiredRoomTypes: roomTypes,
        durationPerWeek: subject.durationPerWeek || '',
      });
    } else {
      setEditingSubject(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        category: '',
        requiredRoomTypes: [],
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
      requiredRoomTypes: [],
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
      if (!formData.requiredRoomTypes || formData.requiredRoomTypes.length === 0) {
        setError('At least one required room type is required');
        return;
      }
      
      // Validate that sum of durations matches total duration
      const totalRoomTypeDuration = formData.requiredRoomTypes.reduce((sum, rt) => sum + (parseFloat(rt.duration) || 0), 0);
      const totalDuration = parseFloat(formData.durationPerWeek) || 0;
      
      if (Math.abs(totalRoomTypeDuration - totalDuration) > 0.01) {
        setError(`Sum of room type durations (${totalRoomTypeDuration.toFixed(1)}h) must equal total duration (${totalDuration}h)`);
        return;
      }
      if (!formData.durationPerWeek || formData.durationPerWeek <= 0) {
        setError('Duration per week must be a positive number');
        return;
      }

      // Ensure requiredRoomTypes is saved as array
      const subjectData = {
        ...formData,
        requiredRoomTypes: formData.requiredRoomTypes || [],
      };
      
      if (editingSubject) {
        await subjectAPI.update(editingSubject.id, subjectData);
        setSuccess('Subject updated successfully');
      } else {
        await subjectAPI.create(subjectData);
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
                    {(() => {
                      // Handle backward compatibility
                      let roomTypes = [];
                      if (subject.requiredRoomTypes && Array.isArray(subject.requiredRoomTypes)) {
                        if (subject.requiredRoomTypes.length > 0 && typeof subject.requiredRoomTypes[0] === 'object') {
                          roomTypes = subject.requiredRoomTypes;
                        } else {
                          // Old format: array of strings
                          roomTypes = subject.requiredRoomTypes.map(type => ({ type, duration: null }));
                        }
                      } else if (subject.requiredRoomType) {
                        roomTypes = [{ type: subject.requiredRoomType, duration: subject.durationPerWeek }];
                      }
                      
                      if (roomTypes.length === 0) {
                        return <Chip label="Any" color="info" size="small" />;
                      }
                      
                      return (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {roomTypes.map((rt, idx) => (
                            <Chip 
                              key={idx} 
                              label={rt.duration ? `${rt.type} (${rt.duration}h)` : rt.type} 
                              color="info" 
                              size="small" 
                            />
                          ))}
                        </Box>
                      );
                    })()}
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
                label="Duration Per Week (hours)"
                type="number"
                value={formData.durationPerWeek}
                onChange={handleChange('durationPerWeek')}
                fullWidth
                required
                inputProps={{ min: 0.5, max: 20, step: 0.5 }}
                placeholder="e.g., 3"
                helperText="Total hours for all room types combined"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block' }}>
                  Select room types and specify duration for each. Total must equal Duration Per Week.
                </Typography>
                <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, maxHeight: 300, overflowY: 'auto' }}>
                  {roomTypes.map((type) => {
                    const existing = formData.requiredRoomTypes?.find(rt => rt.type === type);
                    const isSelected = !!existing;
                    
                    return (
                      <Box key={type} sx={{ mb: 2, p: 1.5, border: 1, borderColor: isSelected ? 'primary.main' : 'divider', borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: isSelected ? 1 : 0 }}>
                          <Checkbox
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                // Add room type with default duration
                                const currentCount = (formData.requiredRoomTypes?.length || 0) + 1;
                                const defaultDuration = formData.durationPerWeek 
                                  ? (parseFloat(formData.durationPerWeek) / currentCount).toFixed(1)
                                  : '1';
                                setFormData(prev => ({
                                  ...prev,
                                  requiredRoomTypes: [...(prev.requiredRoomTypes || []), { type, duration: defaultDuration }],
                                }));
                              } else {
                                // Remove room type
                                setFormData(prev => ({
                                  ...prev,
                                  requiredRoomTypes: (prev.requiredRoomTypes || []).filter(rt => rt.type !== type),
                                }));
                              }
                            }}
                          />
                          <Typography variant="body2" sx={{ flexGrow: 1 }}>
                            {type}
                          </Typography>
                        </Box>
                        {isSelected && (
                          <TextField
                            label={`Duration for ${type} (hours)`}
                            type="number"
                            value={existing.duration || ''}
                            onChange={(e) => {
                              const newDuration = e.target.value;
                              setFormData(prev => ({
                                ...prev,
                                requiredRoomTypes: (prev.requiredRoomTypes || []).map(rt => 
                                  rt.type === type ? { ...rt, duration: newDuration } : rt
                                ),
                              }));
                            }}
                            size="small"
                            fullWidth
                            inputProps={{ min: 0.5, max: 20, step: 0.5 }}
                            helperText={(() => {
                              const currentTotal = (formData.requiredRoomTypes || []).reduce((sum, rt) => {
                                return sum + (parseFloat(rt.duration) || 0);
                              }, 0);
                              const remaining = (parseFloat(formData.durationPerWeek) || 0) - currentTotal;
                              return `Remaining: ${remaining >= 0 ? remaining.toFixed(1) : '0'}h`;
                            })()}
                          />
                        )}
                      </Box>
                    );
                  })}
                </Box>
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  Total allocated: {formData.requiredRoomTypes?.reduce((sum, rt) => sum + (parseFloat(rt.duration) || 0), 0).toFixed(1) || 0}h / {formData.durationPerWeek || 0}h
                </Typography>
              </FormControl>
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
