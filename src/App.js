import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ClassroomManagement from './components/ClassroomManagement';
import SectionManagement from './components/SectionManagement';
import TeacherManagement from './components/TeacherManagement';
import SubjectManagement from './components/SubjectManagement';
import SchoolYearManagement from './components/SchoolYearManagement';
import AutoSchedule from './components/AutoSchedule';
import ScheduleViewer from './components/ScheduleViewer';
import FirebaseTest from './components/FirebaseTest';
import Login from './components/Login';
import AppLandingPage from './components/AppLandingPage';
import Unauthorized from './components/Unauthorized';
import AdminAccountRecovery from './components/AdminAccountRecovery';
import ProtectedRoute from './components/ProtectedRoutes';
import { AuthProvider, useAuth } from './contexts/AuthContext';




const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const AppRoutes = () => {

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<AppLandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/admin-recovery" element={<AdminAccountRecovery />} />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/classrooms" element={
        <ProtectedRoute requiredRole="admin">
          <Layout>
            <ClassroomManagement />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/sections" element={
        <ProtectedRoute requiredRole="admin">
          <Layout>
            <SectionManagement />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/teachers" element={
        <ProtectedRoute requiredRole="admin">
          <Layout>
            <TeacherManagement />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/subjects" element={
        <ProtectedRoute requiredRole="admin">
          <Layout>
            <SubjectManagement />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/school-years" element={
        <ProtectedRoute requiredRole="admin">
          <Layout>
            <SchoolYearManagement />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/auto-schedule" element={
        <ProtectedRoute requiredRole="admin">
          <Layout>
            <AutoSchedule />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/firebase-test" element={
        <ProtectedRoute requiredRole="admin">
          <Layout>
            <FirebaseTest />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/schedule-viewer" element={
        <ProtectedRoute>
          <Layout>
            <ScheduleViewer />
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* Catch all route - redirect to landing page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <AuthProvider>
        <Router>
            <AppRoutes />
        </Router>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
