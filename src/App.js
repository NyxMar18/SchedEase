import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import AutoSchedule from './components/AutoSchedule';
import FirebaseTest from './components/FirebaseTest';

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

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Router>
          <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/classrooms" element={<ClassroomManagement />} />
                  <Route path="/sections" element={<SectionManagement />} />
                  <Route path="/teachers" element={<TeacherManagement />} />
                  <Route path="/subjects" element={<SubjectManagement />} />
                  <Route path="/auto-schedule" element={<AutoSchedule />} />
                  <Route path="/firebase-test" element={<FirebaseTest />} />
                </Routes>
          </Layout>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
