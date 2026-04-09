import { createContext, useContext, useState } from 'react';

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
  const [isLoading] = useState(false);

  const login = (username, password) => {
    // Mock authentication - replace with real API call later
    if (username.trim() && password.trim()) {
      const userData = {
        id: '1',
        username,
        email: `${username}@gateway.local`,
      };
      
      const token = `token_${Date.now()}`;
      localStorage.setItem('gateway-token', token);
      localStorage.setItem('gateway-user', JSON.stringify(userData));
      
      setUser(userData);
      setIsAuthenticated(true);
      return true;
    }
    return false;
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
