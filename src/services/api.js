// Import Firestore-based services
import { classroomFirestoreAPI, teacherFirestoreAPI, scheduleFirestoreAPI } from '../firebase/firestoreService';

// Use Firestore APIs
export const classroomAPI = classroomFirestoreAPI;
export const teacherAPI = teacherFirestoreAPI;
export const scheduleAPI = scheduleFirestoreAPI;

// For backward compatibility, export as default
const apiServices = {
  classroomAPI,
  teacherAPI,
  scheduleAPI
};

export default apiServices;
