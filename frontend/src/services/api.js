import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      console.warn('Rate limit exceeded:', error.response.data.message);
    }
    return Promise.reject(error);
  }
);

export const userService = {
  // Get users with pagination, filtering, and sorting
  getUsers: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  // Get single user by ID
  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Create new user
  createUser: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  // Update user
  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  // Delete user
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // Get cache stats
  getCacheStats: async () => {
    const response = await api.get('/users/cache/stats');
    return response.data;
  },

  // Clear cache
  clearCache: async () => {
    const response = await api.delete('/users/cache/clear');
    return response.data;
  },

  // Seed database
  seedDatabase: async () => {
    const response = await api.post('/users/seed');
    return response.data;
  }
};

export default api;