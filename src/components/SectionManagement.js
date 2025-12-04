import React, { useState, useEffect, useMemo } from 'react';
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
  Menu,
  Card,
  CardContent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  CalendarToday as CalendarTodayIcon,
  ArrowDropDown as ArrowDropDownIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { sectionAPI } from '../firebase/sectionService';
import { subjectAPI } from '../firebase/subjectService';

const SectionManagement = () => {
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [open, setOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [scheduleMenuAnchor, setScheduleMenuAnchor] = useState(null);
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState('');
  const [formData, setFormData] = useState({
    sectionName: '',
    track: '',
    gradeLevel: '',
    semester: '',
    maxStudents: '',
    selectedSubjects: [],
    description: '',
  });

  const tracks = ['STEM', 'ABM', 'HUMSS', 'GAS', 'TVL'];
  const gradeLevels = ['Grade 11', 'Grade 12'];
  const semesters = ['Semester 1', 'Semester 2'];

  // Filter subjects based on selected grade level
  const getFilteredSubjects = useMemo(() => {
    if (!formData.gradeLevel) {
      return subjects;
    }
    
    // Filter subjects that match the selected grade level
    return subjects.filter(subject => {
      // If subject has no gradeLevel, include it (for backward compatibility)
      if (!subject.gradeLevel) return true;
      // Match exact grade level
      return subject.gradeLevel === formData.gradeLevel;
    });
  }, [subjects, formData.gradeLevel]);

  const groupedSubjects = useMemo(() => {
    const groups = getFilteredSubjects.reduce((acc, subject) => {
      const category = subject.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(subject);
      return acc;
    }, {});

    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([category, items]) => [
        category,
        items.sort((a, b) => (a.name || '').localeCompare(b.name || '')),
      ]);
  }, [getFilteredSubjects]);

  useEffect(() => {
    fetchSections();
  }, []);

  // Filter sections by semester
  useEffect(() => {
    if (selectedSemesterFilter) {
      const filtered = sections.filter(section => section.semester === selectedSemesterFilter);
      setFilteredSections(filtered);
    } else {
      setFilteredSections(sections);
    }
  }, [sections, selectedSemesterFilter]);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const [sectionsRes, subjectsRes] = await Promise.all([
        sectionAPI.getAll(),
        subjectAPI.getAll()
      ]);
      setSections(sectionsRes.data);
      setSubjects(subjectsRes.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (section = null) => {
    if (section) {
      setEditingSection(section);
      setFormData({
        sectionName: section.sectionName,
        track: section.track,
        gradeLevel: section.gradeLevel,
        semester: section.semester || '',
        maxStudents: section.maxStudents.toString(),
        selectedSubjects: section.selectedSubjects || [],
        description: section.description || '',
      });
    } else {
      setEditingSection(null);
      setFormData({
        sectionName: '',
        track: '',
        gradeLevel: '',
        semester: '',
        maxStudents: '',
        selectedSubjects: [],
        description: '',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingSection(null);
    setFormData({
      sectionName: '',
      track: '',
      gradeLevel: '',
      semester: '',
      maxStudents: '',
      selectedSubjects: [],
      description: '',
    });
  };

  const handleSubmit = async () => {
    try {
      const sectionData = {
        ...formData,
        maxStudents: parseInt(formData.maxStudents),
      };

      if (editingSection) {
        await sectionAPI.update(editingSection.id, sectionData);
        setSuccess('Section updated successfully');
      } else {
        await sectionAPI.create(sectionData);
        setSuccess('Section created successfully');
      }

      handleClose();
      fetchSections();
    } catch (err) {
      setError(editingSection ? 'Failed to update section' : 'Failed to create section');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this section?')) {
      try {
        await sectionAPI.delete(id);
        setSuccess('Section deleted successfully');
        fetchSections();
      } catch (err) {
        setError('Failed to delete section');
      }
    }
  };

  const handleChange = (field) => (event) => {
    const newValue = event.target.value;
    
    // If grade level changes, filter out subjects that don't match the new grade level
    if (field === 'gradeLevel') {
      setFormData(prev => {
        const newGradeLevel = newValue;
        // Filter selectedSubjects to only keep those that match the new grade level
        const validSubjects = prev.selectedSubjects.filter(subjectId => {
          const subject = subjects.find(s => s.id === subjectId);
          if (!subject) return false;
          // If subject has no gradeLevel, keep it (backward compatibility)
          if (!subject.gradeLevel) return true;
          // Keep if it matches the new grade level
          return subject.gradeLevel === newGradeLevel;
        });
        
        return {
          ...prev,
          [field]: newValue,
          selectedSubjects: validSubjects
        };
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: newValue,
      }));
    }
  };

  const handleSubjectToggle = (subjectId) => {
    setFormData(prev => {
      const newSubjects = prev.selectedSubjects.includes(subjectId)
        ? prev.selectedSubjects.filter(id => id !== subjectId)
        : [...prev.selectedSubjects, subjectId];
      return { ...prev, selectedSubjects: newSubjects };
    });
  };

  // Get background color for subject based on grade level
  const getSubjectGradeColor = (gradeLevel) => {
    if (!gradeLevel) return 'transparent';
    if (gradeLevel === 'Grade 11') return '#e3f2fd'; // Light blue
    if (gradeLevel === 'Grade 12') return '#f3e5f5'; // Light purple
    return 'transparent';
  };

  // Handle create schedule menu
  const handleCreateScheduleClick = (event) => {
    setScheduleMenuAnchor(event.currentTarget);
  };

  const handleCreateScheduleClose = () => {
    setScheduleMenuAnchor(null);
  };

  const handleSelectSemesterForSchedule = (semester) => {
    handleCreateScheduleClose();
    // Navigate to auto schedule with semester in state
    navigate('/auto-schedule', { state: { selectedSemester: semester } });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          <GroupIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Section Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<CalendarTodayIcon />}
            endIcon={<ArrowDropDownIcon />}
            onClick={handleCreateScheduleClick}
          >
            Create Schedule
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
          >
            Add Section
          </Button>
        </Box>
      </Box>

      {/* Semester Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="subtitle1" fontWeight="medium">
              Filter by Semester:
            </Typography>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Semester</InputLabel>
              <Select
                value={selectedSemesterFilter}
                onChange={(e) => setSelectedSemesterFilter(e.target.value)}
                label="Semester"
              >
                <MenuItem value="">All Semesters</MenuItem>
                <MenuItem value="Semester 1">Semester 1</MenuItem>
                <MenuItem value="Semester 2">Semester 2</MenuItem>
              </Select>
            </FormControl>
            {selectedSemesterFilter && (
              <Chip 
                label={`${filteredSections.length} section${filteredSections.length !== 1 ? 's' : ''} in ${selectedSemesterFilter}`} 
                color="primary" 
                variant="filled"
                onDelete={() => setSelectedSemesterFilter('')}
              />
            )}
            {!selectedSemesterFilter && (
              <Typography variant="body2" color="textSecondary">
                Showing all {sections.length} sections
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Semester Selection Menu for Creating Schedule */}
      <Menu
        anchorEl={scheduleMenuAnchor}
        open={Boolean(scheduleMenuAnchor)}
        onClose={handleCreateScheduleClose}
      >
        <MenuItem onClick={() => handleSelectSemesterForSchedule('Semester 1')}>
          Semester 1
        </MenuItem>
        <MenuItem onClick={() => handleSelectSemesterForSchedule('Semester 2')}>
          Semester 2
        </MenuItem>
      </Menu>

      {loading ? (
        <Typography>Loading...</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
                <TableRow>
                  <TableCell>Section Name</TableCell>
                  <TableCell>Track</TableCell>
                  <TableCell>Grade Level</TableCell>
                  <TableCell>Semester</TableCell>
                  <TableCell>Subjects</TableCell>
                  <TableCell>Max Students</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
              {filteredSections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="textSecondary">
                      {selectedSemesterFilter 
                        ? `No sections found for ${selectedSemesterFilter}`
                        : 'No sections available'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSections.map((section) => (
                  <TableRow key={section.id}>
                    <TableCell>{section.sectionName}</TableCell>
                    <TableCell>
                      <Chip label={section.track} color="primary" size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip label={section.gradeLevel} color="secondary" size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip label={section.semester || 'N/A'} color="info" size="small" />
                    </TableCell>
                    <TableCell>
                      {section.selectedSubjects?.map(subjectId => {
                        const subject = subjects.find(s => s.id === subjectId);
                        return subject ? (
                          <Chip key={subjectId} label={subject.name} color="info" size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                        ) : null;
                      }) || '-'}
                    </TableCell>
                    <TableCell>{section.maxStudents}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpen(section)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(section.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingSection ? 'Edit Section' : 'Add New Section'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Section Name"
                value={formData.sectionName}
                onChange={handleChange('sectionName')}
                fullWidth
                required
                placeholder="e.g., STEM 1, ABM 2"
              />
            </Grid>
      
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Track</InputLabel>
                <Select
                  value={formData.track}
                  onChange={handleChange('track')}
                  label="Track"
                >
                  {tracks.map((track) => (
                    <MenuItem key={track} value={track}>
                      {track}
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
              <FormControl fullWidth required>
                <InputLabel>Semester</InputLabel>
                <Select
                  value={formData.semester}
                  onChange={handleChange('semester')}
                  label="Semester"
                >
                  {semesters.map((semester) => (
                    <MenuItem key={semester} value={semester}>
                      {semester}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Max Students"
                type="number"
                value={formData.maxStudents}
                onChange={handleChange('maxStudents')}
                fullWidth
                required
                inputProps={{ min: 1, max: 50 }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Select Subjects for this Section:
                {formData.gradeLevel && (
                  <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                    (Showing subjects for {formData.gradeLevel})
                  </Typography>
                )}
              </Typography>
              {!formData.gradeLevel ? (
                <Alert severity="warning">
                  Please select a grade level first to see available subjects.
                </Alert>
              ) : getFilteredSubjects.length === 0 ? (
                <Alert severity="info">
                  No subjects available for {formData.gradeLevel}. Please add subjects for this grade level in Subject Management.
                </Alert>
              ) : (
                groupedSubjects.map(([category, categorySubjects]) => (
                  <Box key={category} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      {category}
                    </Typography>
                    <FormGroup row sx={{ pl: 1 }}>
                      {categorySubjects.map((subject) => (
                        <FormControlLabel
                          key={subject.id}
                          control={
                            <Checkbox
                              checked={formData.selectedSubjects.includes(subject.id)}
                              onChange={() => handleSubjectToggle(subject.id)}
                            />
                          }
                          label={`${subject.name || 'Untitled Subject'}${subject.gradeLevel ? ` (${subject.gradeLevel})` : ''}`}
                          sx={{
                            backgroundColor: getSubjectGradeColor(subject.gradeLevel),
                            borderRadius: 1,
                            px: 1,
                            py: 0.5,
                            mr: 1,
                            mb: 0.5,
                            '&:hover': {
                              backgroundColor: subject.gradeLevel === 'Grade 11' 
                                ? '#bbdefb' 
                                : subject.gradeLevel === 'Grade 12' 
                                ? '#e1bee7' 
                                : 'rgba(0, 0, 0, 0.04)'
                            }
                          }}
                        />
                      ))}
                    </FormGroup>
                  </Box>
                ))
              )}
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                value={formData.description}
                onChange={handleChange('description')}
                fullWidth
                multiline
                rows={3}
                placeholder="Additional information about this section"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingSection ? 'Update' : 'Create'}
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

export default SectionManagement;
