import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, teacherRequestAPI, userAPI } from '../src/api';

export type UserRole = 'student' | 'teacher' | 'admin';

export type TeacherRequestStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  profilePhoto?: string | null;
  teacherRequestStatus?: TeacherRequestStatus;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  requestTeacherRole: (reason: string, department: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  updateProfilePhoto: (photo: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await authAPI.getMe();
          setUser(response.data.user);
        } catch (error) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authAPI.login({ email, password });
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      console.error('Login error:', errorMessage);
      alert(`Login failed: ${errorMessage}\n\nPlease ensure:\n1. Backend server is running on port 5000\n2. MongoDB is running\n3. Credentials are correct`);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await authAPI.register({ name, email, password });
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      console.error('Registration error:', errorMessage);
      alert(`Registration failed: ${errorMessage}\n\nPlease ensure:\n1. Backend server is running on port 5000\n2. MongoDB is running`);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const requestTeacherRole = async (reason: string, department: string): Promise<boolean> => {
    if (user && user.role === 'student' && reason && department) {
      try {
        await teacherRequestAPI.submit({ department, reason });
        // Update local state with pending status
        setUser({
          ...user,
          department,
          teacherRequestStatus: 'pending',
        });
        // Also update localStorage
        const updatedUser = {
          ...user,
          department,
          teacherRequestStatus: 'pending',
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return true;
      } catch (error: any) {
        console.error('Teacher request error:', error.response?.data?.message || error.message);
        return false;
      }
    }
    return false;
  };

  // Function to refresh user data from backend
  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await authAPI.getMe();
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      } catch (error) {
        console.error('Failed to refresh user:', error);
      }
    }
  };

  // Function to update profile photo
  const updateProfilePhoto = async (photo: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const response = await userAPI.uploadPhoto(user.id, photo);
      if (response.data.success) {
        const updatedUser = { ...user, profilePhoto: photo };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Failed to update profile photo:', error.response?.data?.message || error.message);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        requestTeacherRole,
        refreshUser,
        updateProfilePhoto,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
