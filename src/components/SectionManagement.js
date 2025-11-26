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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { sectionAPI } from '../firebase/sectionService';
import { subjectAPI } from '../firebase/subjectService';

const SectionManagement = () => {
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [open, setOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [formData, setFormData] = useState({
    sectionName: '',
    track: '',
    gradeLevel: '',
    maxStudents: '',
    selectedSubjects: [],
    description: '',
  });

  const tracks = ['STEM', 'ABM', 'HUMSS', 'GAS', 'TVL'];
  const gradeLevels = ['Grade 11', 'Grade 12'];

  const groupedSubjects = useMemo(() => {
    const groups = subjects.reduce((acc, subject) => {
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
  }, [subjects]);

  useEffect(() => {
    fetchSections();
  }, []);

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
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubjectToggle = (subjectId) => {
    setFormData(prev => {
      const newSubjects = prev.selectedSubjects.includes(subjectId)
        ? prev.selectedSubjects.filter(id => id !== subjectId)
        : [...prev.selectedSubjects, subjectId];
      return { ...prev, selectedSubjects: newSubjects };
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          <GroupIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Section Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Add Section
        </Button>
      </Box>

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
                  <TableCell>Subjects</TableCell>
                  <TableCell>Max Students</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
              {sections.map((section) => (
                <TableRow key={section.id}>
                  <TableCell>{section.sectionName}</TableCell>
                  <TableCell>
                    <Chip label={section.track} color="primary" size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip label={section.gradeLevel} color="secondary" size="small" />
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
              ))}
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
              </Typography>
              {subjects.length === 0 ? (
                <Alert severity="info">
                  No subjects available. Please add subjects first.
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
                          label={subject.name || 'Untitled Subject'}
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
