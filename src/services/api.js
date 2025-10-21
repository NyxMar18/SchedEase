// Import Firestore-based services
import { classroomFirestoreAPI, teacherFirestoreAPI, scheduleFirestoreAPI } from '../firebase/firestoreService';

// Use Firestore APIs
export const classroomAPI = classroomFirestoreAPI;
export const teacherAPI = teacherFirestoreAPI;
export const scheduleAPI = scheduleFirestoreAPI;

// School Year API (using backend)
const API_BASE_URL = 'http://localhost:8080/api';

export const schoolYearAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/school-years`);
    if (!response.ok) throw new Error('Failed to fetch school years');
    return { data: await response.json() };
  },
  
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/school-years/${id}`);
    if (!response.ok) throw new Error('Failed to fetch school year');
    return { data: await response.json() };
  },
  
  getActive: async () => {
    const response = await fetch(`${API_BASE_URL}/school-years/active`);
    if (!response.ok) throw new Error('Failed to fetch active school year');
    return { data: await response.json() };
  },
  
  create: async (schoolYear) => {
    const response = await fetch(`${API_BASE_URL}/school-years`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schoolYear)
    });
    if (!response.ok) throw new Error('Failed to create school year');
    return { data: await response.json() };
  },
  
  update: async (id, schoolYear) => {
    const response = await fetch(`${API_BASE_URL}/school-years/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schoolYear)
    });
    if (!response.ok) throw new Error('Failed to update school year');
    return { data: await response.json() };
  },
  
  activate: async (id) => {
    const response = await fetch(`${API_BASE_URL}/school-years/${id}/activate`, {
      method: 'PUT'
    });
    if (!response.ok) throw new Error('Failed to activate school year');
    return { data: await response.json() };
  },
  
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/school-years/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete school year');
    return { data: true };
  }
};

// For backward compatibility, export as default
const apiServices = {
  classroomAPI,
  teacherAPI,
  scheduleAPI,
  schoolYearAPI
};

export default apiServices;
