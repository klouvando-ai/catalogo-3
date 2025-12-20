
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  login: (username: string, pass: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('kavins_user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const userData = await api.auth.login({ username, password });
      setUser(userData);
      localStorage.setItem('kavins_user', JSON.stringify(userData));
      return true;
    } catch (e) {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('kavins_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth error');
  return context;
};
