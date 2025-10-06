import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Alert,
  Button,
  Box,
  Chip,
  Grid,
  Divider,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { classroomFirebaseAPI } from '../firebase/firebaseService';
import firebaseConfig from '../firebase/config';

const FirebaseConfigChecker = () => {
  const [checks, setChecks] = useState({
    configValid: false,
    firestoreConnection: false,
    readAccess: false,
    writeAccess: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validateConfig = () => {
    const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
    const hasAllFields = requiredFields.every(field => 
      firebaseConfig[field] && 
      firebaseConfig[field] !== `your-${field.replace(/([A-Z])/g, '-$1').toLowerCase()}-here` &&
      firebaseConfig[field] !== `your-${field.replace(/([A-Z])/g, '-$1').toLowerCase()}`
    );
    
    return hasAllFields;
  };

  const runChecks = async () => {
    setLoading(true);
    setError(null);
    
    const newChecks = {
      configValid: false,
      firestoreConnection: false,
      readAccess: false,
      writeAccess: false,
    };

    try {
      // Check 1: Configuration
      newChecks.configValid = validateConfig();

      if (newChecks.configValid) {
        // Check 2: Firestore Connection (Read)
        try {
          await classroomFirebaseAPI.getAll();
          newChecks.firestoreConnection = true;
          newChecks.readAccess = true;
        } catch (err) {
          console.error('Read test failed:', err);
        }

        // Check 3: Write Access
        if (newChecks.readAccess) {
          try {
            const testClassroom = {
              roomName: 'Test Room',
              roomType: 'Test',
              capacity: 10,
              location: 'Test Location',
              description: 'Test classroom for connection check'
            };
            
            await classroomFirebaseAPI.create(testClassroom);
            newChecks.writeAccess = true;
            
            // Clean up test data (optional)
            // Note: We can't easily delete without the document ID, but this is just for testing
          } catch (err) {
            console.error('Write test failed:', err);
          }
        }
      }

      setChecks(newChecks);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runChecks();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getStatusIcon = (status) => {
    if (status) {
      return <CheckCircleIcon color="success" />;
    }
    return <ErrorIcon color="error" />;
  };

  const getStatusChip = (status, label) => {
    return (
      <Chip
        icon={getStatusIcon(status)}
        label={label}
        color={status ? 'success' : 'error'}
        variant={status ? 'filled' : 'outlined'}
      />
    );
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Firebase Configuration Status
          </Typography>
          <Button
            startIcon={<RefreshIcon />}
            onClick={runChecks}
            disabled={loading}
            variant="outlined"
            size="small"
          >
            {loading ? 'Checking...' : 'Refresh'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Configuration
              </Typography>
              {getStatusChip(checks.configValid, 'Config Valid')}
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Connection
              </Typography>
              {getStatusChip(checks.firestoreConnection, 'Firestore Connected')}
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Read Access
              </Typography>
              {getStatusChip(checks.readAccess, 'Can Read Data')}
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Write Access
              </Typography>
              {getStatusChip(checks.writeAccess, 'Can Write Data')}
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {!checks.configValid && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Configuration Required
            </Typography>
            <Typography variant="body2">
              Please update your Firebase configuration in <code>src/firebase/config.js</code>.
              See <code>FIREBASE_SETUP.md</code> for detailed instructions.
            </Typography>
          </Alert>
        )}

        {checks.configValid && !checks.firestoreConnection && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Connection Failed
            </Typography>
            <Typography variant="body2">
              Unable to connect to Firestore. Please check:
              <br />• Your internet connection
              <br />• Firebase project is active
              <br />• Firestore is enabled in your Firebase project
            </Typography>
          </Alert>
        )}

        {checks.firestoreConnection && !checks.readAccess && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Read Access Denied
            </Typography>
            <Typography variant="body2">
              Unable to read from Firestore. Check your security rules.
            </Typography>
          </Alert>
        )}

        {checks.readAccess && !checks.writeAccess && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Write Access Denied
            </Typography>
            <Typography variant="body2">
              Can read data but cannot write. Check your Firestore security rules for write permissions.
            </Typography>
          </Alert>
        )}

        {checks.writeAccess && (
          <Alert severity="success">
            <Typography variant="subtitle2" gutterBottom>
              All Systems Operational
            </Typography>
            <Typography variant="body2">
              Firebase is properly configured and all operations are working correctly!
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default FirebaseConfigChecker;
