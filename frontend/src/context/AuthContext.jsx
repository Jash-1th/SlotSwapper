import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { apiRequest } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [socket, setSocket] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [loading, setLoading] = useState(true); // Start with loading true
  const [initialLoad, setInitialLoad] = useState(true);

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error fetching user data:', error);
      // If there's an error fetching user data, log the user out
      logout();
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    if (token && initialLoad) {
      fetchUser();
    } else if (!token) {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [token, initialLoad]);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Handle socket connection based on token
  useEffect(() => {
    if (token) {
      // If we have a token, create the socket connection
      console.log("AuthContext: Token found, connecting to socket...");
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const socketUrl = apiUrl.replace(/\/api$/, '');
      
      const newSocket = io(socketUrl, {
        query: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ['websocket']
      });

      // Connection events
      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      // Application events
      newSocket.on('new_swap_request', (data) => {
        console.log('--- AuthContext LISTENER: Received new_swap_request!', data);
        if (data.message) {
          toast.success(data.message);
        }
      });

      newSocket.on('swap_response', (data) => {
        console.log('--- AuthContext LISTENER: Received swap_response!', data);
        if (data.message) {
          toast.success(data.message);
        }
      });

      setSocket(newSocket);

      // Cleanup function
      return () => {
        console.log("AuthContext: Token cleared or component unmounted, disconnecting socket.");
        newSocket.disconnect();
      };
    } else {
      // If there is no token (user logged out), clear the socket
      setSocket(null);
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      setLoading(true);
      console.log('Attempting login with:', { email });
      
      // Use the enhanced apiRequest function
      const { data, error } = await apiRequest('post', '/auth/login', {
        email: email.trim(),
        password: password
      });
      
      if (error) {
        console.error('Login API error:', error);
        const errorMessage = error.data?.message || error.message || 'Login failed. Please check your credentials.';
        toast.error(errorMessage);
        return {
          success: false,
          message: errorMessage,
        };
      }
      
      if (!data || !data.token) {
        const errorMessage = 'Login failed. Invalid server response.';
        console.error(errorMessage, data);
        toast.error(errorMessage);
        return {
          success: false,
          message: errorMessage
        };
      }
      
      const { token: newToken, ...userData } = data;

      // Store token and update state
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);
      
      // Set default auth header
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      // Socket connection is now handled by the dedicated useEffect below

      return { success: true };
    } catch (error) {
      console.error('Unexpected login error:', {
        message: error.message,
        stack: error.stack,
      });
      
      return {
        success: false,
        message: 'An unexpected error occurred during login. Please try again.',
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/register', { 
        name: name.trim(),
        email: email.trim(),
        password 
      });
      
      if (!response.data || !response.data.token) {
        throw new Error('Invalid server response');
      }
      
      const { token: newToken, ...userData } = response.data;

      // Store token and update state
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);
      
      // Set default auth header
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      // Socket connection is now handled by the dedicated useEffect below

      // Show success message
      toast.success('Registration successful! Welcome to SlotSwapper!');
      return { success: true };
      
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.data && error.data.message) {
        toast.error(error.data.message);
      } else {
        toast.error('Registration failed. Please try again.');
      }
      
      return { 
        success: false, 
        message: error.data?.message || 'Registration failed. Please try again.'
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Disconnect socket on logout
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    delete api.defaults.headers.common['Authorization'];
  };

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Connection status
    socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    // Handle new swap request notifications
    socket.on('new_swap_request', (data) => {
      toast.success(data.message, {
        duration: 5000,
        position: 'top-right',
      });
    });

    // Handle swap response notifications
    socket.on('swap_response', (data) => {
      toast.info(data.message, {
        duration: 5000,
        position: 'top-right',
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      toast.error('Connection error. Please refresh the page.');
    });

    // Clean up listeners on unmount or when socket changes
    return () => {
      socket.off('connect');
      socket.off('new_swap_request');
      socket.off('swap_response');
      socket.off('error');
      socket.disconnect();
    };
  }, [socket]);

  const value = {
    user,
    isAuthenticated,
    loading,
    socket,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
