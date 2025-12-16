import React, { useState, useEffect, useMemo } from 'react';
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
  Card,
  CardContent,
  Collapse,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { teacherAPI } from '../services/api';
import { subjectAPI } from '../firebase/subjectService';
import { sectionAPI } from '../firebase/sectionService';
import { userAPI } from '../services/userService';

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [open, setOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    subjects: [],
    assignedSections: [],
    availableStartTime: '',
    availableEndTime: '',
    availableDays: [],
    notes: '',
  });
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [subjectCategoryFilter, setSubjectCategoryFilter] = useState('');
  const [subjectsDropdownOpen, setSubjectsDropdownOpen] = useState(false);
  const [sectionSemesterFilter, setSectionSemesterFilter] = useState('');
  const [sectionGradeLevelFilter, setSectionGradeLevelFilter] = useState('');
  const [sectionsDropdownOpen, setSectionsDropdownOpen] = useState(false);

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

  const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  const subjectCategories = ['Core', 'Applied', 'Specialized'];
  const gradeLevels = ['Grade 11', 'Grade 12'];
  const semesters = ['Semester 1', 'Semester 2'];

  // Filter subjects by category for better UX in subject selection
  const filteredSubjects = useMemo(() => {
    if (!subjectCategoryFilter) {
      return subjects;
    }
    return subjects.filter(subject => subject.category === subjectCategoryFilter);
  }, [subjects, subjectCategoryFilter]);

  // Filter sections by semester and grade level for better UX
  const filteredSections = useMemo(() => {
    let filtered = sections;
    
    if (sectionSemesterFilter) {
      filtered = filtered.filter(section => section.semester === sectionSemesterFilter);
    }
    
    if (sectionGradeLevelFilter) {
      filtered = filtered.filter(section => section.gradeLevel === sectionGradeLevelFilter);
    }
    
    return filtered;
  }, [sections, sectionSemesterFilter, sectionGradeLevelFilter]);

  // Sort teachers alphabetically by last name, then first name
  const sortedTeachers = useMemo(() => {
    return [...teachers].sort((a, b) => {
      const aLastName = (a.lastName || '').toLowerCase();
      const bLastName = (b.lastName || '').toLowerCase();
      const aFirstName = (a.firstName || '').toLowerCase();
      const bFirstName = (b.firstName || '').toLowerCase();
      
      // First compare by last name
      if (aLastName !== bLastName) {
        return aLastName.localeCompare(bLastName);
      }
      // If last names are the same, compare by first name
      return aFirstName.localeCompare(bFirstName);
    });
  }, [teachers]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teachersRes, subjectsRes, sectionsRes] = await Promise.all([
        teacherAPI.getAll(),
        subjectAPI.getAll(),
        sectionAPI.getAll()
      ]);
      setTeachers(teachersRes.data);
      setSubjects(subjectsRes.data);
      setSections(sectionsRes.data);
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
        subjects: teacher.subjects || [],
        assignedSections: teacher.assignedSections || [],
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
        subjects: [],
        assignedSections: [],
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
    setSubjectCategoryFilter('');
    setSectionSemesterFilter('');
    setSectionGradeLevelFilter('');
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      subjects: [],
      assignedSections: [],
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
      // Check if email is already used (only when creating a new teacher, not when editing)
      if (!editingTeacher) {
        const emailExists = teachers.some(
          teacher => teacher.email.toLowerCase() === formData.email.trim().toLowerCase()
        );
        if (emailExists) {
          setError('This email is already in use. Please use a different email address.');
          return;
        }
      } else {
        // When editing, check if email is used by another teacher
        const emailExists = teachers.some(
          teacher => teacher.id !== editingTeacher.id && 
                     teacher.email.toLowerCase() === formData.email.trim().toLowerCase()
        );
        if (emailExists) {
          setError('This email is already in use by another teacher. Please use a different email address.');
          return;
        }
      }
      if (!formData.subjects || formData.subjects.length === 0) {
        setError('At least one subject is required');
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
        ) : sortedTeachers.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary">
              No teachers found. Click "Add Teacher" to get started.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {sortedTeachers.map((teacher) => {
              const isExpanded = expandedCards.has(teacher.id);
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={teacher.id}>
                  <Card
                    sx={{
                      transition: 'all 0.3s ease-in-out',
                      borderLeft: '4px solid',
                      borderLeftColor: 'secondary.main',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 4,
                      },
                    }}
                    onClick={() => toggleCard(teacher.id)}
                  >
                    <CardContent
                      sx={{
                        p: 2,
                        '&:last-child': { pb: isExpanded ? 2 : 2 },
                      }}
                    >
                      {/* Collapsed view - just teacher name */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="h6"
                            component="div"
                            sx={{
                              fontWeight: 600,
                              color: 'secondary.main',
                            }}
                          >
                            {teacher.firstName} {teacher.lastName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                            {teacher.email}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCard(teacher.id);
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
                                  Subjects
                                </Typography>
                                <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {teacher.subjects && teacher.subjects.length > 0 ? (
                                    teacher.subjects.map(subject => (
                                      <Chip key={subject} label={subject} color="secondary" size="small" />
                                    ))
                                  ) : (
                                    <Chip label={teacher.subject || 'N/A'} color="secondary" size="small" />
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
                                  Assigned Sections
                                </Typography>
                                <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {teacher.assignedSections && teacher.assignedSections.length > 0 ? (
                                    teacher.assignedSections.map(sectionId => {
                                      const section = sections.find(s => s.id === sectionId);
                                      return section ? (
                                        <Chip
                                          key={sectionId}
                                          label={`${section.sectionName}${section.semester ? ` (${section.semester})` : ''}`}
                                          color="primary"
                                          size="small"
                                        />
                                      ) : null;
                                    })
                                  ) : (
                                    <Typography variant="body2" color="textSecondary">None</Typography>
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
                                  Available Days
                                </Typography>
                                <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {teacher.availableDays && teacher.availableDays.length > 0 ? (
                                    teacher.availableDays.map(day => (
                                      <Chip key={day} label={day} size="small" />
                                    ))
                                  ) : (
                                    <Typography variant="body2" color="textSecondary">Not specified</Typography>
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
                                  Available Time
                                </Typography>
                                <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5 }}>
                                  {teacher.availableStartTime} - {teacher.availableEndTime}
                                </Typography>
                              </Box>
                            </Grid>
                            {teacher.notes && (
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
                                    Notes
                                  </Typography>
                                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                                    {teacher.notes}
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
                                    handleOpen(teacher);
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
                                    handleDelete(teacher.id);
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
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Subjects</InputLabel>
                  <Select
                    multiple
                    value={formData.subjects}
                    onChange={handleChange('subjects')}
                    label="Subjects"
                    onOpen={() => setSubjectsDropdownOpen(true)}
                    onClose={() => {
                      setSubjectsDropdownOpen(false);
                      // Reset filter when closing dropdown
                      setSubjectCategoryFilter('');
                    }}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 400,
                        },
                      },
                    }}
                  >
                    <Box 
                      component="div"
                      sx={{ 
                        p: 1.5, 
                        borderBottom: '1px solid', 
                        borderColor: 'divider', 
                        bgcolor: 'background.paper',
                        position: 'sticky',
                        top: 0,
                        zIndex: 1
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <FormControl fullWidth size="small">
                        <InputLabel>Filter by Category</InputLabel>
                        <Select
                          value={subjectCategoryFilter}
                          onChange={(e) => {
                            e.stopPropagation();
                            setSubjectCategoryFilter(e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          label="Filter by Category"
                        >
                          <MenuItem value="">
                            <em>All Categories</em>
                          </MenuItem>
                          {subjectCategories.map((category) => (
                            <MenuItem key={category} value={category}>
                              {category}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                    {filteredSubjects.length === 0 ? (
                      <MenuItem disabled>
                        <Typography variant="body2" color="textSecondary">
                          No subjects found in this category
                        </Typography>
                      </MenuItem>
                    ) : (
                      filteredSubjects.map((subject) => (
                        <MenuItem 
                          key={subject.id} 
                          value={subject.name}
                        >
                          {subject.name} ({subject.code})
                          {subject.category && (
                            <Chip 
                              label={subject.category} 
                              size="small" 
                              sx={{ ml: 1, height: 20 }} 
                              color={
                                subject.category === 'Core' ? 'primary' :
                                subject.category === 'Applied' ? 'success' : 'info'
                              }
                            />
                          )}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
                {formData.subjects.length === 0 && (
                  <Typography variant="caption" color="error">
                    Please select at least one subject
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Assigned Sections</InputLabel>
                  <Select
                    multiple
                    value={formData.assignedSections}
                    onChange={handleChange('assignedSections')}
                    label="Assigned Sections"
                    onOpen={() => setSectionsDropdownOpen(true)}
                    onClose={() => {
                      setSectionsDropdownOpen(false);
                      // Reset filters when closing dropdown
                      setSectionSemesterFilter('');
                      setSectionGradeLevelFilter('');
                    }}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((sectionId) => {
                          const section = sections.find(s => s.id === sectionId);
                          return section ? (
                            <Chip 
                              key={sectionId} 
                              label={`${section.sectionName}${section.semester ? ` (${section.semester})` : ''}`} 
                              size="small" 
                            />
                          ) : null;
                        })}
                      </Box>
                    )}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 400,
                        },
                      },
                    }}
                  >
                    {/* Filter section inside dropdown */}
                    <Box 
                      component="div"
                      sx={{ 
                        p: 1.5, 
                        borderBottom: '1px solid', 
                        borderColor: 'divider', 
                        bgcolor: 'background.paper',
                        position: 'sticky',
                        top: 0,
                        zIndex: 1
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Filter by Grade Level</InputLabel>
                            <Select
                              value={sectionGradeLevelFilter}
                              onChange={(e) => {
                                e.stopPropagation();
                                setSectionGradeLevelFilter(e.target.value);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                              label="Filter by Grade Level"
                            >
                              <MenuItem value="">
                                <em>All Grade Levels</em>
                              </MenuItem>
                              {gradeLevels.map((level) => (
                                <MenuItem key={level} value={level}>
                                  {level}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Filter by Semester</InputLabel>
                            <Select
                              value={sectionSemesterFilter}
                              onChange={(e) => {
                                e.stopPropagation();
                                setSectionSemesterFilter(e.target.value);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                              label="Filter by Semester"
                            >
                              <MenuItem value="">
                                <em>All Semesters</em>
                              </MenuItem>
                              {semesters.map((semester) => (
                                <MenuItem key={semester} value={semester}>
                                  {semester}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    </Box>
                    {filteredSections.length === 0 ? (
                      <MenuItem disabled>
                        <Typography variant="body2" color="textSecondary">
                          No sections found with the selected filters
                        </Typography>
                      </MenuItem>
                    ) : (
                      filteredSections.map((section) => (
                        <MenuItem 
                          key={section.id} 
                          value={section.id}
                        >
                          {section.sectionName} 
                          {section.gradeLevel && (
                            <Chip 
                              label={section.gradeLevel} 
                              size="small" 
                              sx={{ ml: 1, height: 20 }} 
                              color="secondary"
                            />
                          )}
                          {section.semester && (
                            <Chip 
                              label={section.semester} 
                              size="small" 
                              sx={{ ml: 1, height: 20 }} 
                              color="info"
                            />
                          )}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
                <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                  Select which sections this teacher will be assigned to. This helps filter available teachers when creating schedules.
                </Typography>
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
