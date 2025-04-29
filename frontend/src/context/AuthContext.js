import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api.service';

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Register user
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Sending registration request with data:', userData);
      const response = await api.post('/auth/register', userData);
      console.log('Registration response:', response.data);
      localStorage.setItem('token', response.data.data.token);
      setCurrentUser(response.data.data.user);
      setIsAuthenticated(true);
      return response.data;
    } catch (err) {
      console.error('Registration error:', err);
      console.error('Error response:', err.response);
      // Chi tiết hơn về lỗi
      const errorMessage = err.response?.data?.message || 'Registration failed';
      console.error('Error message:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.data.token);
      setCurrentUser(response.data.data.user);
      setIsAuthenticated(true);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // Check if user is authenticated
  const checkAuthStatus = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    if (!token) {
      setIsAuthenticated(false);
      setCurrentUser(null);
      setLoading(false);
      return;
    }
    
    try {
      const response = await api.get('/auth/check');
      if (response.data.success) {
        setCurrentUser(response.data.data.user);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('token');
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      localStorage.removeItem('token');
      setCurrentUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update user profile
  const updateProfile = async (userData) => {
    setLoading(true);
    try {
      const response = await api.put(`/users/${currentUser.id}`, userData);
      setCurrentUser({...currentUser, ...response.data.data});
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        loading,
        error,
        register,
        login,
        logout,
        checkAuthStatus,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;