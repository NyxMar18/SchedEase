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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  Collapse,
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
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { sectionAPI } from '../firebase/sectionService';
import { teacherAPI, classroomAPI, scheduleAPI } from '../services/api';
import { subjectAPI } from '../firebase/subjectService';
import { userAPI } from '../services/userService';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';
import firebaseConfig from '../firebase/config';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const AutoSchedule = () => {
  const [sections, setSections] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [users, setUsers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [generatedSchedules, setGeneratedSchedules] = useState([]);
  const [failedSchedules, setFailedSchedules] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState('');
  const [showSchoolYearDialog, setShowSchoolYearDialog] = useState(false);
  const [showDeleteSchoolYearDialog, setShowDeleteSchoolYearDialog] = useState(false);
  const [deleteSelectedSchoolYear, setDeleteSelectedSchoolYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    scheduleDistribution: true,
    scheduleSummary: true,
    generatedSchedule: true,
    scheduleSummary2: true,
    classroomUtilization: true,
    teacherWorkload: true
  });

  // Toggle section collapse
  const toggleSection = (sectionName) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
  const schedulePatterns = [
    { value: 'DAILY', label: 'Daily (Mon-Fri)', days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] },
    { value: 'MWF', label: 'MWF (Mon/Wed/Fri)', days: ['MONDAY', 'WEDNESDAY', 'FRIDAY'] },
    { value: 'TTH', label: 'TTH (Tue/Thu)', days: ['TUESDAY', 'THURSDAY'] }
  ];


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
  // All break periods: Morning Break, Lunch, and Afternoon Break
  const breakPeriods = [
    { start: '09:00', end: '09:15', label: 'Morning Break' },
    { start: '12:15', end: '13:15', label: 'Lunch Break' },
    { start: '16:15', end: '16:30', label: 'Afternoon Break' }
  ];
  
  // Helper function to check if a time slot overlaps with any break
  const overlapsWithBreak = (slotStart, slotEnd) => {
    const slotStartTime = slotStart.split(':').map(Number);
    const slotEndTime = slotEnd.split(':').map(Number);
    const slotStartMinutes = slotStartTime[0] * 60 + slotStartTime[1];
    const slotEndMinutes = slotEndTime[0] * 60 + slotEndTime[1];
    
    // Check if slot overlaps with any break period
    for (const breakPeriod of breakPeriods) {
      const breakStartTime = breakPeriod.start.split(':').map(Number);
      const breakEndTime = breakPeriod.end.split(':').map(Number);
      const breakStartMinutes = breakStartTime[0] * 60 + breakStartTime[1];
      const breakEndMinutes = breakEndTime[0] * 60 + breakEndTime[1];
      
      // Check if slot overlaps with this break period
      if (!(slotEndMinutes <= breakStartMinutes || slotStartMinutes >= breakEndMinutes)) {
        return true; // Overlaps with this break
      }
    }
    
    return false; // No overlap with any break
  };
  
  // Helper function to check if a time slot spans across any break (for 1.5-hour slots)
  const spansAcrossBreak = (slotStart, slotEnd) => {
    const slotStartTime = slotStart.split(':').map(Number);
    const slotEndTime = slotEnd.split(':').map(Number);
    const slotStartMinutes = slotStartTime[0] * 60 + slotStartTime[1];
    const slotEndMinutes = slotEndTime[0] * 60 + slotEndTime[1];
    
    // Check if slot spans across any break period (start before break, end after break)
    for (const breakPeriod of breakPeriods) {
      const breakStartTime = breakPeriod.start.split(':').map(Number);
      const breakEndTime = breakPeriod.end.split(':').map(Number);
      const breakStartMinutes = breakStartTime[0] * 60 + breakStartTime[1];
      const breakEndMinutes = breakEndTime[0] * 60 + breakEndTime[1];
      
      // Check if slot starts before break and ends after break (spans across it)
      if (slotStartMinutes < breakStartMinutes && slotEndMinutes > breakEndMinutes) {
        return true; // Spans across this break
      }
    }
    
    return false; // Doesn't span across any break
  };

  const timeSlots = [
    { start: '07:30', end: '08:30' },
    { start: '07:30', end: '09:00' }, // 1.5 hour slot
    { start: '08:00', end: '09:00' },
    { start: '08:00', end: '09:30' }, // 1.5 hour slot
    { start: '08:30', end: '09:30' }, // 1.5 hour slot
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
    { start: '15:00', end: '16:15' }, // Before break
    { start: '15:30', end: '16:15' }, // Before break
    { start: '16:30', end: '17:30' }, // After break
    { start: '16:30', end: '18:00' }, // 1.5 hour slot after break
    { start: '17:00', end: '18:00' },
    { start: '17:00', end: '18:30' }, // 1.5 hour slot
    { start: '17:30', end: '18:30' }  // 1.5 hour slot
  ].filter(slot => {
    // Filter out slots that overlap with break OR span across breaks
    return !overlapsWithBreak(slot.start, slot.end) && !spansAcrossBreak(slot.start, slot.end);
  });

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
        
        // Fetch school years from localStorage
        await fetchSchoolYearsFromStorage();
    } catch (err) {
      setError('Failed to fetch data');
    }
  };

  const generateSchedule = async () => {
    if (sections.length === 0) {
      setError('Please add sections first');
      return;
    }
    
    // Check if school year is selected
    if (!selectedSchoolYear) {
      setShowSchoolYearDialog(true);
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
      console.log('📦 Classrooms data:', classrooms);
      console.log('📚 Subjects data:', subjects.map(s => ({ 
        id: s.id, 
        name: s.name, 
        requiredRoomTypes: s.requiredRoomTypes || (s.requiredRoomType ? [s.requiredRoomType] : []) 
      })));

      // Load existing schedules first to prevent conflicts
      // Only load schedules for the selected school year to avoid conflicts with other school years
      let existingSchedules = [];
      try {
        const existingRes = await scheduleAPI.getAll();
        const allSchedules = existingRes.data || [];
        // Filter to only include schedules from the selected school year
        existingSchedules = allSchedules.filter(schedule => schedule.schoolYearId === selectedSchoolYear);
        console.log(`📋 Loaded ${existingSchedules.length} existing schedules for conflict checking (school year: ${selectedSchoolYear})`);
        console.log(`📊 Total schedules in database: ${allSchedules.length}, filtered to ${existingSchedules.length} for selected school year`);
      } catch (error) {
        console.log('⚠️ Could not load existing schedules:', error);
      }

      const schedules = [];
      const failedSchedulesList = []; // Track failed schedules with reasons and resolutions
      const usedSlots = new Set(); // Track used time slots to prevent conflicts
      
      // Track all scheduled time periods for efficient conflict checking
      // Format: { day: { teacherId: [{start, end}], classroomId: [{start, end}], sectionId: [{start, end}] } }
      const scheduledPeriods = {
        MONDAY: { teachers: {}, classrooms: {}, sections: {} },
        TUESDAY: { teachers: {}, classrooms: {}, sections: {} },
        WEDNESDAY: { teachers: {}, classrooms: {}, sections: {} },
        THURSDAY: { teachers: {}, classrooms: {}, sections: {} },
        FRIDAY: { teachers: {}, classrooms: {}, sections: {} }
      };
      
      // Helper function to add a scheduled period (defined before use)
      const addScheduledPeriod = (day, teacherId, classroomId, sectionId, start, end) => {
        if (!scheduledPeriods[day] || !teacherId || !classroomId || !sectionId) return;
        
        const tId = String(teacherId);
        const cId = String(classroomId);
        const sId = String(sectionId);
        
        if (!scheduledPeriods[day].teachers[tId]) {
          scheduledPeriods[day].teachers[tId] = [];
        }
        scheduledPeriods[day].teachers[tId].push({ start, end });
        
        if (!scheduledPeriods[day].classrooms[cId]) {
          scheduledPeriods[day].classrooms[cId] = [];
        }
        scheduledPeriods[day].classrooms[cId].push({ start, end });
        
        if (!scheduledPeriods[day].sections[sId]) {
          scheduledPeriods[day].sections[sId] = [];
        }
        scheduledPeriods[day].sections[sId].push({ start, end });
      };
      
      // Populate scheduledPeriods with existing schedules
      existingSchedules.forEach(schedule => {
        if (schedule.dayOfWeek && schedule.startTime && schedule.endTime) {
          const teacherId = schedule.teacher?.id || schedule.teacher?.teacherId || schedule.teacherUser?.id;
          const classroomId = schedule.classroom?.id;
          let sectionId = null;
          if (schedule.section) {
            if (typeof schedule.section === 'object') {
              sectionId = schedule.section.id || schedule.section.sectionName || String(schedule.section);
            } else {
              sectionId = String(schedule.section);
            }
          }
          
          if (teacherId && classroomId && sectionId) {
            addScheduledPeriod(
              schedule.dayOfWeek,
              String(teacherId),
              String(classroomId),
              String(sectionId),
              schedule.startTime,
              schedule.endTime
            );
          }
        }
      });
      
      console.log(`✅ Populated scheduledPeriods with ${existingSchedules.length} existing schedules`);
      
      // Helper function to check if a period conflicts with scheduled periods
      const checkPeriodConflict = (day, teacherId, classroomId, sectionId, start, end) => {
        if (!scheduledPeriods[day] || !teacherId || !classroomId || !sectionId) return { conflict: false };
        
        const tId = String(teacherId);
        const cId = String(classroomId);
        const sId = String(sectionId);
        
        // Check teacher conflicts
        if (scheduledPeriods[day].teachers[tId]) {
          for (const period of scheduledPeriods[day].teachers[tId]) {
            if (timePeriodsOverlap(start, end, period.start, period.end)) {
              return { conflict: true, reason: 'teacher', details: `Teacher has overlapping schedule at ${period.start}-${period.end}` };
            }
          }
        }
        
        // Check classroom conflicts
        if (scheduledPeriods[day].classrooms[cId]) {
          for (const period of scheduledPeriods[day].classrooms[cId]) {
            if (timePeriodsOverlap(start, end, period.start, period.end)) {
              return { conflict: true, reason: 'classroom', details: `Classroom has overlapping schedule at ${period.start}-${period.end}` };
            }
          }
        }
        
        // Check section conflicts
        if (scheduledPeriods[day].sections[sId]) {
          for (const period of scheduledPeriods[day].sections[sId]) {
            if (timePeriodsOverlap(start, end, period.start, period.end)) {
              return { conflict: true, reason: 'section', details: `Section has overlapping schedule at ${period.start}-${period.end}` };
            }
          }
        }
        
        return { conflict: false };
      };
      
      // Create even distribution tracking
      const dayUsage = { MONDAY: 0, TUESDAY: 0, WEDNESDAY: 0, THURSDAY: 0, FRIDAY: 0 };
      const timeUsage = { '07:30': 0, '08:00': 0, '09:00': 0, '10:00': 0, '11:00': 0, '13:00': 0, '14:00': 0, '15:00': 0, '16:30': 0, '17:00': 0 };
      const classroomUsage = {}; // Track classroom usage for load balancing
      const teacherUsage = {}; // Track teacher usage for load balancing
      
      // Helper function to convert time string to minutes
      const timeToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };
      
      // Helper function to check if two time periods overlap
      const timePeriodsOverlap = (start1, end1, start2, end2) => {
        const start1Min = timeToMinutes(start1);
        const end1Min = timeToMinutes(end1);
        const start2Min = timeToMinutes(start2);
        const end2Min = timeToMinutes(end2);
        // Two periods overlap if one starts before the other ends
        return !(end1Min <= start2Min || end2Min <= start1Min);
      };
      
      // Helper function to check if a time slot conflicts with existing schedules
      const hasConflict = (day, slotStart, slotEnd, teacher, classroom, section) => {
        const teacherId = teacher?.id || teacher?.teacherId || (teacher?.teacherUser?.id);
        const classroomId = classroom?.id;
        // Handle section ID - can be object with id/sectionName, or string
        let sectionId = null;
        if (section) {
          if (typeof section === 'object') {
            sectionId = section.id || section.sectionName || String(section);
          } else {
            sectionId = String(section);
          }
        }
        
        if (!teacherId || !classroomId || !sectionId) {
          // If we can't get IDs, be conservative and check anyway
          console.warn(`⚠️ Missing IDs for conflict check: teacherId=${teacherId}, classroomId=${classroomId}, sectionId=${sectionId}`);
          return { conflict: false };
        }
        
        return checkPeriodConflict(day, String(teacherId), String(classroomId), String(sectionId), slotStart, slotEnd);
      };
      
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
      
      
      const findBestAvailableClassroom = (suitableClassrooms, day, timeSlot, teacher, usedSlots, section) => {
        // Find classrooms that are available for this time slot and teacher
        const availableClassrooms = suitableClassrooms.filter(classroom => {
          // Check exact slot match
          const slotKey = `${day}-${timeSlot.start}-${timeSlot.end}-${teacher.id}-${classroom.id}`;
          if (usedSlots.has(slotKey)) {
            return false;
          }
          
          // Check for time overlaps with existing schedules using the new tracking system
          const conflict = hasConflict(day, timeSlot.start, timeSlot.end, teacher, classroom, section);
          return !conflict.conflict;
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
          // Exclude slots that overlap with break period
          return teacherStartTime <= slot.start && teacherEndTime >= slot.end && !overlapsWithBreak(slot.start, slot.end);
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
            // Check if teacher has this subject in their subjects array (new format) or subject field (old format)
            if (teacherData?.subjects && Array.isArray(teacherData.subjects)) {
              return teacherData.subjects.includes(subject.name);
            }
            // Backward compatibility: check old single subject field
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

          // Handle backward compatibility: get required room types with durations
          let roomTypeConfigs = [];
          if (subject.requiredRoomTypes && Array.isArray(subject.requiredRoomTypes)) {
            // Check if it's new format (array of objects) or old format (array of strings)
            if (subject.requiredRoomTypes.length > 0 && typeof subject.requiredRoomTypes[0] === 'object') {
              roomTypeConfigs = subject.requiredRoomTypes;
            } else {
              // Old format: array of strings - distribute duration evenly
              const totalDuration = parseFloat(subject.durationPerWeek) || 1;
              const perType = totalDuration / subject.requiredRoomTypes.length;
              roomTypeConfigs = subject.requiredRoomTypes.map(type => ({ type, duration: perType }));
            }
          } else if (subject.requiredRoomType) {
            // Old format: single string
            roomTypeConfigs = [{ type: subject.requiredRoomType, duration: parseFloat(subject.durationPerWeek) || 1 }];
          } else {
            // No room type specified - use any classroom
            roomTypeConfigs = [{ type: 'Any', duration: parseFloat(subject.durationPerWeek) || 1 }];
          }
          
          console.log(`🏫 Room type configuration for ${subject.name}:`, roomTypeConfigs);
          
          // Process each room type configuration separately
          for (const roomTypeConfig of roomTypeConfigs) {
            const requiredRoomType = roomTypeConfig.type;
            
            // Fixed: All subjects are 3 hours, divided into 2 sessions of 1.5 hours each
            const fixedTotalDuration = 3; // Fixed 3 hours per subject
            const sessionDuration = 1.5; // Each session is 1.5 hours (6 × 15-minute slots)
            const numberOfSessions = 2; // 2 sessions per week
            
            console.log(`🏫 Looking for classroom for subject: ${subject.name} (room type: ${requiredRoomType}, fixed duration: ${fixedTotalDuration}h = ${numberOfSessions} sessions × ${sessionDuration}h)`);
            
            const suitableClassrooms = classrooms.filter(classroom => {
              const classroomType = (classroom.roomType || '').toLowerCase().trim();
              const normalizedRequiredType = (requiredRoomType || '').toLowerCase().trim();
              
              return (
                classroomType === normalizedRequiredType ||
                normalizedRequiredType === 'any' ||
                !normalizedRequiredType ||
                !requiredRoomType
              );
            });

            console.log(`🏫 Found ${suitableClassrooms.length} suitable classrooms for ${subject.name} (${requiredRoomType})`);

            if (suitableClassrooms.length === 0) {
              console.log(`❌ No classroom found for subject: ${subject.name} (room type: ${requiredRoomType})`);
              failedSchedulesList.push({
                section: section.sectionName,
                subject: subject.name,
                reason: 'No classroom available',
                details: `No classroom found for room type: ${requiredRoomType}`,
                type: 'missing_classroom',
                resolution: `Add a classroom with room type: ${requiredRoomType}`
              });
              continue;
            }

            // Get all available days for scheduling the 2 sessions
            const allAvailableDays = getAvailableDaysForPattern('DAILY');
            const selectedClassroom = getLeastUsedClassroom(suitableClassrooms);
            
            // Create 2 separate scheduling requests, one for each session
            // Each session will be scheduled on a different day
            for (let sessionIndex = 0; sessionIndex < numberOfSessions; sessionIndex++) {
              // Each session gets scheduled on a single day (will be assigned during scheduling)
              // We'll use all available days and let the scheduler pick the best day for each session
              const availableDays = allAvailableDays; // Will be reduced to 1 day per session during scheduling
              
              console.log(`✅ Creating session ${sessionIndex + 1}/${numberOfSessions} (${sessionDuration}h) for ${section.sectionName} - ${subject.name} in ${requiredRoomType}`);
            
            schedulingRequests.push({
              section,
              subject,
              teacher: teacherData || selectedUser,
              teacherUser: selectedUser,
              classroom: selectedClassroom,
                durationIndex: sessionIndex,
                totalDuration: sessionDuration, // Each session is 1.5 hours
                sessionNumber: sessionIndex + 1, // Track which session this is (1 or 2)
                totalSessions: numberOfSessions,
              availableDays: availableDays,
              uniformSchedule: true,
              suitableClassrooms,
              requiredRoomType: requiredRoomType // Store which room type this request is for
            });
            }
          }
        }
      }

      console.log('📋 Created scheduling requests:', schedulingRequests.length);
      console.log('❌ Failed requests (missing resources):', failedSchedulesList.length);
      console.log('📊 Generated schedules so far:', schedules.length);

      // Track which days have been used for each subject's sessions
      const subjectSessionDays = {}; // { 'subjectId-sectionId': [usedDays] }

      // Process each scheduling request with uniform time slots across the week
      for (const request of schedulingRequests) {
        if (request.uniformSchedule) {
          // Handle uniform schedule - each session on a single day
        let assigned = false;
        let attempts = 0;
          const maxAttempts = timeSlots.length * request.availableDays.length;
        
          // Get available time slots for this teacher (filter for 1.5 hour slots that don't span breaks)
          const availableTimeSlots = timeSlots.filter(slot => {
            const teacherStartTime = request.teacher.availableStartTime;
            const teacherEndTime = request.teacher.availableEndTime;
            // Calculate slot duration
            const startTime = new Date(`2000-01-01 ${slot.start}`);
            const endTime = new Date(`2000-01-01 ${slot.end}`);
            const durationMinutes = (endTime - startTime) / (1000 * 60);
            // Only use 1.5 hour (90 minute) slots that don't span across breaks
            const is90Minutes = durationMinutes === 90;
            const doesNotSpanBreaks = !spansAcrossBreak(slot.start, slot.end);
            const doesNotOverlapBreaks = !overlapsWithBreak(slot.start, slot.end);
            return teacherStartTime <= slot.start && teacherEndTime >= slot.end && is90Minutes && doesNotSpanBreaks && doesNotOverlapBreaks;
          });

          // Get days already used for this subject's other sessions
          const subjectKey = `${request.subject.id || request.subject.name}-${request.section.id || request.section.sectionName}`;
          const usedDaysForSubject = subjectSessionDays[subjectKey] || [];
          const availableDaysForSession = request.availableDays.filter(day => !usedDaysForSubject.includes(day));

          if (availableDaysForSession.length === 0) {
            console.log(`⚠️ No available days for session ${request.sessionNumber} of ${request.subject.name} - ${request.section.sectionName} (other sessions already scheduled)`);
            continue;
          }

          // Try to find a time slot that works for ONE available day
        while (!assigned && attempts < maxAttempts) {
          const timeSlot = getLeastUsedTimeSlot(availableTimeSlots);
          
            if (timeSlot) {
              // Try each available day for this session
              for (const day of availableDaysForSession) {
                if (assigned) break;
                
                // Check if this time slot is available on this day
              const availableClassroom = findBestAvailableClassroom(
                request.suitableClassrooms, 
                  day,
                timeSlot, 
                request.teacher, 
                  usedSlots,
                  request.section
              );
              
              if (availableClassroom) {
                  // First check if the overall 1.5-hour time slot conflicts with existing schedules
                  const overallConflict = hasConflict(
                    day, 
                    timeSlot.start, 
                    timeSlot.end, 
                    request.teacher, 
                    availableClassroom, 
                    request.section
                  );
                  
                  if (overallConflict.conflict) {
                    // Skip this time slot due to conflict
                    console.log(`⚠️ Overall conflict detected for ${request.subject.name} on ${day} at ${timeSlot.start}-${timeSlot.end}: ${overallConflict.reason}`);
                    continue;
                  }
                  
                  // Check exact slot match
                  const slotKey = `${day}-${timeSlot.start}-${timeSlot.end}-${request.teacher.id}-${availableClassroom.id}`;
                  if (usedSlots.has(slotKey)) {
                    continue;
                }
                
                  // Calculate duration and break into 15-minute individual schedule entries
                  const startTime = new Date(`2000-01-01 ${timeSlot.start}`);
                  const endTime = new Date(`2000-01-01 ${timeSlot.end}`);
                  const durationMinutes = (endTime - startTime) / (1000 * 60);
                  const numberOfSlots = Math.floor(durationMinutes / 15); // Should be 6 slots for 1.5 hours
                  
                  // Check if all consecutive slots are available
                  let allSlotsAvailable = true;
                  const individualSlots = [];
                  
                  for (let i = 0; i < numberOfSlots; i++) {
                      const slotStartMinutes = startTime.getHours() * 60 + startTime.getMinutes() + (i * 15);
                      const slotStartHours = Math.floor(slotStartMinutes / 60);
                      const slotStartMins = slotStartMinutes % 60;
                      const slotEndMinutes = slotStartMinutes + 15;
                      const slotEndHours = Math.floor(slotEndMinutes / 60);
                      const slotEndMins = slotEndMinutes % 60;
                      
                      const slotStartTime = `${String(slotStartHours).padStart(2, '0')}:${String(slotStartMins).padStart(2, '0')}`;
                      const slotEndTime = `${String(slotEndHours).padStart(2, '0')}:${String(slotEndMins).padStart(2, '0')}`;
                      
                      // If the overall time slot doesn't span breaks, individual 15-minute slots shouldn't overlap breaks
                      // But check anyway to be safe - if a slot overlaps a break, it means the time slot selection was wrong
                      if (overlapsWithBreak(slotStartTime, slotEndTime)) {
                        console.warn(`⚠️ Slot ${slotStartTime}-${slotEndTime} overlaps with break - this shouldn't happen if time slot selection is correct`);
                        allSlotsAvailable = false;
                        break;
                      }
                      
                      // Check for conflicts with existing schedules for this specific 15-minute slot
                      const slotConflict = hasConflict(
                        day, 
                        slotStartTime, 
                        slotEndTime, 
                        request.teacher, 
                        availableClassroom, 
                        request.section
                      );
                      
                      if (slotConflict.conflict) {
                        allSlotsAvailable = false;
                        break;
                      }
                      
                      individualSlots.push({ start: slotStartTime, end: slotEndTime });
                      
                      // Also check the usedSlots set for exact matches
                      const daySlotKey = `${day}-${slotStartTime}-${slotEndTime}-${request.teacher.id}-${availableClassroom.id}`;
                      if (usedSlots.has(daySlotKey)) {
                        allSlotsAvailable = false;
                        break;
                      }
                    }
                    
                    // Ensure we have exactly 6 slots (1.5 hours = 90 minutes = 6 × 15-minute slots)
                    if (allSlotsAvailable && individualSlots.length === 6) {
                      // Get IDs for conflict checking and adding to scheduledPeriods
                      const teacherId = request.teacher?.id || request.teacher?.teacherId || request.teacherUser?.id;
                      const classroomId = availableClassroom.id;
                      const sectionId = request.section?.id || request.section?.sectionName || String(request.section);
                      
                      // Final safety check: verify no conflicts before creating schedules
                      let finalCheckPassed = true;
                      for (const slot of individualSlots) {
                        const finalConflict = hasConflict(
                          day, 
                          slot.start, 
                          slot.end, 
                          request.teacher, 
                          availableClassroom, 
                          request.section
                        );
                        if (finalConflict.conflict) {
                          finalCheckPassed = false;
                          console.log(`⚠️ Conflict detected during final check: ${finalConflict.reason} - ${finalConflict.details}`);
                          break;
                        }
                      }
                      
                      if (!finalCheckPassed) {
                        attempts++;
                        continue;
                      }
                      
                      // Verify we still have 6 slots after all checks
                      if (individualSlots.length !== 6) {
                        console.warn(`⚠️ Expected 6 slots but got ${individualSlots.length} for ${timeSlot.start}-${timeSlot.end}`);
                        attempts++;
                        continue;
                      }
                      
                      // Create individual schedule entries for each 15-minute slot (on single day)
                      let slotIndex = 0;
                      const firstSlot = individualSlots[0];
                      const lastSlot = individualSlots[individualSlots.length - 1];
                      
                      for (const slot of individualSlots) {
                        const schedule = {
                          date: new Date().toISOString().split('T')[0],
                          startTime: slot.start,
                          endTime: slot.end,
                          dayOfWeek: day,
                          teacher: request.teacher,
                          classroom: availableClassroom,
                          subject: request.subject.name,
                          section: request.section,
                          subjectDuration: 3, // Total 3 hours per subject (2 sessions × 1.5h)
                          sessionNumber: request.sessionNumber,
                          totalSessions: request.totalSessions,
                          durationIndex: slotIndex,
                          schoolYearId: selectedSchoolYear,
                          notes: `Auto-generated schedule for ${request.section.sectionName} - ${request.subject.name} (Session ${request.sessionNumber}/${request.totalSessions}, Slot ${slotIndex + 1}/${individualSlots.length})`,
                          isRecurring: true,
                          status: 'scheduled'
                        };

                        schedules.push(schedule);
                        
                        // Mark this slot as used
                        const daySlotKey = `${day}-${slot.start}-${slot.end}-${request.teacher.id}-${availableClassroom.id}`;
                        usedSlots.add(daySlotKey);
                        
                        // Update usage counters
                        dayUsage[day]++;
                        timeUsage[slot.start]++;
                        teacherUsage[request.teacherUser.id] = (teacherUsage[request.teacherUser.id] || 0) + 1;
                        
                        slotIndex++;
                      }
                      
                      // Add the entire session period to scheduledPeriods to prevent future conflicts
                      // Use first and last slot times to represent the full session
                      if (firstSlot && lastSlot && teacherId && classroomId && sectionId) {
                        addScheduledPeriod(
                          day,
                          String(teacherId),
                          String(classroomId),
                          String(sectionId),
                          firstSlot.start,
                          lastSlot.end
                        );
                      }
                      
                      // Track that this day is used for this subject
                      if (!subjectSessionDays[subjectKey]) {
                        subjectSessionDays[subjectKey] = [];
                      }
                      subjectSessionDays[subjectKey].push(day);
                    
                      classroomUsage[availableClassroom.id] = (classroomUsage[availableClassroom.id] || 0) + individualSlots.length;
                    
                    assigned = true;
                      console.log(`✅ Assigned session ${request.sessionNumber}/${request.totalSessions} (${individualSlots.length} slots = ${request.totalDuration}h) for ${request.section.sectionName} - ${request.subject.name} starting at ${timeSlot.start} on ${day} - Total: ${individualSlots.length} schedule entries`);
                      break;
                  }
                }
                }
              
              if (!assigned) {
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
              details: `No time slot found that works for session ${request.sessionNumber}/${request.totalSessions} for ${request.teacher.firstName} ${request.teacher.lastName}`,
              type: 'time_conflict',
              resolution: 'Add more time slots, reduce subject duration, or add more teachers/classrooms to increase availability'
            });
            console.log(`Could not assign uniform schedule for ${request.section.sectionName} - ${request.subject.name} (Session ${request.sessionNumber}/${request.totalSessions})`);
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
      
      // Debug logging for failed schedules
      console.log('🔍 Setting failed schedules:', failedSchedulesList.length, 'entries');
      if (failedSchedulesList.length > 0) {
        console.log('❌ Failed schedules details:', failedSchedulesList);
      }
      
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
      
      // Reload existing schedules after generation to ensure conflict checking works on subsequent runs
      await loadExistingSchedules();
    } catch (err) {
      console.error('Schedule generation error:', err);
      setError(`Failed to generate schedule: ${err.message || err.toString()}`);
    } finally {
      setLoading(false);
    }
  };


  const deleteAllSchedules = async () => {
    // Show school year selection dialog instead of deleting all
    setShowDeleteSchoolYearDialog(true);
  };

  const handleDeleteSchedulesBySchoolYear = async () => {
    if (!deleteSelectedSchoolYear) {
      setError('Please select a school year to delete schedules from.');
      return;
    }

    const selectedSchoolYearName = schoolYears.find(sy => sy.id === deleteSelectedSchoolYear)?.name;
    if (!window.confirm(`⚠️ Are you sure you want to delete ALL schedules for "${selectedSchoolYearName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log(`🗑️ Starting to delete schedules for school year: ${selectedSchoolYearName}...`);
      
      // Get all existing schedules
      const existingSchedules = await scheduleAPI.getAll();
      console.log('📋 Schedule API response:', existingSchedules);
      
      // Filter schedules by selected school year
      const schedulesToDelete = existingSchedules.data.filter(schedule => 
        schedule.schoolYearId === deleteSelectedSchoolYear
      );
      
      console.log(`📋 Found ${schedulesToDelete.length} schedules to delete for school year: ${selectedSchoolYearName}`);
      
      if (schedulesToDelete.length === 0) {
        setSuccess(`✅ No schedules found for "${selectedSchoolYearName}".`);
        setShowDeleteSchoolYearDialog(false);
        return;
      }
      
      let deletedCount = 0;
      let failedCount = 0;
      
      // Delete each schedule
      for (const schedule of schedulesToDelete) {
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
      
      // Clear local state if we deleted schedules for the currently selected school year
      if (deleteSelectedSchoolYear === selectedSchoolYear) {
      setGeneratedSchedules([]);
        setFailedSchedules([]);
      }
      
      if (failedCount === 0) {
        setSuccess(`✅ Successfully deleted all ${deletedCount} schedules from "${selectedSchoolYearName}"!`);
      } else {
        setError(`⚠️ Deleted ${deletedCount} schedules, but ${failedCount} failed to delete. Check console for details.`);
      }
      
      console.log(`🗑️ Deletion complete: ${deletedCount} deleted, ${failedCount} failed`);
      setShowDeleteSchoolYearDialog(false);
      
    } catch (error) {
      console.error('❌ Error during schedule deletion:', error);
      setError('Failed to delete schedules: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // School Year Management functions using Firebase
  const fetchSchoolYearsFromStorage = async () => {
    try {
      const schoolYearsRef = collection(db, 'schoolYears');
      const q = query(schoolYearsRef, orderBy('name', 'desc'));
      const querySnapshot = await getDocs(q);
      const schoolYears = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSchoolYears(schoolYears);
      
      // Set active school year as default if available
      const activeSchoolYear = schoolYears.find(sy => sy.isActive);
      if (activeSchoolYear) {
        setSelectedSchoolYear(activeSchoolYear.id);
      }
    } catch (err) {
      console.error('Failed to fetch school years:', err);
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
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => toggleSection('scheduleDistribution')}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 0 }}>
              📅 Schedule Pattern Distribution
            </Typography>
            {expandedSections.scheduleDistribution ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </Box>
        </CardContent>
        <Collapse in={expandedSections.scheduleDistribution}>
          <CardContent sx={{ pt: 0 }}>
          <Grid container spacing={2}>
            {schedulePatterns.map(pattern => {
              // Count subjects (all use DAILY pattern now)
              const subjectCount = pattern.value === 'DAILY' ? subjects.length : 0;
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
            💡 All schedules are distributed across all weekdays (Monday-Friday).
          </Typography>
          </CardContent>
        </Collapse>
      </Card>

      {/* School Year Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SchoolIcon color="primary" />
            School Year Selection
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Select which school year the generated schedules will belong to. This helps organize schedules by academic periods.
          </Typography>
          
          {schoolYears.length > 0 ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" fontWeight="medium">
                Selected School Year:
              </Typography>
              <Chip
                label={selectedSchoolYear ? schoolYears.find(sy => sy.id === selectedSchoolYear)?.name || 'Not selected' : 'Not selected'}
                color={selectedSchoolYear ? 'primary' : 'default'}
                variant={selectedSchoolYear ? 'filled' : 'outlined'}
              />
              <Button
                size="small"
                onClick={() => setShowSchoolYearDialog(true)}
              >
                {selectedSchoolYear ? 'Change' : 'Select'} School Year
              </Button>
            </Box>
          ) : (
            <Alert severity="warning">
              No school years found. Please create a school year first before generating schedules.
            </Alert>
          )}
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" fontWeight="medium">
            School Year:
          </Typography>
          <Select
            value={selectedSchoolYear || ''}
            onChange={(e) => setSelectedSchoolYear(e.target.value)}
            displayEmpty
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">
              <em>Select School Year</em>
            </MenuItem>
            {schoolYears.map((schoolYear) => (
              <MenuItem key={schoolYear.id} value={schoolYear.id}>
                {schoolYear.name} {schoolYear.isActive && '(Active)'}
              </MenuItem>
            ))}
          </Select>
        </Box>
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
          Delete Schedules by School Year
        </Button>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Enhanced Schedule Distribution Dashboard */}
      {generatedSchedules.length > 0 && (
        <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <ScheduleIcon sx={{ mr: 2, color: 'primary.main', fontSize: 28 }} />
              <Typography variant="h5" fontWeight="bold" color="primary.main">
                Schedule Distribution Overview
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              📊 Visual breakdown of how your schedules are distributed across days and time slots
            </Typography>

            <Grid container spacing={3}>
              {/* Days Distribution */}
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  borderRadius: 2, 
                  p: 2.5, 
                  height: '100%',
                  border: '1px solid',
                  borderColor: 'grey.200'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                      📅 Days Distribution
                    </Typography>
                    <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                      Classes per day
                    </Typography>
                  </Box>
                  
                  {Object.entries({ MONDAY: 0, TUESDAY: 0, WEDNESDAY: 0, THURSDAY: 0, FRIDAY: 0 }).map(([day, _]) => {
                    const count = generatedSchedules.filter(s => s.dayOfWeek === day).length;
                    const percentage = generatedSchedules.length > 0 ? Math.round((count / generatedSchedules.length) * 100) : 0;
                    const maxCount = Math.max(...Object.values({ MONDAY: 0, TUESDAY: 0, WEDNESDAY: 0, THURSDAY: 0, FRIDAY: 0 }).map((_, index) => 
                      generatedSchedules.filter(s => s.dayOfWeek === Object.keys({ MONDAY: 0, TUESDAY: 0, WEDNESDAY: 0, THURSDAY: 0, FRIDAY: 0 })[index]).length
                    ));
                    
                    return (
                      <Box key={day} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" fontWeight="medium" color="text.primary">
                            {day.charAt(0) + day.slice(1).toLowerCase()}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              {percentage}%
                            </Typography>
                            <Chip 
                              label={count} 
                              size="small" 
                              sx={{ 
                                bgcolor: count > 0 ? 'primary.main' : 'grey.300',
                                color: count > 0 ? 'white' : 'grey.600',
                                fontWeight: 'bold',
                                minWidth: '40px'
                              }} 
                            />
                          </Box>
                        </Box>
                        
                        {/* Progress Bar */}
                        <Box sx={{ 
                          width: '100%', 
                          height: 6, 
                          bgcolor: 'grey.200', 
                          borderRadius: 3,
                          overflow: 'hidden'
                        }}>
                          <Box sx={{ 
                            width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%`, 
                            height: '100%', 
                            bgcolor: count > 0 ? 'primary.main' : 'grey.300',
                            borderRadius: 3,
                            transition: 'width 0.3s ease'
                          }} />
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Grid>

              {/* Time Distribution */}
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  borderRadius: 2, 
                  p: 2.5, 
                  height: '100%',
                  border: '1px solid',
                  borderColor: 'grey.200'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold" color="secondary.main">
                      ⏰ Time Distribution
                    </Typography>
                    <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                      Classes per time slot
                    </Typography>
                  </Box>
                  
                  <Box sx={{ maxHeight: 300, overflowY: 'auto', pr: 1 }}>
                    {timeSlots.map((timeSlot, slotIndex) => {
                      const count = generatedSchedules.filter(s => s.startTime === timeSlot.start).length;
                      const percentage = generatedSchedules.length > 0 ? Math.round((count / generatedSchedules.length) * 100) : 0;
                      const maxCount = Math.max(...timeSlots.map(slot => 
                        generatedSchedules.filter(s => s.startTime === slot.start).length
                      ));
                      
                      return (
                        <Box key={`time-slot-${timeSlot.start}-${timeSlot.end}-${slotIndex}`} sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" fontWeight="medium" color="text.primary">
                              {timeSlot.start}-{timeSlot.end}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                {percentage}%
                              </Typography>
                              <Chip 
                                label={count} 
                                size="small" 
                                sx={{ 
                                  bgcolor: count > 0 ? 'secondary.main' : 'grey.300',
                                  color: count > 0 ? 'white' : 'grey.600',
                                  fontWeight: 'bold',
                                  minWidth: '40px'
                                }} 
                              />
                            </Box>
                          </Box>
                          
                          {/* Progress Bar */}
                          <Box sx={{ 
                            width: '100%', 
                            height: 6, 
                            bgcolor: 'grey.200', 
                            borderRadius: 3,
                            overflow: 'hidden'
                          }}>
                            <Box sx={{ 
                              width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%`, 
                              height: '100%', 
                              bgcolor: count > 0 ? 'secondary.main' : 'grey.300',
                              borderRadius: 3,
                              transition: 'width 0.3s ease'
                            }} />
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </Grid>
            </Grid>

            {/* Summary Statistics */}
            <Box sx={{ 
              mt: 3, 
              p: 2, 
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'grey.200'
            }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: 'text.primary' }}>
                📈 Quick Stats
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight="bold" color="primary.main">
                      {generatedSchedules.length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total Classes
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight="bold" color="secondary.main">
                      {new Set(generatedSchedules.map(s => s.dayOfWeek)).size}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Active Days
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight="bold" color="success.main">
                      {new Set(generatedSchedules.map(s => s.startTime)).size}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Time Slots Used
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight="bold" color="warning.main">
                      {Math.round(generatedSchedules.length / 5)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Avg/Day
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Schedule Summary */}
      {generatedSchedules.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => toggleSection('scheduleSummary')}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 0 }}>
              <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Schedule Summary
            </Typography>
              {expandedSections.scheduleSummary ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Box>
          </CardContent>
          <Collapse in={expandedSections.scheduleSummary}>
            <CardContent sx={{ pt: 0 }}>
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
                  const totalSlots = subjectSchedules.length;
                  // Fixed: All subjects are 3 hours = 2 sessions × 1.5h = 2 sessions × 6 slots = 12 slots per section
                  const slotsPerSection = 12; // 2 sessions × 6 slots (15-min each) = 12 slots
                  const sectionsCount = sections.filter(section => 
                    section.selectedSubjects?.includes(subject.id)
                  ).length;
                  const expectedTotal = slotsPerSection * sectionsCount;
                  return (
                    <Box key={subject.name} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">{subject.name}:</Typography>
                      <Chip 
                        label={`${totalSlots}/${expectedTotal} slots`} 
                        size="small" 
                        color={totalSlots === expectedTotal ? "success" : "warning"} 
                      />
                    </Box>
                  );
                })}
              </Grid>
            </Grid>
          </CardContent>
          </Collapse>
        </Card>
      )}

      {/* Generated Schedule Table */}
      {generatedSchedules.length > 0 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => toggleSection('generatedSchedule')}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 0 }}>
                <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Generated Schedule ({generatedSchedules.length} entries)
              </Typography>
              {expandedSections.generatedSchedule ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Box>
          </CardContent>
          <Collapse in={expandedSections.generatedSchedule}>
            <CardContent sx={{ pt: 0 }}>
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
                          label="DAILY" 
                          color="info"
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {schedule.subject}
                          </Typography>
                          {schedule.sessionNumber && (
                            <Typography variant="caption" color="textSecondary">
                              Session {schedule.sessionNumber}/{schedule.totalSessions || 2} - Slot {schedule.durationIndex + 1}/6
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
          </Collapse>
        </Card>
      )}

      {/* Schedule Summary */}
      {generatedSchedules.length > 0 && (
        <Card sx={{ mb: 3, bgcolor: 'success.light', color: 'white' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => toggleSection('scheduleSummary2')}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 0 }}>
                📊 Schedule Summary
              </Typography>
              {expandedSections.scheduleSummary2 ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Box>
          </CardContent>
          <Collapse in={expandedSections.scheduleSummary2}>
            <CardContent sx={{ pt: 0 }}>
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
          </Collapse>
        </Card>
      )}

      {/* Classroom Utilization */}
      {generatedSchedules.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => toggleSection('classroomUtilization')}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 0 }}>
                <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Classroom Utilization
              </Typography>
              {expandedSections.classroomUtilization ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Box>
          </CardContent>
          <Collapse in={expandedSections.classroomUtilization}>
            <CardContent sx={{ pt: 0 }}>
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
          </Collapse>
        </Card>
      )}

      {/* Teacher Distribution */}
      {generatedSchedules.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => toggleSection('teacherWorkload')}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 0 }}>
                <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Teacher Workload Distribution
              </Typography>
              {expandedSections.teacherWorkload ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </Box>
          </CardContent>
          <Collapse in={expandedSections.teacherWorkload}>
            <CardContent sx={{ pt: 0 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Shows how schedules are distributed across all teachers for balanced workload.
            </Typography>
            <Grid container spacing={2}>
              {getTeacherUsers().map(user => {
                const teacherData = getTeacherDataForUser(user);
                // Get subjects from new subjects array or old subject field
                const userSubjects = teacherData?.subjects || [user.subject || teacherData?.subject].filter(Boolean);
                const userSubject = userSubjects.length > 0 ? userSubjects.join(', ') : 'N/A';
                const scheduleCount = generatedSchedules.filter(s => {
                  const scheduleTeacherId = s.teacher?.id || s.teacherUser?.id;
                  return scheduleTeacherId === user.id || scheduleTeacherId === teacherData?.id;
                }).length;
                const teacherSubjects = subjects.filter(subject => userSubjects.includes(subject.name));
                const maxPossibleLoad = teacherSubjects.reduce((sum, subject) => sum + 3, 0); // Fixed: All subjects are 3 hours
                const workloadPercent = maxPossibleLoad > 0 ? Math.round((scheduleCount / maxPossibleLoad) * 100) : 0;
                
                if (userSubjects.length === 0) return null;
                
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
          </Collapse>
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

      {/* Debug Display - Remove this after testing */}
      <Card sx={{ mb: 2, bgcolor: 'grey.100' }}>
        <CardContent>
          <Typography variant="body2" component="div">
            <strong>Debug Info:</strong> Failed Schedules Count: {failedSchedules.length}
            {failedSchedules.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <strong>Failed Schedules:</strong>
                <Box component="pre" sx={{ mt: 1, p: 1, bgcolor: 'grey.200', borderRadius: 1, overflow: 'auto' }}>
                  {JSON.stringify(failedSchedules, null, 2)}
                </Box>
              </Box>
            )}
          </Typography>
        </CardContent>
      </Card>

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

      {/* School Year Selection Dialog */}
      <Dialog open={showSchoolYearDialog} onClose={() => setShowSchoolYearDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Select School Year
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Choose which school year the generated schedules will belong to:
          </Typography>
          
          {schoolYears.map((schoolYear) => (
            <Box
              key={schoolYear.id}
              sx={{
                p: 2,
                mb: 1,
                border: selectedSchoolYear === schoolYear.id ? '2px solid #1976d2' : '1px solid #e0e0e0',
                borderRadius: 1,
                cursor: 'pointer',
                bgcolor: selectedSchoolYear === schoolYear.id ? 'primary.light' : 'background.paper',
                '&:hover': {
                  bgcolor: selectedSchoolYear === schoolYear.id ? 'primary.light' : 'action.hover',
                }
              }}
              onClick={() => setSelectedSchoolYear(schoolYear.id)}
            >
              <Typography variant="h6" fontWeight="medium">
                {schoolYear.name}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {schoolYear.description || 'No description'}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {new Date(schoolYear.startDate).toLocaleDateString()} - {new Date(schoolYear.endDate).toLocaleDateString()}
              </Typography>
              {schoolYear.isActive && (
                <Chip label="Active" color="success" size="small" sx={{ ml: 1 }} />
              )}
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSchoolYearDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setShowSchoolYearDialog(false);
              if (selectedSchoolYear) {
                generateSchedule();
              }
            }}
            variant="contained"
            disabled={!selectedSchoolYear}
          >
            Generate Schedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete School Year Schedules Dialog */}
      <Dialog open={showDeleteSchoolYearDialog} onClose={() => setShowDeleteSchoolYearDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Delete Schedules by School Year
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Select a school year to delete all schedules from that year. This action cannot be undone.
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="subtitle2" fontWeight="medium">
              Select School Year to Delete:
            </Typography>
            <Select
              value={deleteSelectedSchoolYear || ''}
              onChange={(e) => setDeleteSelectedSchoolYear(e.target.value)}
              displayEmpty
              fullWidth
            >
              <MenuItem value="">
                <em>Select School Year</em>
              </MenuItem>
              {schoolYears.map((schoolYear) => (
                <MenuItem key={schoolYear.id} value={schoolYear.id}>
                  {schoolYear.name} {schoolYear.isActive && '(Active)'}
                </MenuItem>
              ))}
            </Select>
            
            {deleteSelectedSchoolYear && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  ⚠️ This will delete ALL schedules for "{schoolYears.find(sy => sy.id === deleteSelectedSchoolYear)?.name}". 
                  This action cannot be undone.
                </Typography>
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteSchoolYearDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteSchedulesBySchoolYear}
            variant="contained"
            color="error"
            disabled={!deleteSelectedSchoolYear || loading}
            startIcon={<DeleteIcon />}
          >
            {loading ? 'Deleting...' : 'Delete Schedules'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default AutoSchedule;

