import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import firebaseConfig from './config';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper function to generate ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Classroom operations
export const classroomFirestoreAPI = {
  getAll: async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'classrooms'));
      const classrooms = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { data: classrooms };
    } catch (error) {
      console.error('Error getting classrooms from Firestore:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const querySnapshot = await getDocs(collection(db, 'classrooms'));
      const classroom = querySnapshot.docs.find(doc => doc.id === id);
      return { data: classroom ? { id: classroom.id, ...classroom.data() } : null };
    } catch (error) {
      console.error('Error getting classroom by id from Firestore:', error);
      throw error;
    }
  },

  create: async (classroom) => {
    try {
      const docRef = await addDoc(collection(db, 'classrooms'), classroom);
      return { data: { id: docRef.id, ...classroom } };
    } catch (error) {
      console.error('Error creating classroom in Firestore:', error);
      throw error;
    }
  },

  update: async (id, updatedClassroom) => {
    try {
      const classroomRef = doc(db, 'classrooms', id);
      await updateDoc(classroomRef, updatedClassroom);
      return { data: { id, ...updatedClassroom } };
    } catch (error) {
      console.error('Error updating classroom in Firestore:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const classroomRef = doc(db, 'classrooms', id);
      await deleteDoc(classroomRef);
      return { data: { id } };
    } catch (error) {
      console.error('Error deleting classroom from Firestore:', error);
      throw error;
    }
  }
};

// Teacher operations
export const teacherFirestoreAPI = {
  getAll: async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'teachers'));
      const teachers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { data: teachers };
    } catch (error) {
      console.error('Error getting teachers from Firestore:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const querySnapshot = await getDocs(collection(db, 'teachers'));
      const teacher = querySnapshot.docs.find(doc => doc.id === id);
      return { data: teacher ? { id: teacher.id, ...teacher.data() } : null };
    } catch (error) {
      console.error('Error getting teacher by id from Firestore:', error);
      throw error;
    }
  },

  create: async (teacher) => {
    try {
      const docRef = await addDoc(collection(db, 'teachers'), teacher);
      return { data: { id: docRef.id, ...teacher } };
    } catch (error) {
      console.error('Error creating teacher in Firestore:', error);
      throw error;
    }
  },

  update: async (id, updatedTeacher) => {
    try {
      const teacherRef = doc(db, 'teachers', id);
      await updateDoc(teacherRef, updatedTeacher);
      return { data: { id, ...updatedTeacher } };
    } catch (error) {
      console.error('Error updating teacher in Firestore:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const teacherRef = doc(db, 'teachers', id);
      await deleteDoc(teacherRef);
      return { data: { id } };
    } catch (error) {
      console.error('Error deleting teacher from Firestore:', error);
      throw error;
    }
  }
};

// Schedule operations
export const scheduleFirestoreAPI = {
  getAll: async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'schedules'));
      const schedules = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { data: schedules };
    } catch (error) {
      console.error('Error getting schedules from Firestore:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const querySnapshot = await getDocs(collection(db, 'schedules'));
      const schedule = querySnapshot.docs.find(doc => doc.id === id);
      return { data: schedule ? { id: schedule.id, ...schedule.data() } : null };
    } catch (error) {
      console.error('Error getting schedule by id from Firestore:', error);
      throw error;
    }
  },

  create: async (schedule) => {
    try {
      const docRef = await addDoc(collection(db, 'schedules'), schedule);
      return { data: { id: docRef.id, ...schedule } };
    } catch (error) {
      console.error('Error creating schedule in Firestore:', error);
      throw error;
    }
  },

  update: async (id, updatedSchedule) => {
    try {
      const scheduleRef = doc(db, 'schedules', id);
      await updateDoc(scheduleRef, updatedSchedule);
      return { data: { id, ...updatedSchedule } };
    } catch (error) {
      console.error('Error updating schedule in Firestore:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const scheduleRef = doc(db, 'schedules', id);
      await deleteDoc(scheduleRef);
      return { data: { id } };
    } catch (error) {
      console.error('Error deleting schedule from Firestore:', error);
      throw error;
    }
  },

  generate: async (requests) => {
    try {
      // Enhanced conflict-free scheduling logic
      const classrooms = await classroomFirestoreAPI.getAll();
      const teachers = await teacherFirestoreAPI.getAll();
      const existingSchedules = await scheduleFirestoreAPI.getAll();

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

              const result = await scheduleFirestoreAPI.create(schedule);
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

