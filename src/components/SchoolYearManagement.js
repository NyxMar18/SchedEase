import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarTodayIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import firebaseConfig from '../firebase/config';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const SchoolYearManagement = () => {
  const [schoolYears, setSchoolYears] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchoolYear, setEditingSchoolYear] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    description: '',
    isActive: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);

  useEffect(() => {
    fetchSchoolYears();
  }, []);

  const fetchSchoolYears = async () => {
    try {
      setLoading(true);
      const schoolYearsRef = collection(db, 'schoolYears');
      const q = query(schoolYearsRef, orderBy('name', 'desc'));
      const querySnapshot = await getDocs(q);
      const schoolYears = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSchoolYears(schoolYears);
    } catch (err) {
      console.error('Failed to fetch school years:', err);
      setError('Failed to fetch school years');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (schoolYear = null) => {
    if (schoolYear) {
      setEditingSchoolYear(schoolYear);
      setFormData({
        name: schoolYear.name,
        startDate: schoolYear.startDate,
        endDate: schoolYear.endDate,
        description: schoolYear.description || '',
        isActive: schoolYear.isActive
      });
    } else {
      setEditingSchoolYear(null);
      setFormData({
        name: '',
        startDate: '',
        endDate: '',
        description: '',
        isActive: false
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingSchoolYear(null);
    setFormData({
      name: '',
      startDate: '',
      endDate: '',
      description: '',
      isActive: false
    });
  };

  const handleFormChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      if (editingSchoolYear) {
        // Update existing school year
        const schoolYearRef = doc(db, 'schoolYears', editingSchoolYear.id);
        await updateDoc(schoolYearRef, {
          ...formData,
          updatedAt: new Date().toISOString()
        });
        setSuccess('School year updated successfully!');
      } else {
        // Create new school year
        const schoolYearsRef = collection(db, 'schoolYears');
        await addDoc(schoolYearsRef, {
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        setSuccess('School year created successfully!');
      }
      
      // If this is set as active, deactivate all others
      if (formData.isActive) {
        const schoolYearsRef = collection(db, 'schoolYears');
        const querySnapshot = await getDocs(schoolYearsRef);
        
        const updatePromises = querySnapshot.docs.map(docSnapshot => {
          if (docSnapshot.id !== editingSchoolYear?.id) {
            return updateDoc(doc(db, 'schoolYears', docSnapshot.id), {
              isActive: false,
              updatedAt: new Date().toISOString()
            });
          }
          return Promise.resolve();
        });
        
        await Promise.all(updatePromises);
      }
      
      await fetchSchoolYears();
      handleCloseDialog();
      setShowSuccessSnackbar(true);
    } catch (err) {
      console.error('Error saving school year:', err);
      setError('Failed to save school year: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (schoolYear) => {
    if (window.confirm(`Are you sure you want to delete "${schoolYear.name}"?`)) {
      try {
        setLoading(true);
        const schoolYearRef = doc(db, 'schoolYears', schoolYear.id);
        await deleteDoc(schoolYearRef);
        await fetchSchoolYears();
        setSuccess('School year deleted successfully!');
        setShowSuccessSnackbar(true);
      } catch (err) {
        console.error('Error deleting school year:', err);
        setError('Failed to delete school year: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleActivate = async (schoolYear) => {
    try {
      setLoading(true);
      
      // Deactivate all school years
      const schoolYearsRef = collection(db, 'schoolYears');
      const querySnapshot = await getDocs(schoolYearsRef);
      
      const updatePromises = querySnapshot.docs.map(docSnapshot => {
        return updateDoc(doc(db, 'schoolYears', docSnapshot.id), {
          isActive: false,
          updatedAt: new Date().toISOString()
        });
      });
      
      await Promise.all(updatePromises);
      
      // Activate the selected one
      const schoolYearRef = doc(db, 'schoolYears', schoolYear.id);
      await updateDoc(schoolYearRef, {
        isActive: true,
        updatedAt: new Date().toISOString()
      });
      
      await fetchSchoolYears();
      setSuccess('School year activated successfully!');
      setShowSuccessSnackbar(true);
    } catch (err) {
      console.error('Error activating school year:', err);
      setError('Failed to activate school year: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CalendarTodayIcon color="primary" />
        School Year Management
      </Typography>
      
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Manage school years for organizing schedules. Each school year acts as a container for its schedules.
      </Typography>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">School Years</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add School Year
            </Button>
          </Box>

          {schoolYears.length === 0 ? (
            <Alert severity="info">
              No school years found. Create your first school year to get started.
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>End Date</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schoolYears.map((schoolYear) => (
                    <TableRow key={schoolYear.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {schoolYear.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(schoolYear.startDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(schoolYear.endDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {schoolYear.description || 'No description'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {schoolYear.isActive ? (
                          <Chip label="Active" color="success" size="small" />
                        ) : (
                          <Chip label="Inactive" color="default" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(schoolYear)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          {!schoolYear.isActive && (
                            <Tooltip title="Activate">
                              <IconButton
                                size="small"
                                onClick={() => handleActivate(schoolYear)}
                                color="success"
                              >
                                <SchoolIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(schoolYear)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingSchoolYear ? 'Edit School Year' : 'Add New School Year'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="School Year Name"
              value={formData.name}
              onChange={handleFormChange('name')}
              fullWidth
              required
              placeholder="e.g., 2024-2025"
            />
            
            <TextField
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={handleFormChange('startDate')}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
            
            <TextField
              label="End Date"
              type="date"
              value={formData.endDate}
              onChange={handleFormChange('endDate')}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
            
            <TextField
              label="Description"
              value={formData.description}
              onChange={handleFormChange('description')}
              fullWidth
              multiline
              rows={3}
              placeholder="Optional description for this school year"
            />
            
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                }
                label="Set as Active School Year"
              />
            </FormGroup>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={loading}>
            {loading ? 'Saving...' : (editingSchoolYear ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccessSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSuccessSnackbar(false)}
      >
        <Alert severity="success" onClose={() => setShowSuccessSnackbar(false)}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SchoolYearManagement;