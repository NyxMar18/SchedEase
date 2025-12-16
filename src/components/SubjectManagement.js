import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
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
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Collapse,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Book as BookIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
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
    combineRoomTypes: false, // Combine multiple room types into one session
    gradeLevel: '', // Grade 11 or Grade 12
  });
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [categoryFilter, setCategoryFilter] = useState('');

  const toggleCard = (id) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const categories = [
    'Core',
    'Applied',
    'Specialized'
  ];

  const gradeLevels = ['Grade 11', 'Grade 12'];


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
        combineRoomTypes: subject.combineRoomTypes || subject.useMultipleRoomTypesInOneSession || false,
        gradeLevel: subject.gradeLevel || '',
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
        combineRoomTypes: false,
        gradeLevel: '',
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
      gradeLevel: '',
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
      'Core': 'primary',
      'Applied': 'success',
      'Specialized': 'info'
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

      {/* Category Filter */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Category</InputLabel>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            label="Filter by Category"
          >
            <MenuItem value="">
              <em>All Categories</em>
            </MenuItem>
            {categories.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {categoryFilter && (
          <Chip
            label={`Showing: ${categoryFilter}`}
            onDelete={() => setCategoryFilter('')}
            color="primary"
            variant="outlined"
          />
        )}
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
              <Typography variant="h4" color="primary.main">
                {subjects.filter(s => s.category === 'Core').length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Core Subjects
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="success.main">
                {subjects.filter(s => s.category === 'Applied').length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Applied Subjects
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="info.main">
                {subjects.filter(s => s.category === 'Specialized').length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Specialized Subjects
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {loading ? (
        <Typography>Loading...</Typography>
      ) : (() => {
        // Filter subjects by category
        const filteredSubjects = categoryFilter
          ? subjects.filter(subject => subject.category === categoryFilter)
          : subjects;

        return filteredSubjects.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary">
              {categoryFilter
                ? `No ${categoryFilter} subjects found.`
                : 'No subjects found. Click "Add Subject" to get started.'}
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {filteredSubjects.map((subject) => {
            const isExpanded = expandedCards.has(subject.id);
            // Handle backward compatibility for room types
            let roomTypes = [];
            if (subject.requiredRoomTypes && Array.isArray(subject.requiredRoomTypes)) {
              if (subject.requiredRoomTypes.length > 0 && typeof subject.requiredRoomTypes[0] === 'object') {
                roomTypes = subject.requiredRoomTypes;
              } else {
                roomTypes = subject.requiredRoomTypes.map(type => ({ type, duration: null }));
              }
            } else if (subject.requiredRoomType) {
              roomTypes = [{ type: subject.requiredRoomType, duration: subject.durationPerWeek }];
            }
            
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={subject.id}>
                <Card
                  sx={{
                    transition: 'all 0.3s ease-in-out',
                    borderLeft: '4px solid',
                    borderLeftColor: subject.category === 'Core' ? 'primary.main' : subject.category === 'Applied' ? 'success.main' : 'info.main',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => toggleCard(subject.id)}
                >
                  <CardContent
                    sx={{
                      p: 2,
                      '&:last-child': { pb: isExpanded ? 2 : 2 },
                    }}
                  >
                    {/* Collapsed view - just subject name */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="h6"
                          component="div"
                          sx={{
                            fontWeight: 600,
                            color: 'primary.main',
                          }}
                        >
                          {subject.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                          {subject.code}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCard(subject.id);
                        }}
                        sx={{ ml: 1 }}
                      >
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>

                    {/* Expanded view - all details */}
                    <Collapse in={isExpanded} timeout="auto">
                      <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <Box>
                              <Typography
                                variant="caption"
                                color="textSecondary"
                                sx={{
                                  textTransform: 'uppercase',
                                  fontWeight: 600,
                                  letterSpacing: 0.5,
                                  fontSize: '0.7rem',
                                }}
                              >
                                Category
                              </Typography>
                              <Box sx={{ mt: 0.5 }}>
                                {getCategoryChip(subject.category)}
                              </Box>
                            </Box>
                          </Grid>
                          <Grid item xs={12}>
                            <Box>
                              <Typography
                                variant="caption"
                                color="textSecondary"
                                sx={{
                                  textTransform: 'uppercase',
                                  fontWeight: 600,
                                  letterSpacing: 0.5,
                                  fontSize: '0.7rem',
                                }}
                              >
                                Grade Level
                              </Typography>
                              <Box sx={{ mt: 0.5 }}>
                                <Chip
                                  label={subject.gradeLevel || 'N/A'}
                                  color="secondary"
                                  size="small"
                                  sx={{ fontWeight: 500 }}
                                />
                              </Box>
                            </Box>
                          </Grid>
                          <Grid item xs={12}>
                            <Box>
                              <Typography
                                variant="caption"
                                color="textSecondary"
                                sx={{
                                  textTransform: 'uppercase',
                                  fontWeight: 600,
                                  letterSpacing: 0.5,
                                  fontSize: '0.7rem',
                                }}
                              >
                                Required Room Types
                              </Typography>
                              <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {roomTypes.length === 0 ? (
                                  <Chip label="Any" color="info" size="small" />
                                ) : (
                                  roomTypes.map((rt, idx) => (
                                    <Chip
                                      key={idx}
                                      label={rt.duration ? `${rt.type} (${rt.duration}h)` : rt.type}
                                      color="info"
                                      size="small"
                                    />
                                  ))
                                )}
                              </Box>
                            </Box>
                          </Grid>
                          <Grid item xs={12}>
                            <Box>
                              <Typography
                                variant="caption"
                                color="textSecondary"
                                sx={{
                                  textTransform: 'uppercase',
                                  fontWeight: 600,
                                  letterSpacing: 0.5,
                                  fontSize: '0.7rem',
                                }}
                              >
                                Duration Per Week
                              </Typography>
                              <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5 }}>
                                {subject.durationPerWeek || '-'} hours
                              </Typography>
                            </Box>
                          </Grid>
                          {subject.description && (
                            <Grid item xs={12}>
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="textSecondary"
                                  sx={{
                                    textTransform: 'uppercase',
                                    fontWeight: 600,
                                    letterSpacing: 0.5,
                                    fontSize: '0.7rem',
                                  }}
                                >
                                  Description
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                  {subject.description}
                                </Typography>
                              </Box>
                            </Grid>
                          )}
                          <Grid item xs={12}>
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<EditIcon />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpen(subject);
                                }}
                                color="primary"
                                fullWidth
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<DeleteIcon />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(subject.id);
                                }}
                                color="error"
                                fullWidth
                              >
                                Delete
                              </Button>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    </Collapse>
                  </CardContent>
                </Card>
              </Grid>
            );
            })}
          </Grid>
        );
      })()}

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
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={handleChange('category')}
                  label="Category"
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Grade Level</InputLabel>
                <Select
                  value={formData.gradeLevel}
                  onChange={handleChange('gradeLevel')}
                  label="Grade Level"
                >
                  {gradeLevels.map((level) => (
                    <MenuItem key={level} value={level}>
                      {level}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
                {formData.requiredRoomTypes && formData.requiredRoomTypes.length > 1 && (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.combineRoomTypes || false}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            combineRoomTypes: e.target.checked
                          }));
                        }}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2">
                          Combine multiple room types into one session
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          If checked, all selected room types will be used in a single 1.5-hour session instead of separate sessions
                        </Typography>
                      </Box>
                    }
                    sx={{ mt: 1 }}
                  />
                )}
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
