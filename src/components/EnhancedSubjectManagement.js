import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
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
  LinearProgress,
  Chip,
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
  Schedule as ScheduleIcon,
  School as SchoolIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { subjectApi } from '../services/backendApi';

const EnhancedSubjectManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    durationPerWeek: '',
    requiredRoomTypes: [],
    priority: '',
    description: '',
  });

  const roomTypes = ['Regular Classroom', 'Computer Lab', 'Science Lab', 'Library', 'Gymnasium', 'Art Room', 'Music Room', 'Any'];
  const priorities = [
    { value: 1, label: 'Low Priority' },
    { value: 2, label: 'Medium Priority' },
    { value: 3, label: 'High Priority' },
    { value: 4, label: 'Critical Priority' },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await subjectApi.getAll();
      
      if (result.success) {
        setSubjects(result.data);
        setError(null);
      } else {
        setError('Failed to fetch subjects: ' + result.error);
      }
    } catch (err) {
      setError('Failed to fetch subjects: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (subject = null) => {
    setEditingSubject(subject);
    if (subject) {
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
        name: subject.name || '',
        code: subject.code || '',
        durationPerWeek: subject.durationPerWeek || '',
        requiredRoomTypes: roomTypes,
        priority: subject.priority || '',
        description: subject.description || '',
      });
    } else {
      setFormData({
        name: '',
        code: '',
        durationPerWeek: '',
        requiredRoomTypes: [],
        priority: '',
        description: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSubject(null);
    setFormData({
      name: '',
      code: '',
      durationPerWeek: '',
      requiredRoomTypes: [],
      priority: '',
      description: '',
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Validate that sum of durations matches total duration
      const totalRoomTypeDuration = (formData.requiredRoomTypes || []).reduce((sum, rt) => sum + (parseFloat(rt.duration) || 0), 0);
      const totalDuration = parseFloat(formData.durationPerWeek) || 0;
      
      if (formData.requiredRoomTypes && formData.requiredRoomTypes.length > 0 && 
          Math.abs(totalRoomTypeDuration - totalDuration) > 0.01) {
        setError(`Sum of room type durations (${totalRoomTypeDuration.toFixed(1)}h) must equal total duration (${totalDuration}h)`);
        setLoading(false);
        return;
      }
      
      const subjectData = {
        ...formData,
        durationPerWeek: parseInt(formData.durationPerWeek),
        priority: parseInt(formData.priority),
        requiredRoomTypes: formData.requiredRoomTypes || [],
      };

      let result;
      if (editingSubject) {
        result = await subjectApi.update(editingSubject.id, subjectData);
      } else {
        result = await subjectApi.create(subjectData);
      }

      if (result.success) {
        setSuccess(`Subject ${editingSubject ? 'updated' : 'created'} successfully`);
        await fetchData();
        handleCloseDialog();
      } else {
        setError(`Failed to ${editingSubject ? 'update' : 'create'} subject: ${result.error}`);
      }
    } catch (err) {
      setError(`Failed to ${editingSubject ? 'update' : 'create'} subject: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) {
      return;
    }

    try {
      setLoading(true);
      const result = await subjectApi.delete(id);
      
      if (result.success) {
        setSuccess('Subject deleted successfully');
        await fetchData();
      } else {
        setError('Failed to delete subject: ' + result.error);
      }
    } catch (err) {
      setError('Failed to delete subject: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1: return 'default';
      case 2: return 'info';
      case 3: return 'warning';
      case 4: return 'error';
      default: return 'default';
    }
  };

  const getPriorityLabel = (priority) => {
    const priorityObj = priorities.find(p => p.value === priority);
    return priorityObj ? priorityObj.label : 'Unknown';
  };

  const getRoomTypeColor = (roomType) => {
    switch (roomType) {
      case 'Computer Lab': return 'info';
      case 'Science Lab': return 'warning';
      case 'Gymnasium': return 'success';
      case 'Library': return 'secondary';
      case 'Any': return 'default';
      default: return 'primary';
    }
  };

  if (loading && subjects.length === 0) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Subject Management
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          <BookIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Subject Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Subject
        </Button>
      </Box>

      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Manage subjects, their duration, required room types, and scheduling priorities.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BookIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Subjects</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {subjects.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ScheduleIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Hours/Week</Typography>
              </Box>
              <Typography variant="h4" color="secondary">
                {subjects.reduce((sum, subject) => sum + (subject.durationPerWeek || 0), 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SchoolIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Room Types</Typography>
              </Box>
              <Typography variant="h4" color="info">
                {new Set(subjects.flatMap(s => {
                  if (s.requiredRoomTypes && Array.isArray(s.requiredRoomTypes)) {
                    return s.requiredRoomTypes;
                  } else if (s.requiredRoomType) {
                    return [s.requiredRoomType];
                  }
                  return [];
                })).size}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StarIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">High Priority</Typography>
              </Box>
              <Typography variant="h4" color="warning">
                {subjects.filter(s => s.priority >= 3).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Subjects Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Subjects ({subjects.length})
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Subject Name</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Hours/Week</TableCell>
                  <TableCell>Room Type</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No subjects found. Click "Add Subject" to create one.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  subjects.map((subject) => (
                    <TableRow key={subject.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {subject.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={subject.code} color="primary" size="small" />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <ScheduleIcon sx={{ mr: 1, fontSize: 16 }} />
                          <Typography variant="body2">
                            {subject.durationPerWeek} hours
                          </Typography>
                        </Box>
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
                            return <Chip label="Any" color={getRoomTypeColor('Any')} size="small" variant="outlined" />;
                          }
                          
                          return (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {roomTypes.map((rt, idx) => (
                                <Chip
                                  key={idx}
                                  label={rt.duration ? `${rt.type} (${rt.duration}h)` : rt.type || rt}
                                  color={getRoomTypeColor(rt.type || rt)}
                                  size="small"
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getPriorityLabel(subject.priority)}
                          color={getPriorityColor(subject.priority)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {subject.description || 'No description'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(subject)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(subject.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingSubject ? 'Edit Subject' : 'Add New Subject'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Subject Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Subject Code"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                required
                placeholder="e.g., MATH101"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Duration Per Week (Hours)"
                type="number"
                value={formData.durationPerWeek}
                onChange={(e) => setFormData(prev => ({ ...prev, durationPerWeek: e.target.value }))}
                required
                inputProps={{ min: 0.5, max: 20, step: 0.5 }}
                helperText="Total hours for all room types combined"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Required Room Types with Durations</InputLabel>
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
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  label="Priority"
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                >
                  {priorities.map((priority) => (
                    <MenuItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description of the subject"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !formData.name || !formData.code || !formData.durationPerWeek || !formData.requiredRoomTypes || formData.requiredRoomTypes.length === 0 || !formData.priority || (() => {
              const total = formData.requiredRoomTypes?.reduce((sum, rt) => sum + (parseFloat(rt.duration) || 0), 0) || 0;
              const expected = parseFloat(formData.durationPerWeek) || 0;
              return Math.abs(total - expected) > 0.01;
            })()}
          >
            {editingSubject ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {loading && <LinearProgress sx={{ mt: 2 }} />}
    </Box>
  );
};

export default EnhancedSubjectManagement;

