import axios from 'axios';

// Set default base URL with fallback
const API_ROOT_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
console.log('API Base URL:', API_ROOT_URL);
const API_BASE_URL = `${API_ROOT_URL}/api`;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Important for cookies/sessions
  timeout: 15000, // 15 second timeout
});

// Request interceptor for logging and adding auth token
api.interceptors.request.use(
  (config) => {
    // Log the request
    console.log(`[API] ${config.method?.toUpperCase() || 'REQUEST'} ${config.url}`, {
      data: config.data,
      params: config.params,
      headers: config.headers,
    });

    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling responses and errors
api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response ${response.status} ${response.config.url}`, {
      data: response.data,
      headers: response.headers,
    });
    return response;
  },
  (error) => {
    // Log the error
    const errorData = {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
    };
    
    console.error('[API] Response error:', errorData);

    // Handle specific error statuses
    if (error.response) {
      // Server responded with a status code outside 2xx
      const { status } = error.response;
      
      if (status === 401) {
        // Unauthorized - token expired or invalid
        console.log('[API] Unauthorized - redirecting to login');
        localStorage.removeItem('token');
        // Only redirect if not already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } else if (status === 403) {
        // Forbidden - user doesn't have permission
        console.error('[API] Forbidden - insufficient permissions');
      } else if (status === 404) {
        // Not found
        console.error('[API] Resource not found');
      } else if (status >= 500) {
        // Server error
        console.error('[API] Server error');
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('[API] No response from server - is the backend running?');
      error.message = 'Unable to connect to the server. Please check your connection.';
    }

    // Return a consistent error object
    return Promise.reject({
      message: error.message,
      status: error.response?.status,
      data: error.response?.data || { message: error.message },
      isAxiosError: true,
    });
  }
);

// Helper function to make API calls with better error handling
export const apiRequest = async (method, url, data = null, config = {}) => {
  try {
    const response = await api({
      method,
      url,
      data,
      ...config,
    });
    return { data: response.data, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        message: error.response?.data?.message || error.message,
        status: error.response?.status,
        data: error.response?.data,
      },
    };
  }
};

export default api;
