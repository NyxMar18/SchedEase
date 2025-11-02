import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import {
  Person as PersonIcon,
  Add as AddIcon,
  Login as LoginIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { teacherAPI } from '../services/api';
import { userAPI } from '../services/userService';
import { useAuth } from '../contexts/AuthContext';

const TeacherAccountManager = () => {
  const [teachers, setTeachers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [testLoginOpen, setTestLoginOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const { login } = useAuth();

  const [newTeacher, setNewTeacher] = useState({
    firstName: '',
    lastName: '',
    email: '',
    subjects: [],
    availableStartTime: '08:00',
    availableEndTime: '17:00',
    availableDays: [],
    phoneNumber: '',
    notes: ''
  });

  const [testCredentials, setTestCredentials] = useState({
    email: '',
    password: '1234'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [teachersRes, usersRes] = await Promise.all([
        teacherAPI.getAll(),
        userAPI.getAllUsers()
      ]);

      setTeachers(teachersRes.data || []);
      setUsers(usersRes.success ? usersRes.data : []);
      setError('');
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeacher = async () => {
    try {
      setLoading(true);
      setError('');

      const teacherData = {
        ...newTeacher,
        availableDays: newTeacher.availableDays.map(day => day.toUpperCase()),
      };

      // Create teacher
      const result = await teacherAPI.create(teacherData);
      
      if (result.success || result.data) {
        const teacherId = result.data?.id || result.id;
        
        // Create user account
        const userAccountData = {
          ...teacherData,
          id: teacherId
        };
        
        const userResult = await userAPI.createTeacherAccount(userAccountData);
        
        if (userResult.success) {
          setSuccess(`Teacher "${teacherData.firstName} ${teacherData.lastName}" created successfully with login account!`);
          setCreateDialogOpen(false);
          setNewTeacher({
            firstName: '',
            lastName: '',
            email: '',
            subject: '',
            availableStartTime: '08:00',
            availableEndTime: '17:00',
            availableDays: [],
            phoneNumber: '',
            notes: ''
          });
          fetchData();
        } else {
          setError('Teacher created but user account creation failed');
        }
      } else {
        setError('Failed to create teacher');
      }
    } catch (err) {
      setError('Failed to create teacher: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = async () => {
    try {
      setLoading(true);
      setError('');

      const result = await login(testCredentials.email, testCredentials.password);
      
      if (result.success) {
        setSuccess(`Login test successful! Welcome ${result.user.name}`);
        setTestLoginOpen(false);
      } else {
        setError('Login test failed: ' + result.message);
      }
    } catch (err) {
      setError('Login test error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTeacherUser = (teacher) => {
    return users.find(user => user.email === teacher.email);
  };

  const subjects = [
    'Mathematics', 'Science', 'English', 'History', 'Geography', 
    'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Art',
    'Music', 'Physical Education', 'Foreign Language'
  ];

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Paper elevation={10}>
          <Card>
            <CardContent sx={{ p: 4 }}>
              {/* Header */}
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Box>
                  <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                    Teacher Account Manager
                  </Typography>
                  <Typography variant="subtitle1" color="textSecondary">
                    Create teachers and their login accounts
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setCreateDialogOpen(true)}
                >
                  Add Teacher
                </Button>
              </Box>

              {/* Alerts */}
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {success}
                </Alert>
              )}

              {/* Statistics */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="primary">
                        Total Teachers
                      </Typography>
                      <Typography variant="h4">
                        {teachers.length}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="secondary">
                        User Accounts
                      </Typography>
                      <Typography variant="h4">
                        {users.filter(u => u.role === 'teacher').length}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" color="success.main">
                        Ready to Login
                      </Typography>
                      <Typography variant="h4">
                        {teachers.filter(t => getTeacherUser(t)).length}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Teachers Table */}
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Subject</TableCell>
                      <TableCell>User Account</TableCell>
                      <TableCell>Default Password</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {teachers.map((teacher) => {
                      const user = getTeacherUser(teacher);
                      return (
                        <TableRow key={teacher.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {teacher.firstName} {teacher.lastName}
                            </Typography>
                          </TableCell>
                          <TableCell>{teacher.email}</TableCell>
                          <TableCell>
                            {teacher.subjects && teacher.subjects.length > 0 ? (
                              teacher.subjects.map(subject => (
                                <Chip key={subject} label={subject} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                              ))
                            ) : (
                              teacher.subject || 'N/A'
                            )}
                          </TableCell>
                          <TableCell>
                            {user ? (
                              <Chip label="Created" color="success" size="small" />
                            ) : (
                              <Chip label="Missing" color="error" size="small" />
                            )}
                          </TableCell>
                          <TableCell>
                            {user?.isDefaultPassword ? (
                              <Chip label="1234" color="warning" size="small" />
                            ) : (
                              <Chip label="Changed" color="info" size="small" />
                            )}
                          </TableCell>
                          <TableCell>
                            {user && (
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<LoginIcon />}
                                onClick={() => {
                                  setTestCredentials({
                                    email: teacher.email,
                                    password: '1234'
                                  });
                                  setTestLoginOpen(true);
                                }}
                              >
                                Test Login
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Create Teacher Dialog */}
              <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Create New Teacher</DialogTitle>
                <DialogContent>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="First Name"
                        value={newTeacher.firstName}
                        onChange={(e) => setNewTeacher({...newTeacher, firstName: e.target.value})}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        value={newTeacher.lastName}
                        onChange={(e) => setNewTeacher({...newTeacher, lastName: e.target.value})}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={newTeacher.email}
                        onChange={(e) => setNewTeacher({...newTeacher, email: e.target.value})}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl fullWidth required>
                        <InputLabel>Subjects (Max 2)</InputLabel>
                        <Select
                          multiple
                          value={newTeacher.subjects}
                          label="Subjects (Max 2)"
                          onChange={(e) => setNewTeacher({...newTeacher, subjects: e.target.value})}
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.map((value) => (
                                <Chip key={value} label={value} size="small" />
                              ))}
                            </Box>
                          )}
                        >
                          {subjects.map((subject) => (
                            <MenuItem 
                              key={subject} 
                              value={subject}
                              disabled={newTeacher.subjects.length >= 2 && !newTeacher.subjects.includes(subject)}
                            >
                              {subject}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      {newTeacher.subjects.length === 0 && (
                        <Typography variant="caption" color="error">
                          Please select at least one subject
                        </Typography>
                      )}
                      {newTeacher.subjects.length > 2 && (
                        <Typography variant="caption" color="error">
                          Maximum 2 subjects allowed
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Start Time"
                        type="time"
                        value={newTeacher.availableStartTime}
                        onChange={(e) => setNewTeacher({...newTeacher, availableStartTime: e.target.value})}
                        InputLabelProps={{ shrink: true }}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="End Time"
                        type="time"
                        value={newTeacher.availableEndTime}
                        onChange={(e) => setNewTeacher({...newTeacher, availableEndTime: e.target.value})}
                        InputLabelProps={{ shrink: true }}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Available Days</InputLabel>
                        <Select
                          multiple
                          value={newTeacher.availableDays}
                          label="Available Days"
                          onChange={(e) => setNewTeacher({...newTeacher, availableDays: e.target.value})}
                        >
                          {daysOfWeek.map((day) => (
                            <MenuItem key={day} value={day}>
                              {day}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        value={newTeacher.phoneNumber}
                        onChange={(e) => setNewTeacher({...newTeacher, phoneNumber: e.target.value})}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Notes"
                        multiline
                        rows={3}
                        value={newTeacher.notes}
                        onChange={(e) => setNewTeacher({...newTeacher, notes: e.target.value})}
                      />
                    </Grid>
                  </Grid>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                  <Button 
                    onClick={handleCreateTeacher} 
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
                  >
                    {loading ? 'Creating...' : 'Create Teacher'}
                  </Button>
                </DialogActions>
              </Dialog>

              {/* Test Login Dialog */}
              <Dialog open={testLoginOpen} onClose={() => setTestLoginOpen(false)}>
                <DialogTitle>Test Teacher Login</DialogTitle>
                <DialogContent>
                  <Box sx={{ mt: 2 }}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={testCredentials.email}
                      onChange={(e) => setTestCredentials({...testCredentials, email: e.target.value})}
                      margin="normal"
                    />
                    <TextField
                      fullWidth
                      label="Password"
                      type="password"
                      value={testCredentials.password}
                      onChange={(e) => setTestCredentials({...testCredentials, password: e.target.value})}
                      margin="normal"
                    />
                  </Box>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setTestLoginOpen(false)}>Cancel</Button>
                  <Button 
                    onClick={handleTestLogin} 
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
                  >
                    {loading ? 'Testing...' : 'Test Login'}
                  </Button>
                </DialogActions>
              </Dialog>
            </CardContent>
          </Card>
        </Paper>
      </Box>
    </Container>
  );
};

export default TeacherAccountManager;

