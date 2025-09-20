'use client';
/* eslint-disable @typescript-eslint/no-misused-promises */

import { useState, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';

interface CustomerSession {
  id: number;
  phoneNumber: string;
  name?: string | null;
  gender?: string | null;
  dob?: number | null; 
  anniversary?: number | null; 
  isSetupComplete: boolean;
}

interface BusinessSession {
  id: number;
  phoneNumber: string;
  name: string;
  address?: string | null;
  businessType?: string | null;
  contactNumber?: string | null;
  contactNumber2?: string | null;
}

type UserSession = CustomerSession | BusinessSession | null;
type UserRole = 'user' | 'business' | null;

interface AuthContextType {
  user: UserSession;
  role: UserRole;
  loading: boolean;
  login: (userData: { user: UserSession; role: UserRole }) => void;
  logout: () => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserSession>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json() as { user?: UserSession; role?: UserRole };
      if (response.ok && data.user) {
        if (data.role === 'user' && data.user && 'dob' in data.user && data.user.dob) {
          (data.user).dob = new Date(data.user.dob).getTime();
        }
        if (data.role === 'user' && data.user && 'anniversary' in data.user && data.user.anniversary) {
          (data.user).anniversary = new Date(data.user.anniversary).getTime();
        }
        setUser(data.user);
        setRole(data.role ?? null);
      } else {
        setUser(null);
        setRole(null);
      }
    } catch (error) {
      console.error('Failed to fetch session:', error);
      setUser(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initSession = () => {
      void fetchSession();
    };
    initSession();
  }, []);

  const login = (userData: { user: UserSession; role: UserRole }) => {
    setUser(userData.user);
    setRole(userData.role);
  };

  const logout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      setUser(null);
      setRole(null);
    } catch (error) {
      console.error('Error during logout API call:', error);
      setUser(null);
      setRole(null);
    }
  };

  const refreshSession = async () => {
    await fetchSession();
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthSession = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthSession must be used within an AuthProvider');
  }
  return context;
};