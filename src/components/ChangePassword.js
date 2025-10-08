import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import {
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const ChangePassword = ({ open, onClose }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const { changePassword, user } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field]
    });
  };

  const validateForm = () => {
    if (!formData.currentPassword) {
      setError('Current password is required');
      return false;
    }
    if (!formData.newPassword) {
      setError('New password is required');
      return false;
    }
    if (formData.newPassword.length < 4) {
      setError('New password must be at least 4 characters long');
      return false;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return false;
    }
    if (formData.currentPassword === formData.newPassword) {
      setError('New password must be different from current password');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await changePassword(formData.currentPassword, formData.newPassword);
      
      if (result.success) {
        setSuccess('Password changed successfully!');
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(result.message || 'Failed to change password');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setError('');
    setSuccess('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <LockIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Change Password</Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Card>
          <CardContent>
            {user?.isDefaultPassword && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                You are using the default password. Please change it for security.
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Current Password"
                name="currentPassword"
                type={showPasswords.current ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={handleChange}
                margin="normal"
                required
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => togglePasswordVisibility('current')}
                      edge="end"
                    >
                      {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="New Password"
                name="newPassword"
                type={showPasswords.new ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={handleChange}
                margin="normal"
                required
                helperText="Minimum 4 characters"
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => togglePasswordVisibility('new')}
                      edge="end"
                    >
                      {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Confirm New Password"
                name="confirmPassword"
                type={showPasswords.confirm ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                margin="normal"
                required
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => togglePasswordVisibility('confirm')}
                      edge="end"
                    >
                      {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                }}
              />

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {success}
                </Alert>
              )}
            </form>
          </CardContent>
        </Card>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <LockIcon />}
        >
          {loading ? 'Changing...' : 'Change Password'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangePassword;

