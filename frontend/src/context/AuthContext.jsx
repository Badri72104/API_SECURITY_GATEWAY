import { createContext, useContext, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext();

function getStoredSession() {
  const savedToken = localStorage.getItem('gateway-token');
  const savedUser = localStorage.getItem('gateway-user');

  if (!savedToken || !savedUser) {
    return { user: null, isAuthenticated: false };
  }

  try {
    return {
      user: JSON.parse(savedUser),
      isAuthenticated: true,
    };
  } catch {
    localStorage.removeItem('gateway-token');
    localStorage.removeItem('gateway-user');
    return { user: null, isAuthenticated: false };
  }
}

export function AuthProvider({ children }) {
  const [initialSession] = useState(getStoredSession);
  const [user, setUser] = useState(initialSession.user);
  const [isAuthenticated, setIsAuthenticated] = useState(initialSession.isAuthenticated);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (username, password) => {
    setIsLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', { username, password });
      localStorage.setItem('gateway-token', data.token);
      localStorage.setItem('gateway-user', JSON.stringify(data.user));

      setUser(data.user);
      setIsAuthenticated(true);
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('gateway-token');
    localStorage.removeItem('gateway-user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = { user, isAuthenticated, isLoading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/* eslint-disable-next-line react-refresh/only-export-components */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
