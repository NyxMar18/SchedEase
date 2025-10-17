import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Container,
  TextField,
  Grid,
  Divider
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  PersonAdd as PersonAddIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { userAPI } from '../services/userService';

const AdminAccountRecovery = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [adminData, setAdminData] = useState({
    email: 'admin@sched.com',
    password: 'admin123',
    name: 'Administrator'
  });

  const handleCreateAdmin = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await userAPI.createAdminAccount(adminData);
      
      if (result.success) {
        setSuccess(`Admin account created successfully! You can now login with email: ${adminData.email} and password: ${adminData.password}`);
      } else {
        setError(result.message || 'Failed to create admin account');
      }
    } catch (err) {
      setError('Error creating admin account: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field) => (event) => {
    setAdminData({
      ...adminData,
      [field]: event.target.value
    });
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <AdminIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
            <Typography variant="h4" component="h1">
              Admin Account Recovery
            </Typography>
          </Box>

          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body1" fontWeight="bold">
              Admin Account Deleted
            </Typography>
            <Typography variant="body2">
              Your admin account has been accidentally deleted. Use this tool to recreate it with the same credentials.
            </Typography>
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Admin Account Details
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Enter the admin account information. You can use the default values or customize them.
              </Typography>

              <TextField
                fullWidth
                label="Email"
                value={adminData.email}
                onChange={handleInputChange('email')}
                margin="normal"
                variant="outlined"
                helperText="This will be the admin login email"
              />

              <TextField
                fullWidth
                label="Password"
                type="password"
                value={adminData.password}
                onChange={handleInputChange('password')}
                margin="normal"
                variant="outlined"
                helperText="This will be the admin login password"
              />

              <TextField
                fullWidth
                label="Display Name"
                value={adminData.name}
                onChange={handleInputChange('name')}
                margin="normal"
                variant="outlined"
                helperText="This will be the admin display name"
              />

              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={loading ? <CircularProgress size={20} /> : <PersonAddIcon />}
                onClick={handleCreateAdmin}
                disabled={loading || !adminData.email || !adminData.password || !adminData.name}
                sx={{ mt: 3 }}
              >
                {loading ? 'Creating Admin Account...' : 'Create Admin Account'}
              </Button>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Default Admin Credentials
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                These are the default admin credentials that will be created:
              </Typography>

              <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1, mb: 2 }}>
                <Typography variant="body2" fontWeight="bold">Email:</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>admin@sched.com</Typography>
                
                <Typography variant="body2" fontWeight="bold" sx={{ mt: 1 }}>Password:</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>admin123</Typography>
                
                <Typography variant="body2" fontWeight="bold" sx={{ mt: 1 }}>Role:</Typography>
                <Typography variant="body2">admin</Typography>
              </Box>

              <Alert severity="info">
                <Typography variant="body2">
                  After creating the admin account, you can change the password through the admin panel.
                </Typography>
              </Alert>
            </Grid>
          </Grid>

          {success && (
            <Alert severity="success" sx={{ mt: 3 }}>
              <CheckIcon sx={{ mr: 1 }} />
              {success}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 3 }}>
              <ErrorIcon sx={{ mr: 1 }} />
              {error}
            </Alert>
          )}

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            What This Does
          </Typography>
          <Typography variant="body2" color="textSecondary">
            This tool will create a new admin account in your Firebase Firestore database with the specified credentials. 
            The admin account will have full access to all features including user management, teacher management, 
            classroom management, and schedule generation.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default AdminAccountRecovery;
