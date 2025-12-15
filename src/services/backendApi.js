// Backend API service for integration with Spring Boot backend
const BACKEND_BASE_URL = 'http://localhost:8080/api';

class BackendApiService {
  constructor() {
    this.baseURL = BACKEND_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add abort signal if provided
    if (options.signal) {
      config.signal = options.signal;
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      // Don't treat abort errors as failures
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
        return { success: false, error: 'Request cancelled', aborted: true };
      }
      console.error('API request failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Schedule API
  async getAllSchedules() {
    return this.request('/schedules');
  }

  async getScheduleById(id) {
    return this.request(`/schedules/${id}`);
  }

  async createSchedule(schedule) {
    return this.request('/schedules', {
      method: 'POST',
      body: JSON.stringify(schedule),
    });
  }

  async updateSchedule(id, schedule) {
    return this.request(`/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(schedule),
    });
  }

  async deleteSchedule(id, signal = null) {
    return this.request(`/schedules/${id}`, {
      method: 'DELETE',
      signal: signal,
    });
  }

  async generateOptimizedSchedule(signal = null) {
    return this.request('/schedules/generate-optimized', {
      method: 'POST',
      signal: signal,
    });
  }

  async getScheduleStatistics(startDate, endDate) {
    const params = new URLSearchParams({
      startDate: startDate,
      endDate: endDate,
    });
    return this.request(`/schedules/statistics?${params}`);
  }

  // Teacher API
  async getAllTeachers() {
    return this.request('/teachers');
  }

  async getTeacherById(id) {
    return this.request(`/teachers/${id}`);
  }

  async createTeacher(teacher) {
    return this.request('/teachers', {
      method: 'POST',
      body: JSON.stringify(teacher),
    });
  }

  async updateTeacher(id, teacher) {
    return this.request(`/teachers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(teacher),
    });
  }

  async deleteTeacher(id) {
    return this.request(`/teachers/${id}`, {
      method: 'DELETE',
    });
  }

  // Classroom API
  async getAllClassrooms() {
    return this.request('/classrooms');
  }

  async getClassroomById(id) {
    return this.request(`/classrooms/${id}`);
  }

  async createClassroom(classroom) {
    return this.request('/classrooms', {
      method: 'POST',
      body: JSON.stringify(classroom),
    });
  }

  async updateClassroom(id, classroom) {
    return this.request(`/classrooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(classroom),
    });
  }

  async deleteClassroom(id) {
    return this.request(`/classrooms/${id}`, {
      method: 'DELETE',
    });
  }

  // Section API
  async getAllSections() {
    return this.request('/sections');
  }

  async getSectionById(id) {
    return this.request(`/sections/${id}`);
  }

  async createSection(section) {
    return this.request('/sections', {
      method: 'POST',
      body: JSON.stringify(section),
    });
  }

  async updateSection(id, section) {
    return this.request(`/sections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(section),
    });
  }

  async deleteSection(id) {
    return this.request(`/sections/${id}`, {
      method: 'DELETE',
    });
  }

  // Subject API
  async getAllSubjects() {
    return this.request('/subjects');
  }

  async getSubjectById(id) {
    return this.request(`/subjects/${id}`);
  }

  async createSubject(subject) {
    return this.request('/subjects', {
      method: 'POST',
      body: JSON.stringify(subject),
    });
  }

  async updateSubject(id, subject) {
    return this.request(`/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(subject),
    });
  }

  async deleteSubject(id) {
    return this.request(`/subjects/${id}`, {
      method: 'DELETE',
    });
  }
}

// Create and export singleton instance
const backendApi = new BackendApiService();
export default backendApi;

// Export individual API methods for convenience
export const scheduleApi = {
  getAll: () => backendApi.getAllSchedules(),
  getById: (id) => backendApi.getScheduleById(id),
  create: (schedule) => backendApi.createSchedule(schedule),
  update: (id, schedule) => backendApi.updateSchedule(id, schedule),
  delete: (id, signal) => backendApi.deleteSchedule(id, signal),
  generateOptimized: (signal) => backendApi.generateOptimizedSchedule(signal),
  getStatistics: (startDate, endDate) => backendApi.getScheduleStatistics(startDate, endDate),
};

export const teacherApi = {
  getAll: () => backendApi.getAllTeachers(),
  getById: (id) => backendApi.getTeacherById(id),
  create: (teacher) => backendApi.createTeacher(teacher),
  update: (id, teacher) => backendApi.updateTeacher(id, teacher),
  delete: (id) => backendApi.deleteTeacher(id),
};

export const classroomApi = {
  getAll: () => backendApi.getAllClassrooms(),
  getById: (id) => backendApi.getClassroomById(id),
  create: (classroom) => backendApi.createClassroom(classroom),
  update: (id, classroom) => backendApi.updateClassroom(id, classroom),
  delete: (id) => backendApi.deleteClassroom(id),
};

export const sectionApi = {
  getAll: () => backendApi.getAllSections(),
  getById: (id) => backendApi.getSectionById(id),
  create: (section) => backendApi.createSection(section),
  update: (id, section) => backendApi.updateSection(id, section),
  delete: (id) => backendApi.deleteSection(id),
};

export const subjectApi = {
  getAll: () => backendApi.getAllSubjects(),
  getById: (id) => backendApi.getSubjectById(id),
  create: (subject) => backendApi.createSubject(subject),
  update: (id, subject) => backendApi.updateSubject(id, subject),
  delete: (id) => backendApi.deleteSubject(id),
};

