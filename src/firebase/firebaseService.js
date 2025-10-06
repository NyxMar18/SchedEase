// Temporary localStorage-based service until Firebase is properly installed
import firebaseConfig from './config';

// Helper functions for localStorage
const getStorageKey = (collection) => `firebase_${collection}`;

const getData = (collection) => {
  try {
    const data = localStorage.getItem(getStorageKey(collection));
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting data from localStorage:', error);
    return [];
  }
};

const setData = (collection, data) => {
  try {
    localStorage.setItem(getStorageKey(collection), JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving data to localStorage:', error);
    return false;
  }
};

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Classroom operations
export const classroomFirebaseAPI = {
  getAll: async () => {
    try {
      const classrooms = getData('classrooms');
      return { data: classrooms };
    } catch (error) {
      console.error('Error getting classrooms:', error);
      throw error;
    }
  },

  create: async (classroom) => {
    try {
      const classrooms = getData('classrooms');
      const newClassroom = { id: generateId(), ...classroom };
      classrooms.push(newClassroom);
      setData('classrooms', classrooms);
      return { data: newClassroom };
    } catch (error) {
      console.error('Error adding classroom:', error);
      throw error;
    }
  },

  update: async (id, classroom) => {
    try {
      const classrooms = getData('classrooms');
      const index = classrooms.findIndex(c => c.id === id);
      if (index !== -1) {
        classrooms[index] = { ...classrooms[index], ...classroom };
        setData('classrooms', classrooms);
        return { data: classrooms[index] };
      }
      throw new Error('Classroom not found');
    } catch (error) {
      console.error('Error updating classroom:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const classrooms = getData('classrooms');
      const filteredClassrooms = classrooms.filter(c => c.id !== id);
      setData('classrooms', filteredClassrooms);
      return { data: {} };
    } catch (error) {
      console.error('Error deleting classroom:', error);
      throw error;
    }
  }
};

// Teacher operations
export const teacherFirebaseAPI = {
  getAll: async () => {
    try {
      const teachers = getData('teachers');
      return { data: teachers };
    } catch (error) {
      console.error('Error getting teachers:', error);
      throw error;
    }
  },

  create: async (teacher) => {
    try {
      const teachers = getData('teachers');
      const newTeacher = { id: generateId(), ...teacher };
      teachers.push(newTeacher);
      setData('teachers', teachers);
      return { data: newTeacher };
    } catch (error) {
      console.error('Error adding teacher:', error);
      throw error;
    }
  },

  update: async (id, teacher) => {
    try {
      const teachers = getData('teachers');
      const index = teachers.findIndex(t => t.id === id);
      if (index !== -1) {
        teachers[index] = { ...teachers[index], ...teacher };
        setData('teachers', teachers);
        return { data: teachers[index] };
      }
      throw new Error('Teacher not found');
    } catch (error) {
      console.error('Error updating teacher:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const teachers = getData('teachers');
      const filteredTeachers = teachers.filter(t => t.id !== id);
      setData('teachers', filteredTeachers);
      return { data: {} };
    } catch (error) {
      console.error('Error deleting teacher:', error);
      throw error;
    }
  }
};

// Schedule operations
export const scheduleFirebaseAPI = {
  getAll: async () => {
    try {
      const schedules = getData('schedules');
      return { data: schedules };
    } catch (error) {
      console.error('Error getting schedules:', error);
      throw error;
    }
  },

  create: async (schedule) => {
    try {
      const schedules = getData('schedules');
      const newSchedule = { id: generateId(), ...schedule };
      schedules.push(newSchedule);
      setData('schedules', schedules);
      return { data: newSchedule };
    } catch (error) {
      console.error('Error adding schedule:', error);
      throw error;
    }
  },

  update: async (id, schedule) => {
    try {
      const schedules = getData('schedules');
      const index = schedules.findIndex(s => s.id === id);
      if (index !== -1) {
        schedules[index] = { ...schedules[index], ...schedule };
        setData('schedules', schedules);
        return { data: schedules[index] };
      }
      throw new Error('Schedule not found');
    } catch (error) {
      console.error('Error updating schedule:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const schedules = getData('schedules');
      const filteredSchedules = schedules.filter(s => s.id !== id);
      setData('schedules', filteredSchedules);
      return { data: {} };
    } catch (error) {
      console.error('Error deleting schedule:', error);
      throw error;
    }
  },

  generate: async (requests) => {
    try {
      // Enhanced conflict-free scheduling logic
      const classrooms = await classroomFirebaseAPI.getAll();
      const teachers = await teacherFirebaseAPI.getAll();
      const existingSchedules = await scheduleFirebaseAPI.getAll();
      
      const generatedSchedules = [];
      const failedRequests = [];
      
      // Helper function to check if time ranges overlap
      const timeOverlaps = (start1, end1, start2, end2) => {
        const start1Time = new Date(`2000-01-01 ${start1}`);
        const end1Time = new Date(`2000-01-01 ${end1}`);
        const start2Time = new Date(`2000-01-01 ${start2}`);
        const end2Time = new Date(`2000-01-01 ${end2}`);
        
        return start1Time < end2Time && start2Time < end1Time;
      };
      
      // Helper function to check if teacher is available during requested time
      const isTeacherAvailable = (teacher, requestDay, requestStartTime, requestEndTime) => {
        // Check if teacher works on this day
        if (!teacher.availableDays?.includes(requestDay)) {
          return false;
        }
        
        // Check if requested time falls within teacher's availability window
        const teacherStartTime = teacher.availableStartTime;
        const teacherEndTime = teacher.availableEndTime;
        
        return teacherStartTime <= requestStartTime && teacherEndTime >= requestEndTime;
      };
      
      // Helper function to check for conflicts
      const hasConflicts = (teacherId, classroomId, requestDate, requestStartTime, requestEndTime, requestDay) => {
        return existingSchedules.data.some(schedule => {
          // Check if it's the same day
          if (schedule.dayOfWeek !== requestDay) return false;
          
          // Check teacher conflicts
          if (schedule.teacher?.id === teacherId) {
            if (timeOverlaps(schedule.startTime, schedule.endTime, requestStartTime, requestEndTime)) {
              return true;
            }
          }
          
          // Check classroom conflicts
          if (schedule.classroom?.id === classroomId) {
            if (timeOverlaps(schedule.startTime, schedule.endTime, requestStartTime, requestEndTime)) {
              return true;
            }
          }
          
          return false;
        });
      };
      
      // Process each scheduling request
      for (const request of requests) {
        let scheduled = false;
        
        // Find teachers who can teach this subject
        const eligibleTeachers = teachers.data.filter(teacher => 
          teacher.subject === request.subject &&
          isTeacherAvailable(teacher, request.dayOfWeek, request.startTime, request.endTime)
        );
        
        // Find classrooms that meet the requirements
        const eligibleClassrooms = classrooms.data.filter(classroom => 
          classroom.roomType === request.roomType && 
          classroom.capacity >= request.requiredCapacity
        );
        
        // Try to find a conflict-free combination
        for (const teacher of eligibleTeachers) {
          if (scheduled) break;
          
          for (const classroom of eligibleClassrooms) {
            // Check for conflicts
            const hasConflict = hasConflicts(
              teacher.id, 
              classroom.id, 
              request.date, 
              request.startTime, 
              request.endTime, 
              request.dayOfWeek
            );
            
            if (!hasConflict) {
              // Create the schedule
              const schedule = {
                date: request.date,
                startTime: request.startTime,
                endTime: request.endTime,
                dayOfWeek: request.dayOfWeek,
                teacher: teacher,
                classroom: classroom,
                subject: request.subject,
                notes: request.notes,
                isRecurring: request.isRecurring,
                status: 'scheduled'
              };
              
              const result = await scheduleFirebaseAPI.create(schedule);
              generatedSchedules.push(result.data);
              scheduled = true;
              break;
            }
          }
        }
        
        // If no schedule could be created, add to failed requests
        if (!scheduled) {
          failedRequests.push({
            request: request,
            reason: 'No available teacher-classroom combination found without conflicts',
            eligibleTeachers: eligibleTeachers.length,
            eligibleClassrooms: eligibleClassrooms.length
          });
        }
      }
      
      return { 
        data: generatedSchedules,
        failedRequests: failedRequests,
        summary: {
          totalRequests: requests.length,
          successful: generatedSchedules.length,
          failed: failedRequests.length,
          successRate: `${Math.round((generatedSchedules.length / requests.length) * 100)}%`
        }
      };
    } catch (error) {
      console.error('Error generating schedules:', error);
      throw error;
    }
  }
};