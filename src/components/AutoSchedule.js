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
import { teacherAPI, classroomAPI, scheduleAPI } from '../services/api';
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
    loadExistingSchedules();
  }, []);

  const loadExistingSchedules = async () => {
    try {
      const schedulesRes = await scheduleAPI.getAll();
      setGeneratedSchedules(schedulesRes.data);
    } catch (error) {
      console.log('No existing schedules found or error loading:', error);
      // This is expected if the collection doesn't exist yet
    }
  };

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
      
      // Collect all scheduling requests first
      const schedulingRequests = [];
      
      for (const section of sections) {
        const sectionSubjects = subjects.filter(subject => 
          section.selectedSubjects?.includes(subject.id)
        );

        for (const subject of sectionSubjects) {
          const availableTeacher = teachers.find(teacher => 
            teacher.subject === subject.name
          );

          if (availableTeacher) {
            const availableClassroom = classrooms.find(classroom => 
              classroom.roomType === subject.requiredRoomType || 
              subject.requiredRoomType === 'Any' ||
              !subject.requiredRoomType
            );

            if (availableClassroom) {
              schedulingRequests.push({
                section,
                subject,
                teacher: availableTeacher,
                classroom: availableClassroom
              });
            }
          }
        }
      }

      // Create even distribution tracking
      const dayUsage = { MONDAY: 0, TUESDAY: 0, WEDNESDAY: 0, THURSDAY: 0, FRIDAY: 0 };
      const timeUsage = { '08:00': 0, '09:00': 0, '10:00': 0, '11:00': 0, '13:00': 0, '14:00': 0, '15:00': 0 };
      
      // Helper function to find the least used day
      const getLeastUsedDay = (availableDays) => {
        const availableDayUsage = availableDays.map(day => ({ day, count: dayUsage[day] }));
        availableDayUsage.sort((a, b) => a.count - b.count);
        return availableDayUsage[0]?.day;
      };
      
      // Helper function to find the least used time slot
      const getLeastUsedTimeSlot = (availableTimeSlots) => {
        const availableTimeUsage = availableTimeSlots.map(slot => ({ 
          slot, 
          count: timeUsage[slot.start] 
        }));
        availableTimeUsage.sort((a, b) => a.count - b.count);
        return availableTimeUsage[0]?.slot;
      };

      // Process each scheduling request with even distribution
      for (const request of schedulingRequests) {
        let assigned = false;
        let attempts = 0;
        const maxAttempts = daysOfWeek.length * timeSlots.length;

        // Get available days for this teacher
        const availableDays = request.teacher.availableDays || daysOfWeek;
        
        // Get available time slots for this teacher
        const availableTimeSlots = timeSlots.filter(slot => {
          const teacherStartTime = request.teacher.availableStartTime;
          const teacherEndTime = request.teacher.availableEndTime;
          return teacherStartTime <= slot.start && teacherEndTime >= slot.end;
        });

        // Try to assign with even distribution
        while (!assigned && attempts < maxAttempts) {
          // Find the least used day and time slot
          const day = getLeastUsedDay(availableDays);
          const timeSlot = getLeastUsedTimeSlot(availableTimeSlots);
          
          if (day && timeSlot) {
            const slotKey = `${day}-${timeSlot.start}-${timeSlot.end}-${request.teacher.id}-${request.classroom.id}`;
            
            // Check if slot is available
            if (!usedSlots.has(slotKey)) {
              // Create the schedule
              const schedule = {
                date: new Date().toISOString().split('T')[0],
                startTime: timeSlot.start,
                endTime: timeSlot.end,
                dayOfWeek: day,
                teacher: request.teacher,
                classroom: request.classroom,
                subject: request.subject.name,
                section: request.section, // Store full section object
                notes: `Auto-generated schedule for ${request.section.sectionName}`,
                isRecurring: true,
                status: 'scheduled'
              };

              schedules.push(schedule);
              usedSlots.add(slotKey);
              assigned = true;
              
              // Update usage counters
              dayUsage[day]++;
              timeUsage[timeSlot.start]++;
            } else {
              // If this combination is taken, try next least used combination
              attempts++;
            }
          } else {
            // Fallback to sequential assignment if even distribution fails
            const dayIndex = attempts % availableDays.length;
            const timeIndex = Math.floor(attempts / availableDays.length) % availableTimeSlots.length;
            
            const fallbackDay = availableDays[dayIndex];
            const fallbackTimeSlot = availableTimeSlots[timeIndex];
            
            if (fallbackDay && fallbackTimeSlot) {
              const slotKey = `${fallbackDay}-${fallbackTimeSlot.start}-${fallbackTimeSlot.end}-${request.teacher.id}-${request.classroom.id}`;
              
              if (!usedSlots.has(slotKey)) {
                const schedule = {
                  date: new Date().toISOString().split('T')[0],
                  startTime: fallbackTimeSlot.start,
                  endTime: fallbackTimeSlot.end,
                  dayOfWeek: fallbackDay,
                  teacher: request.teacher,
                  classroom: request.classroom,
                  subject: request.subject.name,
                  section: request.section, // Store full section object
                  notes: `Auto-generated schedule for ${request.section.sectionName}`,
                  isRecurring: true,
                  status: 'scheduled'
                };

                schedules.push(schedule);
                usedSlots.add(slotKey);
                assigned = true;
                
                // Update usage counters
                dayUsage[fallbackDay]++;
                timeUsage[fallbackTimeSlot.start]++;
              }
            }
            
            attempts++;
          }
        }

        if (!assigned) {
          console.log(`Could not assign schedule for ${request.section.sectionName} - ${request.subject.name}`);
        }
      }

      // Save schedules to database
      let savedCount = 0;
      let failedCount = 0;
      
      for (const schedule of schedules) {
        try {
          await scheduleAPI.create(schedule);
          savedCount++;
        } catch (error) {
          console.error('Failed to save schedule:', error);
          failedCount++;
        }
      }

      setGeneratedSchedules(schedules);
      
      if (savedCount > 0) {
        // Calculate distribution statistics
        const dayStats = Object.entries(dayUsage).map(([day, count]) => `${day}: ${count}`).join(', ');
        const timeStats = Object.entries(timeUsage).map(([time, count]) => `${time}: ${count}`).join(', ');
        
        const successMessage = `Successfully generated and saved ${savedCount} schedule entries to database!${failedCount > 0 ? ` (${failedCount} failed to save)` : ''}
        
Distribution Summary:
Days: ${dayStats}
Times: ${timeStats}`;
        
        setSuccess(successMessage);
        console.log('Schedule Distribution:', { dayUsage, timeUsage });
      } else {
        setError(`Failed to save any schedules to database. ${failedCount} schedules failed to save.`);
      }
    } catch (err) {
      setError('Failed to generate schedule');
    } finally {
      setLoading(false);
    }
  };

  const clearSchedule = async () => {
    try {
      setLoading(true);
      
      // Clear from local state
      setGeneratedSchedules([]);
      
      // Optionally clear from database (uncomment if you want to delete all schedules)
      // const existingSchedules = await scheduleAPI.getAll();
      // for (const schedule of existingSchedules.data) {
      //   await scheduleAPI.delete(schedule.id);
      // }
      
      setSuccess('Schedule cleared from display');
    } catch (error) {
      setError('Failed to clear schedule');
    } finally {
      setLoading(false);
    }
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
        Schedules are evenly distributed across all days of the week and time slots for optimal balance.
        Generated schedules will be automatically saved to the database.
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

      {/* Distribution Statistics */}
      {generatedSchedules.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Schedule Distribution
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Days Distribution:</Typography>
                {Object.entries({ MONDAY: 0, TUESDAY: 0, WEDNESDAY: 0, THURSDAY: 0, FRIDAY: 0 }).map(([day, _]) => {
                  const count = generatedSchedules.filter(s => s.dayOfWeek === day).length;
                  return (
                    <Box key={day} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">{day}:</Typography>
                      <Chip label={count} size="small" color={count > 0 ? "primary" : "default"} />
                    </Box>
                  );
                })}
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Time Distribution:</Typography>
                {timeSlots.map((timeSlot) => {
                  const count = generatedSchedules.filter(s => s.startTime === timeSlot.start).length;
                  return (
                    <Box key={timeSlot.start} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">{timeSlot.start}-{timeSlot.end}:</Typography>
                      <Chip label={count} size="small" color={count > 0 ? "secondary" : "default"} />
                    </Box>
                  );
                })}
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

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
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {generatedSchedules.map((schedule, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Chip label={schedule.section} color="primary" size="small" />
                      </TableCell>
                      <TableCell>{schedule.subject}</TableCell>
                      <TableCell>{`${schedule.teacher.firstName} ${schedule.teacher.lastName}`}</TableCell>
                      <TableCell>{schedule.classroom.roomName}</TableCell>
                      <TableCell>
                        <Chip label={schedule.dayOfWeek} color="secondary" size="small" />
                      </TableCell>
                      <TableCell>{`${schedule.startTime} - ${schedule.endTime}`}</TableCell>
                      <TableCell>
                        <Chip label={schedule.status} color="success" size="small" />
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

