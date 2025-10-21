import React, { createContext, useContext, useState, useEffect } from 'react';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      console.log('🔐 Attempting login for:', email);
      
      // Always try database authentication first
      const { userAPI } = await import('../services/userService');
      const loginResult = await userAPI.login(email, password);
      
      if (loginResult.success) {
        console.log('✅ Login successful:', loginResult.user.role);
        setUser(loginResult.user);
        localStorage.setItem('user', JSON.stringify(loginResult.user));
        return loginResult;
      }
      
      console.log('❌ Login failed');
      // If database login fails, return the error
      return loginResult;
    } catch (error) {
      console.error('💥 Login error:', error);
      return { success: false, message: 'Login failed. Please try again.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      if (!user) {
        return { success: false, message: 'No user logged in' };
      }

      const { userAPI } = await import('../services/userService');
      const result = await userAPI.changePassword(user.id, currentPassword, newPassword);
      
      if (result.success) {
        // Update user to reflect password change
        const updatedUser = { ...user, isDefaultPassword: false };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      return result;
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, message: 'Failed to change password' };
    }
  };

  const isAdmin = () => user?.role === 'admin';
  const isTeacher = () => user?.role === 'teacher';
  const isDefaultPassword = () => user?.isDefaultPassword === true;

  const value = {
    user,
    login,
    logout,
    changePassword,
    isAdmin,
    isTeacher,
    isDefaultPassword,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
