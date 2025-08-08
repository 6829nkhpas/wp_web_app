import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI, setAuthToken, clearAuth } from '../services/api.js';
import socketService from '../services/socket.js';
import toast from 'react-hot-toast';

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('whatsapp_token'),
  isAuthenticated: false,
  loading: true,
  error: null,
};

// Action types
const AUTH_ACTIONS = {
  AUTH_START: 'AUTH_START',
  AUTH_SUCCESS: 'AUTH_SUCCESS',
  AUTH_FAILURE: 'AUTH_FAILURE',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_LOADING: 'SET_LOADING',
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.AUTH_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case AUTH_ACTIONS.AUTH_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null,
      };

    case AUTH_ACTIONS.AUTH_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        loading: false,
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('whatsapp_token');
      const savedUser = localStorage.getItem('whatsapp_user');

      if (token && savedUser) {
        try {
          setAuthToken(token);
          const user = JSON.parse(savedUser);

          dispatch({
            type: AUTH_ACTIONS.AUTH_SUCCESS,
            payload: { user, token },
          });

          // Verify token is still valid
          const profileResponse = await authAPI.getProfile();
          if (profileResponse.success) {
            dispatch({
              type: AUTH_ACTIONS.UPDATE_USER,
              payload: profileResponse.user,
            });

            // Connect to socket
            socketService.connect();
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          logout();
        }
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.AUTH_START });

      const response = await authAPI.register(userData);

      if (response.success) {
        const { user, token } = response;

        // Store in localStorage
        localStorage.setItem('whatsapp_token', token);
        localStorage.setItem('whatsapp_user', JSON.stringify(user));

        // Set auth token for API calls
        setAuthToken(token);

        dispatch({
          type: AUTH_ACTIONS.AUTH_SUCCESS,
          payload: { user, token },
        });

        // Connect to socket
        socketService.connect();

        toast.success('Registration successful! Welcome to WhatsApp Web Clone! 🎉');
        return response;
      }
    } catch (error) {
      const errorMessage = error.message || 'Registration failed';
      dispatch({
        type: AUTH_ACTIONS.AUTH_FAILURE,
        payload: errorMessage,
      });
      toast.error(errorMessage);
      throw error;
    }
  };

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.AUTH_START });

      const response = await authAPI.login(credentials);

      if (response.success) {
        const { user, token } = response;

        // Store in localStorage
        localStorage.setItem('whatsapp_token', token);
        localStorage.setItem('whatsapp_user', JSON.stringify(user));

        // Set auth token for API calls
        setAuthToken(token);

        dispatch({
          type: AUTH_ACTIONS.AUTH_SUCCESS,
          payload: { user, token },
        });

        // Connect to socket
        socketService.connect();

        toast.success(`Welcome back, ${user.name}! 👋`);
        return response;
      }
    } catch (error) {
      const errorMessage = error.message || 'Login failed';
      dispatch({
        type: AUTH_ACTIONS.AUTH_FAILURE,
        payload: errorMessage,
      });
      toast.error(errorMessage);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call logout API if user is authenticated
      if (state.isAuthenticated) {
        await authAPI.logout();
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local storage and state regardless of API call result
      clearAuth();

      // Disconnect socket
      socketService.disconnect();

      dispatch({ type: AUTH_ACTIONS.LOGOUT });

      toast.success('Logged out successfully');
    }
  };

  // Update user profile
  const updateProfile = async (updates) => {
    try {
      const response = await authAPI.updateProfile(updates);

      if (response.success) {
        const updatedUser = response.user;

        // Update localStorage
        localStorage.setItem('whatsapp_user', JSON.stringify(updatedUser));

        dispatch({
          type: AUTH_ACTIONS.UPDATE_USER,
          payload: updatedUser,
        });

        toast.success('Profile updated successfully!');
        return response;
      }
    } catch (error) {
      const errorMessage = error.message || 'Profile update failed';
      toast.error(errorMessage);
      throw error;
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Force refresh user data
  const refreshUser = async () => {
    try {
      if (state.isAuthenticated) {
        const response = await authAPI.getProfile();
        if (response.success) {
          dispatch({
            type: AUTH_ACTIONS.UPDATE_USER,
            payload: response.user,
          });
          localStorage.setItem('whatsapp_user', JSON.stringify(response.user));
        }
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  // Socket connection management
  const connectSocket = () => {
    if (state.isAuthenticated && !socketService.isConnected()) {
      socketService.connect();
    }
  };

  const disconnectSocket = () => {
    socketService.disconnect();
  };

  // Context value
  const value = {
    // State
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,

    // Actions
    register,
    login,
    logout,
    updateProfile,
    clearError,
    refreshUser,
    connectSocket,
    disconnectSocket,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
