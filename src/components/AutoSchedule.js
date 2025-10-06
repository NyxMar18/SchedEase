import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  AutoAwesome as AutoAwesomeIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Book as BookIcon,
  Group as GroupIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { sectionAPI } from '../firebase/sectionService';
import { teacherAPI, classroomAPI } from '../services/api';
import { subjectAPI } from '../firebase/subjectService';

const AutoSchedule = () => {
  const [sections, setSections] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [generatedSchedules, setGeneratedSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
  const timeSlots = [
    { start: '08:00', end: '09:00' },
    { start: '09:00', end: '10:00' },
    { start: '10:00', end: '11:00' },
    { start: '11:00', end: '12:00' },
    { start: '13:00', end: '14:00' },
    { start: '14:00', end: '15:00' },
    { start: '15:00', end: '16:00' },
  ];

  useEffect(() => {
    fetchData(); 
  }, []);

  const fetchData = async () => {
    try {
      const [sectionsRes, teachersRes, classroomsRes, subjectsRes] = await Promise.all([
        sectionAPI.getAll(),
        teacherAPI.getAll(),
        classroomAPI.getAll(),
        subjectAPI.getAll(),
      ]);

      setSections(sectionsRes.data);
      setTeachers(teachersRes.data);
      setClassrooms(classroomsRes.data);
      setSubjects(subjectsRes.data);
    } catch (err) {
      setError('Failed to fetch data');
    }
  };

  const generateSchedule = async () => {
    if (sections.length === 0) {
      setError('Please add sections first');
      return;
    }
    if (teachers.length === 0) {
      setError('Please add teachers first');
      return;
    }
    if (classrooms.length === 0) {
      setError('Please add classrooms first');
      return;
    }
    if (subjects.length === 0) {
      setError('Please add subjects first');
      return;
    }

    // Check if sections have subjects selected
    const sectionsWithoutSubjects = sections.filter(section => 
      !section.selectedSubjects || section.selectedSubjects.length === 0
    );
    if (sectionsWithoutSubjects.length > 0) {
      setError('Please select subjects for all sections first');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const schedules = [];
      const usedSlots = new Set(); // Track used time slots to prevent conflicts

      // Generate schedule for each section
      for (const section of sections) {
        // Get subjects for this section from the section's selected subjects
        const sectionSubjects = subjects.filter(subject => 
          section.selectedSubjects?.includes(subject.id)
        );

        for (const subject of sectionSubjects) {
          // Find available teacher for this subject - match by subject name
          const availableTeacher = teachers.find(teacher => 
            teacher.subject === subject.name
          );

          if (availableTeacher) {
            console.log(`Matched teacher ${availableTeacher.firstName} ${availableTeacher.lastName} with subject ${subject.name}`);
            
            // Find available classroom
            const availableClassroom = classrooms.find(classroom => 
              classroom.roomType === subject.requiredRoomType || 
              subject.requiredRoomType === 'Any' ||
              !subject.requiredRoomType
            );

            if (availableClassroom) {
              // Find available time slot
              let assignedSlot = null;
              for (const day of daysOfWeek) {
                for (const timeSlot of timeSlots) {
                  const slotKey = `${day}-${timeSlot.start}-${timeSlot.end}-${availableTeacher.id}-${availableClassroom.id}`;
                  
                  if (!usedSlots.has(slotKey)) {
                    // Check if teacher is available on this day and time
                    if (availableTeacher.availableDays?.includes(day)) {
                      const teacherStartTime = availableTeacher.availableStartTime;
                      const teacherEndTime = availableTeacher.availableEndTime;
                      
                      if (teacherStartTime <= timeSlot.start && teacherEndTime >= timeSlot.end) {
                        assignedSlot = { day, timeSlot };
                        usedSlots.add(slotKey);
                        break;
                      }
                    }
                  }
                }
                if (assignedSlot) break;
              }

              if (assignedSlot) {
                const schedule = {
                  id: Date.now().toString(36) + Math.random().toString(36).substr(2),
                  section: section.sectionName,
                  subject: subject.name,
                  teacher: `${availableTeacher.firstName} ${availableTeacher.lastName}`,
                  classroom: availableClassroom.roomName,
                  day: assignedSlot.day,
                  time: `${assignedSlot.timeSlot.start} - ${assignedSlot.timeSlot.end}`,
                  roomType: availableClassroom.roomType,
                };

                schedules.push(schedule);
              }
            }
          } else {
            console.log(`No teacher found for subject: ${subject.name}`);
          }
        }
      }

      setGeneratedSchedules(schedules);
      setSuccess(`Successfully generated ${schedules.length} schedule entries!`);
    } catch (err) {
      setError('Failed to generate schedule');
    } finally {
      setLoading(false);
    }
  };

  const clearSchedule = () => {
    setGeneratedSchedules([]);
    setSuccess('Schedule cleared');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        <AutoAwesomeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Auto Schedule Generator
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Generate a conflict-free schedule for all sections, teachers, and classrooms.
        Each section will only be scheduled for the subjects you selected for that section.
        Teachers will be matched to subjects based on their subject expertise.
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <GroupIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Sections</Typography>
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
                <PersonIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">Teachers</Typography>
              </Box>
              <Typography variant="h4" color="secondary">
                {teachers.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SchoolIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Classrooms</Typography>
              </Box>
              <Typography variant="h4" color="info">
                {classrooms.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BookIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Subjects</Typography>
              </Box>
              <Typography variant="h4" color="success">
                {subjects.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<AutoAwesomeIcon />}
          onClick={generateSchedule}
          disabled={loading || sections.length === 0 || teachers.length === 0 || classrooms.length === 0 || subjects.length === 0}
        >
          Generate Schedule
        </Button>
        <Button
          variant="outlined"
          onClick={clearSchedule}
          disabled={generatedSchedules.length === 0}
        >
          Clear Schedule
        </Button>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Generated Schedule Table */}
      {generatedSchedules.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Generated Schedule ({generatedSchedules.length} entries)
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Section</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Teacher</TableCell>
                    <TableCell>Classroom</TableCell>
                    <TableCell>Day</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Room Type</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {generatedSchedules.map((schedule, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Chip label={schedule.section} color="primary" size="small" />
                      </TableCell>
                      <TableCell>{schedule.subject}</TableCell>
                      <TableCell>{schedule.teacher}</TableCell>
                      <TableCell>{schedule.classroom}</TableCell>
                      <TableCell>
                        <Chip label={schedule.day} color="secondary" size="small" />
                      </TableCell>
                      <TableCell>{schedule.time}</TableCell>
                      <TableCell>
                        <Chip label={schedule.roomType} color="info" size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

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

export default AutoSchedule;
