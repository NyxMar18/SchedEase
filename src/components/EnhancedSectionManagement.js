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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  LinearProgress,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { sectionApi, subjectApi } from '../services/backendApi';

const EnhancedSectionManagement = () => {
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [formData, setFormData] = useState({
    sectionName: '',
    gradeLevel: '',
    studentCount: '',
    description: '',
    availableDays: [],
    schedulePattern: 'DAILY',
  });

  const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
  const gradeLevels = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
  const schedulePatterns = [
    { value: 'DAILY', label: 'Daily (Monday-Friday)', days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] },
    { value: 'MWF', label: 'MWF (Monday, Wednesday, Friday)', days: ['MONDAY', 'WEDNESDAY', 'FRIDAY'] },
    { value: 'TTH', label: 'TTH (Tuesday, Thursday)', days: ['TUESDAY', 'THURSDAY'] }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sectionsRes, subjectsRes] = await Promise.all([
        sectionApi.getAll(),
        subjectApi.getAll(),
      ]);

      if (sectionsRes.success) setSections(sectionsRes.data);
      if (subjectsRes.success) setSubjects(subjectsRes.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (section = null) => {
    setEditingSection(section);
    if (section) {
      setFormData({
        sectionName: section.sectionName || '',
        gradeLevel: section.gradeLevel || '',
        studentCount: section.studentCount || '',
        description: section.description || '',
        availableDays: section.availableDays || [],
        schedulePattern: section.schedulePattern || 'MWF',
      });
    } else {
      setFormData({
        sectionName: '',
        gradeLevel: '',
        studentCount: '',
        description: '',
        availableDays: [],
        schedulePattern: 'MWF',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSection(null);
    setFormData({
      sectionName: '',
      gradeLevel: '',
      studentCount: '',
      description: '',
      availableDays: [],
      schedulePattern: 'MWF',
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const sectionData = {
        ...formData,
        studentCount: parseInt(formData.studentCount),
      };

      let result;
      if (editingSection) {
        result = await sectionApi.update(editingSection.id, sectionData);
      } else {
        result = await sectionApi.create(sectionData);
      }

      if (result.success) {
        setSuccess(`Section ${editingSection ? 'updated' : 'created'} successfully`);
        await fetchData();
        handleCloseDialog();
      } else {
        setError(`Failed to ${editingSection ? 'update' : 'create'} section: ${result.error}`);
      }
    } catch (err) {
      setError(`Failed to ${editingSection ? 'update' : 'create'} section: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this section?')) {
      return;
    }

    try {
      setLoading(true);
      const result = await sectionApi.delete(id);
      
      if (result.success) {
        setSuccess('Section deleted successfully');
        await fetchData();
      } else {
        setError('Failed to delete section: ' + result.error);
      }
    } catch (err) {
      setError('Failed to delete section: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day]
    }));
  };

  if (loading && sections.length === 0) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Section Management
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          <GroupIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Section Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Section
        </Button>
      </Box>

      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Manage sections, grade levels, and student capacity for scheduling optimization.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <GroupIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Sections</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {sections.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SchoolIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Students</Typography>
              </Box>
              <Typography variant="h4" color="secondary">
                {sections.reduce((sum, section) => sum + (section.studentCount || 0), 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BookIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Available Subjects</Typography>
              </Box>
              <Typography variant="h4" color="info">
                {subjects.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SchoolIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Grade Levels</Typography>
              </Box>
              <Typography variant="h4" color="success">
                {new Set(sections.map(s => s.gradeLevel)).size}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sections Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Sections ({sections.length})
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Section Name</TableCell>
                  <TableCell>Grade Level</TableCell>
                  <TableCell>Student Count</TableCell>
                  <TableCell>Schedule Pattern</TableCell>
                  <TableCell>Available Days</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sections.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No sections found. Click "Add Section" to create one.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  sections.map((section) => (
                    <TableRow key={section.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {section.sectionName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={section.gradeLevel} color="primary" size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {section.studentCount} students
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={section.schedulePattern || 'MWF'} 
                          color={section.schedulePattern === 'MWF' ? 'primary' : 'secondary'} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {section.availableDays?.map((day) => (
                            <Chip
                              key={day}
                              label={day}
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {section.description || 'No description'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(section)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(section.id)}
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
          {editingSection ? 'Edit Section' : 'Add New Section'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Section Name"
                value={formData.sectionName}
                onChange={(e) => setFormData(prev => ({ ...prev, sectionName: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Grade Level</InputLabel>
                <Select
                  value={formData.gradeLevel}
                  label="Grade Level"
                  onChange={(e) => setFormData(prev => ({ ...prev, gradeLevel: e.target.value }))}
                >
                  {gradeLevels.map((grade) => (
                    <MenuItem key={grade} value={grade}>
                      {grade}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Student Count"
                type="number"
                value={formData.studentCount}
                onChange={(e) => setFormData(prev => ({ ...prev, studentCount: e.target.value }))}
                required
                inputProps={{ min: 1, max: 50 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Schedule Pattern</InputLabel>
                <Select
                  value={formData.schedulePattern}
                  label="Schedule Pattern"
                  onChange={(e) => setFormData(prev => ({ ...prev, schedulePattern: e.target.value }))}
                >
                  {schedulePatterns.map((pattern) => (
                    <MenuItem key={pattern.value} value={pattern.value}>
                      {pattern.label}
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
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Available Days
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {daysOfWeek.map((day) => (
                  <FormControlLabel
                    key={day}
                    control={
                      <Checkbox
                        checked={formData.availableDays.includes(day)}
                        onChange={() => handleDayToggle(day)}
                      />
                    }
                    label={day}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !formData.sectionName || !formData.gradeLevel || !formData.studentCount}
          >
            {editingSection ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {loading && <LinearProgress sx={{ mt: 2 }} />}
    </Box>
  );
};

export default EnhancedSectionManagement;

