import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { GatewayProvider } from './context/GatewayProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './components/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { LogsPage } from './pages/LogsPage';
import { ApiKeysPage } from './pages/ApiKeysPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <GatewayProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <DashboardPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/logs"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <LogsPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/keys"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ApiKeysPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <SettingsPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              {/* Default Routes */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </GatewayProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}