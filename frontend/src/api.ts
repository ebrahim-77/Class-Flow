import axios from 'axios';

// Use proxy in development (configured in vite.config.js)
// In production, set VITE_API_URL environment variable
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: false
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle responses and errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Authentication APIs
export const authAPI = {
  register: (data: { name: string; email: string; password: string; department?: string; profilePhoto?: string }) =>
    api.post('/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  
  getMe: () =>
    api.get('/auth/me'),
  
  logout: () =>
    api.post('/auth/logout')
};

// User APIs
export const userAPI = {
  getUser: (id: string) =>
    api.get(`/users/${id}`),
  
  updateUser: (id: string, data: { name?: string; department?: string; profilePhoto?: string }) =>
    api.put(`/users/${id}`, data),
  
  uploadPhoto: (id: string, photo: string) =>
    api.post(`/users/${id}/upload-photo`, { photo })
};

// Teacher Request APIs
export const teacherRequestAPI = {
  submit: (data: { department: string; reason: string }) =>
    api.post('/teacher-requests', data),
  
  getAll: (status?: string) =>
    api.get('/teacher-requests', { params: { status } }),
  
  getMyRequest: () =>
    api.get('/teacher-requests/my-request'),
  
  approve: (id: string) =>
    api.put(`/teacher-requests/${id}/approve`),
  
  reject: (id: string) =>
    api.put(`/teacher-requests/${id}/reject`),
  
  getStats: () =>
    api.get('/teacher-requests/stats')
};

// Room APIs
export const roomAPI = {
  create: (data: any) =>
    api.post('/rooms', data),
  
  getAll: (filters?: { status?: string; building?: string }) =>
    api.get('/rooms', { params: filters }),
  
  getById: (id: string) =>
    api.get(`/rooms/${id}`),
  
  update: (id: string, data: any) =>
    api.put(`/rooms/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/rooms/${id}`),
  
  getAvailable: () =>
    api.get('/rooms/available/list')
};

// Schedule APIs
export const scheduleAPI = {
  create: (data: any) =>
    api.post('/schedules', data),
  
  getAll: (filters?: { day?: string; roomId?: string; teacherId?: string }) =>
    api.get('/schedules', { params: filters }),
  
  getTimetable: (startDate?: string, endDate?: string) =>
    api.get('/schedules/timetable', { params: { startDate, endDate } }),
  
  getMyClasses: () =>
    api.get('/schedules/my-classes'),
  
  getUpcoming: () =>
    api.get('/schedules/upcoming'),
  
  update: (id: string, data: any) =>
    api.put(`/schedules/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/schedules/${id}`),
  
  checkConflict: (data: { roomId: string; date: string; startTime: string; endTime: string; excludeId?: string }) =>
    api.post('/schedules/check-conflict', data)
};

// Booking APIs
export const bookingAPI = {
  create: (data: { roomId: string; date: string; startTime: string; endTime: string; purpose: string }) =>
    api.post('/bookings', data),
  
  getAll: (status?: string) =>
    api.get('/bookings', { params: { status } }),
  
  getMyBookings: () =>
    api.get('/bookings/my-bookings'),
  
  getById: (id: string) =>
    api.get(`/bookings/${id}`),
  
  approve: (id: string) =>
    api.put(`/bookings/${id}/approve`),
  
  reject: (id: string) =>
    api.put(`/bookings/${id}/reject`),
  
  cancel: (id: string) =>
    api.put(`/bookings/${id}/cancel`),
  
  getStats: () =>
    api.get('/bookings/stats/summary'),
  
  checkConflict: (data: { roomId: string; date: string; startTime: string; endTime: string; excludeId?: string }) =>
    api.post('/bookings/check-conflict', data)
};

// Dashboard APIs
export const dashboardAPI = {
  getStats: () =>
    api.get('/dashboard/stats'),
  
  getUpcomingClasses: () =>
    api.get('/dashboard/upcoming-classes')
};

export default api;
