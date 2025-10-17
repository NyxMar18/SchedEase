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
  Delete as DeleteIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { sectionAPI } from '../firebase/sectionService';
import { teacherAPI, classroomAPI, scheduleAPI } from '../services/api';
import { subjectAPI } from '../firebase/subjectService';
import { userAPI } from '../services/userService';

const AutoSchedule = () => {
  const [sections, setSections] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [users, setUsers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [generatedSchedules, setGeneratedSchedules] = useState([]);
  const [failedSchedules, setFailedSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
  const schedulePatterns = [
    { value: 'DAILY', label: 'Daily (Mon-Fri)', days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] },
    { value: 'MWF', label: 'MWF (Mon/Wed/Fri)', days: ['MONDAY', 'WEDNESDAY', 'FRIDAY'] },
    { value: 'TTH', label: 'TTH (Tue/Thu)', days: ['TUESDAY', 'THURSDAY'] }
  ];

  // Helper function to get optimal schedule pattern based on duration
  const getOptimalSchedulePattern = (duration) => {
    if (duration <= 2) return 'TTH';    // 1-2 hours: Tue, Thu
    if (duration <= 3) return 'MWF';    // 3 hours: Mon, Wed, Fri
    return 'DAILY';                     // 4+ hours: Mon-Fri
  };

  // Helper function to get teacher users (users with teacher role)
  const getTeacherUsers = () => {
    return users.filter(user => user.role === 'teacher');
  };

  // Helper function to get teacher data for a user (if teacher data exists separately)
  const getTeacherDataForUser = (user) => {
    // If teacher data is stored in the user object itself
    if (user.teacherId) {
      return teachers.find(teacher => teacher.id === user.teacherId);
    }
    // If teacher data is directly in the user object
    return user;
  };
  const timeSlots = [
    { start: '08:00', end: '09:00' },
    { start: '08:00', end: '09:30' }, // 1.5 hour slot
    { start: '09:00', end: '10:00' },
    { start: '09:00', end: '10:30' }, // 1.5 hour slot
    { start: '09:30', end: '10:30' }, // 1.5 hour slot
    { start: '10:00', end: '11:00' },
    { start: '10:00', end: '11:30' }, // 1.5 hour slot
    { start: '10:30', end: '11:30' }, // 1.5 hour slot
    { start: '11:00', end: '12:00' },
    { start: '11:00', end: '12:30' }, // 1.5 hour slot
    { start: '11:30', end: '12:30' }, // 1.5 hour slot
    { start: '13:00', end: '14:00' },
    { start: '13:00', end: '14:30' }, // 1.5 hour slot
    { start: '13:30', end: '14:30' }, // 1.5 hour slot
    { start: '14:00', end: '15:00' },
    { start: '14:00', end: '15:30' }, // 1.5 hour slot
    { start: '14:30', end: '15:30' }, // 1.5 hour slot
    { start: '15:00', end: '16:00' },
    { start: '15:00', end: '16:30' }, // 1.5 hour slot
    { start: '15:30', end: '16:30' }  // 1.5 hour slot
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
      const [sectionsRes, teachersRes, usersRes, classroomsRes, subjectsRes] = await Promise.all([
        sectionAPI.getAll(),
        teacherAPI.getAll(),
        userAPI.getAll(),
        classroomAPI.getAll(),
        subjectAPI.getAll(),
      ]);

      setSections(sectionsRes.data);
      setTeachers(teachersRes.data);
      setUsers(usersRes.data);
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

      console.log('🚀 Starting schedule generation...');
      console.log('📊 Data summary:', {
        sections: sections.length,
        teachers: teachers.length,
        classrooms: classrooms.length,
        subjects: subjects.length
      });

      const schedules = [];
      const failedSchedulesList = []; // Track failed schedules with reasons and resolutions
      const usedSlots = new Set(); // Track used time slots to prevent conflicts
      
      // Create even distribution tracking
      const dayUsage = { MONDAY: 0, TUESDAY: 0, WEDNESDAY: 0, THURSDAY: 0, FRIDAY: 0 };
      const timeUsage = { '08:00': 0, '09:00': 0, '10:00': 0, '11:00': 0, '13:00': 0, '14:00': 0, '15:00': 0 };
      const classroomUsage = {}; // Track classroom usage for load balancing
      const teacherUsage = {}; // Track teacher usage for load balancing
      
      // Initialize classroom usage tracking
      classrooms.forEach(classroom => {
        classroomUsage[classroom.id] = 0;
      });
      
      // Initialize teacher usage tracking
      getTeacherUsers().forEach(user => {
        teacherUsage[user.id] = 0;
      });
      
      // Helper functions - defined early to avoid hoisting issues
      const getLeastUsedClassroom = (suitableClassrooms) => {
        const classroomUsageList = suitableClassrooms.map(classroom => ({
          classroom,
          count: classroomUsage[classroom.id] || 0
        }));
        classroomUsageList.sort((a, b) => a.count - b.count);
        return classroomUsageList[0]?.classroom;
      };
      
      const getLeastUsedDay = (availableDays) => {
        const availableDayUsage = availableDays.map(day => ({ day, count: dayUsage[day] }));
        availableDayUsage.sort((a, b) => a.count - b.count);
        return availableDayUsage[0]?.day;
      };
      
      const getLeastUsedTimeSlot = (availableTimeSlots) => {
        const availableTimeUsage = availableTimeSlots.map(slot => ({ 
          slot, 
          count: timeUsage[slot.start] 
        }));
        availableTimeUsage.sort((a, b) => a.count - b.count);
        return availableTimeUsage[0]?.slot;
      };
      
      // Helper function to get available days based on schedule pattern
      const getAvailableDaysForPattern = (schedulePattern) => {
        const pattern = schedulePatterns.find(p => p.value === schedulePattern);
        return pattern ? pattern.days : daysOfWeek;
      };
      
      // Helper function to get the least used teacher for a subject
      const getLeastUsedTeacher = (availableTeachers) => {
        if (!availableTeachers || availableTeachers.length === 0) return null;
        
        const teacherUsageList = availableTeachers.map(teacher => ({
          teacher,
          count: teacherUsage[teacher.id] || 0
        }));
        
        teacherUsageList.sort((a, b) => a.count - b.count);
        return teacherUsageList[0]?.teacher;
      };
      
      
      const findBestAvailableClassroom = (suitableClassrooms, day, timeSlot, teacher, usedSlots) => {
        // Find classrooms that are available for this time slot and teacher
        const availableClassrooms = suitableClassrooms.filter(classroom => {
          const slotKey = `${day}-${timeSlot.start}-${timeSlot.end}-${teacher.id}-${classroom.id}`;
          return !usedSlots.has(slotKey);
        });
        
        if (availableClassrooms.length === 0) return null;
        
        // Among available classrooms, pick the least used one
        return getLeastUsedClassroom(availableClassrooms);
      };
      
      // Helper function to find consecutive time slots for a subject
      const findConsecutiveTimeSlots = (day, startTimeIndex, consecutiveHours, teacher, classroom, usedSlots) => {
        const availableTimeSlots = timeSlots.filter(slot => {
          const teacherStartTime = teacher.availableStartTime;
          const teacherEndTime = teacher.availableEndTime;
          return teacherStartTime <= slot.start && teacherEndTime >= slot.end;
        });
        
        // Try to find consecutive slots starting from the given index
        for (let i = startTimeIndex; i < availableTimeSlots.length - consecutiveHours + 1; i++) {
          const consecutiveSlots = [];
          let canUseConsecutive = true;
          
          // Check if we can use the next consecutive hours
          for (let j = 0; j < consecutiveHours; j++) {
            const slot = availableTimeSlots[i + j];
            const slotKey = `${day}-${slot.start}-${slot.end}-${teacher.id}-${classroom.id}`;
            
            if (usedSlots.has(slotKey)) {
              canUseConsecutive = false;
              break;
            }
            consecutiveSlots.push(slot);
          }
          
          if (canUseConsecutive) {
            return consecutiveSlots;
          }
        }
        
        return null;
      };
      
      // Collect all scheduling requests first
      const schedulingRequests = [];
      
      for (const section of sections) {
        console.log(`📝 Processing section: ${section.sectionName}`, {
          selectedSubjects: section.selectedSubjects,
          hasSelectedSubjects: !!section.selectedSubjects,
          selectedSubjectsLength: section.selectedSubjects?.length || 0
        });
        
        const sectionSubjects = subjects.filter(subject => 
          section.selectedSubjects?.includes(subject.id)
        );
        
        console.log(`📚 Found ${sectionSubjects.length} subjects for section ${section.sectionName}`);

        for (const subject of sectionSubjects) {
          console.log(`🔍 Looking for teacher for subject: ${subject.name}`);
          const teacherUsers = getTeacherUsers();
          const availableTeacherUsers = teacherUsers.filter(user => {
            const teacherData = getTeacherDataForUser(user);
            // Check if user has subject field directly or through teacher data
            const userSubject = user.subject || teacherData?.subject;
            return userSubject === subject.name;
          });

          if (availableTeacherUsers.length === 0) {
            console.log(`❌ No teacher users found for subject: ${subject.name}`);
            // Track missing teacher
            failedSchedulesList.push({
              section: section.sectionName,
              subject: subject.name,
              reason: 'No teacher available',
              details: `No teacher found for subject: ${subject.name}`,
              type: 'missing_teacher',
              resolution: 'Add a teacher who can teach this subject or assign an existing teacher to this subject'
            });
            continue;
          }

          // Select the least used teacher user for even distribution
          const selectedUser = getLeastUsedTeacher(availableTeacherUsers);
          const teacherData = getTeacherDataForUser(selectedUser);
          console.log(`👨‍🏫 Selected least used teacher for ${subject.name}: ${selectedUser.name || selectedUser.firstName + ' ' + selectedUser.lastName} (current load: ${teacherUsage[selectedUser.id] || 0})`);

          const suitableClassrooms = classrooms.filter(classroom => 
              classroom.roomType === subject.requiredRoomType || 
              subject.requiredRoomType === 'Any' ||
              !subject.requiredRoomType
            );

          console.log(`🏫 Looking for classroom for subject: ${subject.name} (required: ${subject.requiredRoomType || 'Any'})`);
          console.log(`🏫 Found ${suitableClassrooms.length} suitable classrooms`);

          if (suitableClassrooms.length === 0) {
            console.log(`❌ No classroom found for subject: ${subject.name} (room type: ${subject.requiredRoomType || 'Any'})`);
            // Track missing classroom
            failedSchedulesList.push({
              section: section.sectionName,
              subject: subject.name,
              reason: 'No classroom available',
              details: `No classroom found for room type: ${subject.requiredRoomType || 'Any'}`,
              type: 'missing_classroom',
              resolution: `Add a classroom with room type: ${subject.requiredRoomType || 'Any'}`
            });
            continue;
          }

          // Create scheduling requests distributed uniformly across the week
              const subjectDuration = parseInt(subject.durationPerWeek) || 1; // Default to 1 hour if not specified
              
          console.log(`✅ Creating ${subjectDuration} hours for ${section.sectionName} - ${subject.name} (distributed across week)`);
          
          // Determine optimal schedule pattern based on subject duration
          const optimalPattern = getOptimalSchedulePattern(subjectDuration);
          const availableDays = getAvailableDaysForPattern(optimalPattern);
          
          console.log(`📅 Section ${section.sectionName} - ${subject.name}: ${subjectDuration} hours → Optimal pattern: ${optimalPattern} -> Days: ${availableDays.join(', ')}`);
          
          console.log(`📊 Creating uniform schedule for ${subject.name}: ${subjectDuration} hours scheduled on ${availableDays.length} days using optimal ${optimalPattern} pattern`);
          
          // Create one scheduling request with optimal pattern based on duration
          // Automatically assigns: 1-2h→TTH, 3h→MWF, 4+h→DAILY for maximum efficiency
          const selectedClassroom = getLeastUsedClassroom(suitableClassrooms);
          
                schedulingRequests.push({
                  section,
                  subject,
            teacher: teacherData || selectedUser, // Use teacher data or user data for scheduling
            teacherUser: selectedUser, // Store user data for tracking
            classroom: selectedClassroom,
            durationIndex: 0, // All hours are part of the same uniform schedule
            totalDuration: subjectDuration,
            availableDays: availableDays, // All days this should be scheduled
            uniformSchedule: true, // Flag to indicate this needs uniform scheduling
            suitableClassrooms // Store all suitable classrooms for later use
          });
        }
      }

      console.log('📋 Created scheduling requests:', schedulingRequests.length);
      console.log('❌ Failed requests (missing resources):', failedSchedulesList.length);
      console.log('📊 Generated schedules so far:', schedules.length);

      // Process each scheduling request with uniform time slots across the week
      for (const request of schedulingRequests) {
        if (request.uniformSchedule) {
          // Handle uniform schedule - same time slot across all available days
        let assigned = false;
        let attempts = 0;
          const maxAttempts = timeSlots.length;
        
        // Get available time slots for this teacher
        const availableTimeSlots = timeSlots.filter(slot => {
          const teacherStartTime = request.teacher.availableStartTime;
          const teacherEndTime = request.teacher.availableEndTime;
          return teacherStartTime <= slot.start && teacherEndTime >= slot.end;
        });

          // Try to find a time slot that works for ALL available days
        while (!assigned && attempts < maxAttempts) {
          const timeSlot = getLeastUsedTimeSlot(availableTimeSlots);
          
            if (timeSlot) {
              // Check if this time slot is available on ALL required days
              const availableClassroom = findBestAvailableClassroom(
                request.suitableClassrooms, 
                request.availableDays[0], // Use first day to find classroom
                timeSlot, 
                request.teacher, 
                usedSlots
              );
              
              if (availableClassroom) {
                // Check if this time slot + classroom combination is available on required days
                // Use the minimum of pattern days or subject duration to respect both constraints
                const maxDays = Math.min(request.availableDays.length, request.totalDuration);
                const requiredDays = request.availableDays.slice(0, maxDays);
                let canUseOnRequiredDays = true;
                
                for (const day of requiredDays) {
                  const slotKey = `${day}-${timeSlot.start}-${timeSlot.end}-${request.teacher.id}-${availableClassroom.id}`;
                  if (usedSlots.has(slotKey)) {
                    canUseOnRequiredDays = false;
                    break;
                  }
                }
                
                if (canUseOnRequiredDays) {
                  // Create schedules for the required number of days (respecting duration)
                  for (const day of requiredDays) {
              const schedule = {
                date: new Date().toISOString().split('T')[0],
                startTime: timeSlot.start,
                endTime: timeSlot.end,
                dayOfWeek: day,
                teacher: request.teacher,
                      classroom: availableClassroom,
                subject: request.subject.name,
                      section: request.section,
                      subjectDuration: request.totalDuration,
                      durationIndex: 0,
                      notes: `Auto-generated uniform schedule for ${request.section.sectionName} - ${request.subject.name} at ${timeSlot.start}`,
                isRecurring: true,
                status: 'scheduled'
              };

              schedules.push(schedule);
              
              // Update usage counters
              dayUsage[day]++;
              timeUsage[timeSlot.start]++;
                    teacherUsage[request.teacherUser.id] = (teacherUsage[request.teacherUser.id] || 0) + 1;
                  }
                  
                  // Mark only the actually used slot keys as used
                  requiredDays.forEach(day => {
                    const slotKey = `${day}-${timeSlot.start}-${timeSlot.end}-${request.teacher.id}-${availableClassroom.id}`;
                usedSlots.add(slotKey);
                  });
                  classroomUsage[availableClassroom.id] = (classroomUsage[availableClassroom.id] || 0) + requiredDays.length;
                  
                  assigned = true;
                  console.log(`✅ Assigned uniform schedule for ${request.section.sectionName} - ${request.subject.name} at ${timeSlot.start} on ${requiredDays.length} days (${requiredDays.join(', ')}) - Duration: ${request.totalDuration} hours`);
                } else {
                  attempts++;
                }
              } else {
                attempts++;
              }
            } else {
            attempts++;
          }
        }

        if (!assigned) {
            // Track time conflicts
            failedSchedulesList.push({
              section: request.section.sectionName,
              subject: request.subject.name,
              reason: 'No uniform time slot available',
              details: `No time slot found that works across all ${request.availableDays.length} available days for ${request.teacher.firstName} ${request.teacher.lastName}`,
              type: 'time_conflict',
              resolution: 'Add more time slots, reduce subject duration, or add more teachers/classrooms to increase availability'
            });
            console.log(`Could not assign uniform schedule for ${request.section.sectionName} - ${request.subject.name}`);
          }
        }
      }

      console.log('🎯 Final schedule count before saving:', schedules.length);

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
      setFailedSchedules(failedSchedulesList);
      
      if (savedCount > 0) {
        // Calculate distribution statistics
        const dayStats = Object.entries(dayUsage).map(([day, count]) => `${day}: ${count}`).join(', ');
        const timeStats = Object.entries(timeUsage).map(([time, count]) => `${time}: ${count}`).join(', ');
        const teacherStats = Object.entries(teacherUsage)
          .filter(([_, count]) => count > 0)
          .map(([userId, count]) => {
            const user = users.find(u => u.id === userId);
            const userName = user ? (user.name || `${user.firstName} ${user.lastName}`) : `User ${userId}`;
            return `${userName}: ${count}`;
          })
          .join(', ');
        
        let successMessage = `Successfully generated and saved ${savedCount} schedule entries to database!${failedCount > 0 ? ` (${failedCount} failed to save)` : ''}`;
        
        // Add teacher distribution information
        if (teacherStats) {
          successMessage += `\n\n👨‍🏫 Teacher Distribution: ${teacherStats}`;
        }
        
        if (failedSchedulesList.length > 0) {
          successMessage += `\n\n⚠️ ${failedSchedulesList.length} schedules could not be created:`;
          const missingTeachers = failedSchedulesList.filter(f => f.type === 'missing_teacher').length;
          const missingClassrooms = failedSchedulesList.filter(f => f.type === 'missing_classroom').length;
          const timeConflicts = failedSchedulesList.filter(f => f.type === 'time_conflict').length;
          
          if (missingTeachers > 0) successMessage += `\n• ${missingTeachers} missing teachers`;
          if (missingClassrooms > 0) successMessage += `\n• ${missingClassrooms} missing classrooms`;
          if (timeConflicts > 0) successMessage += `\n• ${timeConflicts} time conflicts`;
        }
        
        // Calculate classroom utilization statistics
        const classroomStats = Object.entries(classroomUsage)
          .map(([classroomId, count]) => {
            const classroom = classrooms.find(c => c.id === classroomId);
            return `${classroom?.roomName || 'Unknown'}: ${count}`;
          })
          .join(', ');
        
        successMessage += `\n\nDistribution Summary:\nDays: ${dayStats}\nTimes: ${timeStats}\nClassrooms: ${classroomStats}`;
        
        setSuccess(successMessage);
        console.log('Schedule Distribution:', { dayUsage, timeUsage, classroomUsage });
      } else {
        setError(`Failed to save any schedules to database. ${failedCount} schedules failed to save.`);
      }
      
      console.log('✅ Scheduling complete:', {
        successfulSchedules: schedules.length,
        failedSchedules: failedSchedulesList.length,
        savedToDatabase: savedCount,
        failedToSave: failedCount
      });
    } catch (err) {
      console.error('Schedule generation error:', err);
      setError(`Failed to generate schedule: ${err.message || err.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  const clearSchedule = async () => {
    try {
      setLoading(true);
      
      // Clear from local state
      setGeneratedSchedules([]);
      setFailedSchedules([]);
      
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

  const deleteAllSchedules = async () => {
    if (!window.confirm('Are you sure you want to delete ALL generated schedules? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🗑️ Starting to delete all schedules...');
      
      // Get all existing schedules
      const existingSchedules = await scheduleAPI.getAll();
      console.log('📋 Schedule API response:', existingSchedules);
      console.log(`📋 Found ${existingSchedules.data?.length || 0} schedules to delete`);
      
      if (!existingSchedules.data || existingSchedules.data.length === 0) {
        setSuccess('✅ No schedules found to delete.');
        return;
      }
      
      let deletedCount = 0;
      let failedCount = 0;
      
      // Delete each schedule
        for (const schedule of existingSchedules.data) {
          try {
          console.log(`🗑️ Attempting to delete schedule:`, schedule);
            await scheduleAPI.delete(schedule.id);
            deletedCount++;
            console.log(`✅ Deleted schedule ${deletedCount}: ${schedule.subject} - ${schedule.dayOfWeek} ${schedule.startTime}`);
          } catch (deleteError) {
            failedCount++;
            console.error(`❌ Failed to delete schedule ${schedule.id}:`, deleteError);
        }
      }
      
      // Clear local state
      setGeneratedSchedules([]);
      setFailedSchedules([]);
      
      if (failedCount === 0) {
        setSuccess(`✅ Successfully deleted all ${deletedCount} schedules from the database!`);
      } else {
        setError(`⚠️ Deleted ${deletedCount} schedules, but ${failedCount} failed to delete. Check console for details.`);
      }
      
      console.log(`🗑️ Deletion complete: ${deletedCount} deleted, ${failedCount} failed`);
      
    } catch (error) {
      console.error('❌ Error during schedule deletion:', error);
      setError('Failed to delete schedules: ' + error.message);
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
        Each section will be scheduled for the full duration (hours per week) of their selected subjects.
        For example, if Mathematics requires 3 hours per week, the section will get 3 separate time slots for Mathematics.
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
                {getTeacherUsers().length}
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

      {/* Schedule Pattern Breakdown */}
      <Card sx={{ mb: 3, bgcolor: 'info.light', color: 'white' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            📅 Schedule Pattern Distribution
          </Typography>
          <Grid container spacing={2}>
            {schedulePatterns.map(pattern => {
              // Count subjects that would use this pattern based on their duration
              const subjectCount = subjects.filter(subject => {
                const duration = parseInt(subject.durationPerWeek) || 1;
                const optimalPattern = getOptimalSchedulePattern(duration);
                return optimalPattern === pattern.value;
              }).length;
              const totalDays = pattern.days.length;
              
              return (
                <Grid item xs={12} sm={4} key={pattern.value}>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    bgcolor: 'rgba(255,255,255,0.1)',
                    textAlign: 'center'
                  }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {subjectCount}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {pattern.label}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {totalDays} days per week
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      {pattern.days.join(', ')}
                    </Typography>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
          <Typography variant="body2" sx={{ mt: 2, opacity: 0.9 }}>
            💡 Schedule patterns are automatically assigned based on subject duration: 1-2h→TTH, 3h→MWF, 4+h→DAILY for optimal week utilization.
          </Typography>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<AutoAwesomeIcon />}
          onClick={generateSchedule}
          disabled={loading || sections.length === 0 || getTeacherUsers().length === 0 || classrooms.length === 0 || subjects.length === 0}
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
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={deleteAllSchedules}
          disabled={loading}
          sx={{ 
            borderColor: 'error.main',
            color: 'error.main',
            '&:hover': {
              borderColor: 'error.dark',
              backgroundColor: 'error.light',
              color: 'error.dark'
            }
          }}
        >
          Delete All Schedules
        </Button>
        <Button
          variant="outlined"
          color="warning"
          startIcon={<WarningIcon />}
          onClick={() => {
            // Test button to show failed schedules table
            const testFailedSchedules = [
              {
                section: 'Section A',
                subject: 'Mathematics',
                reason: 'No teacher available',
                details: 'No teacher found for subject: Mathematics',
                type: 'missing_teacher',
                resolution: 'Add a teacher who can teach Mathematics'
              },
              {
                section: 'Section B',
                subject: 'Science',
                reason: 'No classroom available',
                details: 'No classroom found for room type: Laboratory',
                type: 'missing_classroom',
                resolution: 'Add a classroom with room type: Laboratory'
              },
              {
                section: 'Section C',
                subject: 'English',
                reason: 'No available time slots',
                details: 'No available time slots found after 20 attempts',
                type: 'time_conflict',
                resolution: 'Add more time slots or reduce subject duration'
              }
            ];
            setFailedSchedules(testFailedSchedules);
            setSuccess('Test failed schedules loaded. Check the table below.');
          }}
          disabled={loading}
          sx={{ ml: 1 }}
        >
          Test Failed Schedules
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

      {/* Schedule Summary */}
      {generatedSchedules.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Schedule Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Hours per Section:</Typography>
                {sections.map(section => {
                  const sectionSchedules = generatedSchedules.filter(s => 
                    s.section.sectionName === section.sectionName || s.section === section.sectionName
                  );
                  const totalHours = sectionSchedules.length;
                  return (
                    <Box key={section.sectionName} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">{section.sectionName}:</Typography>
                      <Chip label={`${totalHours} hours`} size="small" color="primary" />
                    </Box>
                  );
                })}
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Hours per Subject:</Typography>
                {subjects.filter(subject => 
                  sections.some(section => section.selectedSubjects?.includes(subject.id))
                ).map(subject => {
                  const subjectSchedules = generatedSchedules.filter(s => s.subject === subject.name);
                  const totalHours = subjectSchedules.length;
                  const expectedHours = parseInt(subject.durationPerWeek) || 1;
                  const sectionsCount = sections.filter(section => 
                    section.selectedSubjects?.includes(subject.id)
                  ).length;
                  const expectedTotal = expectedHours * sectionsCount;
                  return (
                    <Box key={subject.name} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">{subject.name}:</Typography>
                      <Chip 
                        label={`${totalHours}/${expectedTotal} hours`} 
                        size="small" 
                        color={totalHours === expectedTotal ? "success" : "warning"} 
                      />
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
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Showing all generated schedule entries. Each subject may have multiple slots per day.
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Section</TableCell>
                    <TableCell>Pattern</TableCell>
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
                        <Chip label={schedule.section.sectionName || schedule.section} color="primary" size="small" />
                        </TableCell>
                      <TableCell>
                        <Chip 
                          label={getOptimalSchedulePattern(schedule.subjectDuration || schedule.totalDuration || 1)} 
                          color={getOptimalSchedulePattern(schedule.subjectDuration || schedule.totalDuration || 1) === 'MWF' ? 'secondary' : 
                                 getOptimalSchedulePattern(schedule.subjectDuration || schedule.totalDuration || 1) === 'TTH' ? 'warning' : 'info'}
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {schedule.subject}
                          </Typography>
                          {schedule.subjectDuration > 1 && (
                            <Typography variant="caption" color="textSecondary">
                              Hour {schedule.durationIndex + 1}/{schedule.subjectDuration} (distributed across week)
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
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

      {/* Schedule Summary */}
      {generatedSchedules.length > 0 && (
        <Card sx={{ mb: 3, bgcolor: 'success.light', color: 'white' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              📊 Schedule Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {generatedSchedules.length}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    Total Schedule Entries
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    Each subject may have multiple slots
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {new Set(generatedSchedules.map(s => s.section.sectionName || s.section)).size}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    Sections Scheduled
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {new Set(generatedSchedules.map(s => s.subject)).size}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    Subjects Scheduled
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Classroom Utilization */}
      {generatedSchedules.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Classroom Utilization
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Shows how schedules are distributed across all available classrooms for optimal resource usage.
            </Typography>
            <Grid container spacing={2}>
              {classrooms.map(classroom => {
                const usageCount = generatedSchedules.filter(s => s.classroom.id === classroom.id).length;
                const totalCapacity = classroom.capacity || 0;
                const utilizationPercent = totalCapacity > 0 ? Math.round((usageCount / totalCapacity) * 100) : 0;
                
                return (
                  <Grid item xs={12} sm={6} md={4} key={classroom.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {classroom.roomName}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Type: {classroom.roomType}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Capacity: {totalCapacity} students
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">Usage:</Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {usageCount} schedules
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">Utilization:</Typography>
                            <Chip 
                              label={`${utilizationPercent}%`} 
                              size="small" 
                              color={utilizationPercent > 80 ? 'success' : utilizationPercent > 50 ? 'warning' : 'info'}
                            />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Teacher Distribution */}
      {generatedSchedules.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Teacher Workload Distribution
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Shows how schedules are distributed across all teachers for balanced workload.
            </Typography>
            <Grid container spacing={2}>
              {getTeacherUsers().map(user => {
                const teacherData = getTeacherDataForUser(user);
                const userSubject = user.subject || teacherData?.subject;
                const scheduleCount = generatedSchedules.filter(s => {
                  const scheduleTeacherId = s.teacher?.id || s.teacherUser?.id;
                  return scheduleTeacherId === user.id || scheduleTeacherId === teacherData?.id;
                }).length;
                const teacherSubjects = subjects.filter(subject => subject.name === userSubject);
                const maxPossibleLoad = teacherSubjects.reduce((sum, subject) => sum + (parseInt(subject.durationPerWeek) || 1), 0);
                const workloadPercent = maxPossibleLoad > 0 ? Math.round((scheduleCount / maxPossibleLoad) * 100) : 0;
                
                if (!userSubject) return null;
                
                return (
                  <Grid item xs={12} sm={6} md={4} key={user.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {user.name || `${user.firstName} ${user.lastName}`}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Subject: {userSubject}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Max Possible Load: {maxPossibleLoad} hours/week
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">Current Load:</Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {scheduleCount} schedules
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">Workload:</Typography>
                            <Chip 
                              label={`${workloadPercent}%`} 
                              size="small" 
                              color={workloadPercent > 80 ? 'success' : workloadPercent > 50 ? 'warning' : 'info'}
                            />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Failed Schedules Notification */}
      {failedSchedules.length > 0 && (
        <Card sx={{ mb: 3, borderColor: 'warning.main', borderWidth: 2, borderStyle: 'solid' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="warning.main">
              <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Failed Schedule Assignments ({failedSchedules.length})
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              The following schedules could not be created due to resource constraints. Each issue includes specific resolution steps.
            </Typography>

            <Grid container spacing={2}>
              {['missing_teacher', 'missing_classroom', 'time_conflict'].map(type => {
                const typeFailed = failedSchedules.filter(f => f.type === type);
                if (typeFailed.length === 0) return null;

                const getIcon = () => {
                  switch(type) {
                    case 'missing_teacher': return <PersonIcon color="error" />;
                    case 'missing_classroom': return <SchoolIcon color="error" />;
                    case 'time_conflict': return <ScheduleIcon color="warning" />;
                    default: return <ErrorIcon />;
                  }
                };

                const getTypeLabel = () => {
                  switch(type) {
                    case 'missing_teacher': return 'Missing Teachers';
                    case 'missing_classroom': return 'Missing Classrooms';
                    case 'time_conflict': return 'Time Conflicts';
                    default: return 'Other Issues';
                  }
                };

                const getSeverity = () => {
                  switch(type) {
                    case 'missing_teacher': return 'error';
                    case 'missing_classroom': return 'error';
                    case 'time_conflict': return 'warning';
                    default: return 'info';
                  }
                };

                return (
                  <Grid item xs={12} md={4} key={type}>
                    <Card variant="outlined" sx={{ borderColor: type === 'time_conflict' ? 'warning.main' : 'error.main' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          {getIcon()}
                          <Typography variant="subtitle1" sx={{ ml: 1 }}>
                            {getTypeLabel()} ({typeFailed.length})
                          </Typography>
                        </Box>
                        <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                          {typeFailed.map((failed, index) => (
                            <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                              <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
                                {failed.section} - {failed.subject}
                              </Typography>
                              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                                <strong>Issue:</strong> {failed.details}
                              </Typography>
                              <Alert severity={getSeverity()} sx={{ mt: 1 }}>
                                <Typography variant="body2">
                                  <strong>Resolution:</strong> {failed.resolution}
                                </Typography>
                              </Alert>
                            </Box>
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body1" fontWeight="bold" sx={{ mb: 1 }}>
                Quick Actions to Resolve Issues:
              </Typography>
              <Typography variant="body2">
                • <strong>Missing Teachers:</strong> Go to Teacher Management and add teachers or assign existing teachers to additional subjects
                <br />• <strong>Missing Classrooms:</strong> Go to Classroom Management and add classrooms with the required room types
                <br />• <strong>Time Conflicts:</strong> Consider reducing subject duration or adding more time slots to the schedule
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Failed Schedules Table */}
      {failedSchedules.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="error.main">
              <ErrorIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Failed Schedule Assignments Table ({failedSchedules.length} entries)
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Detailed view of all schedules that could not be created due to resource constraints.
            </Typography>
            
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Section</strong></TableCell>
                    <TableCell><strong>Subject</strong></TableCell>
                    <TableCell><strong>Issue Type</strong></TableCell>
                    <TableCell><strong>Problem Description</strong></TableCell>
                    <TableCell><strong>Resolution</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {failedSchedules.map((failed, index) => (
                    <TableRow key={index} sx={{ '&:hover': { backgroundColor: 'grey.50' } }}>
                      <TableCell>
                        <Chip 
                          label={failed.section} 
                          color="primary" 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {failed.subject}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={failed.type.replace('_', ' ').toUpperCase()}
                          size="small"
                          color={
                            failed.type === 'missing_teacher' ? 'error' :
                            failed.type === 'missing_classroom' ? 'error' :
                            'warning'
                          }
                          icon={
                            failed.type === 'missing_teacher' ? <PersonIcon /> :
                            failed.type === 'missing_classroom' ? <SchoolIcon /> :
                            <ScheduleIcon />
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {failed.details}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ maxWidth: 300 }}>
                          <Typography variant="body2" color="primary">
                            {failed.resolution}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label="FAILED" 
                          color="error" 
                          size="small"
                          icon={<ErrorIcon />}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Summary Statistics */}
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>
                Failure Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'error.light', borderRadius: 1, color: 'white' }}>
                    <PersonIcon sx={{ fontSize: 30, mb: 1 }} />
                    <Typography variant="h4" fontWeight="bold">
                      {failedSchedules.filter(f => f.type === 'missing_teacher').length}
                    </Typography>
                    <Typography variant="body2">
                      Missing Teachers
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'error.light', borderRadius: 1, color: 'white' }}>
                    <SchoolIcon sx={{ fontSize: 30, mb: 1 }} />
                    <Typography variant="h4" fontWeight="bold">
                      {failedSchedules.filter(f => f.type === 'missing_classroom').length}
                    </Typography>
                    <Typography variant="body2">
                      Missing Classrooms
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 1, color: 'white' }}>
                    <ScheduleIcon sx={{ fontSize: 30, mb: 1 }} />
                    <Typography variant="h4" fontWeight="bold">
                      {failedSchedules.filter(f => f.type === 'time_conflict').length}
                    </Typography>
                    <Typography variant="body2">
                      Time Conflicts
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
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

