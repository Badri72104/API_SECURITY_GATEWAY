import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useGateway } from '../context/GatewayProvider';
import ExportButtons from './ExportButtons';
import { Toaster } from 'react-hot-toast';

export function MainLayout({ children }) {
  const { logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { alerts, dispatch, isConnected } = useGateway();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', shortcut: 'Alt+D' },
    { label: 'Logs', path: '/logs', shortcut: 'Alt+L' },
    { label: 'API Keys', path: '/keys', shortcut: 'Alt+K' },
    { label: 'Settings', path: '/settings', shortcut: 'Alt+S' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      <Toaster position="top-right" />

      {/* Threshold Alerts Banner */}
      {alerts.length > 0 && alerts.map((alert, i) => (
        <div key={i} className="bg-amber-500 text-white px-4 py-3 flex justify-between items-center">
          <span className="text-sm font-medium">
            Warning: Key "{alert.name}" is at {alert.pct}% usage 
            ({alert.usage}/{alert.limit} requests)
          </span>
          <button
            onClick={() => dispatch({ type: 'CLEAR_ALERTS' })}
            className="text-white text-lg leading-none hover:opacity-80"
          >
            ×
          </button>
        </div>
      ))}

      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-xl font-semibold">API Gateway</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Secure API Management Dashboard
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <div className="flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
                <span className={`inline-block w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>

              <ExportButtons />

              <button
                onClick={toggle}
                className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {theme === 'dark' ? 'Light' : 'Dark'}
              </button>

              <div className="border-l border-gray-300 dark:border-gray-700 pl-4">
                <button
                  onClick={handleLogout}
                  className="text-sm px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-red-600 dark:text-red-400 font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex gap-1 -mb-4">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                title={item.shortcut}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  isActive(item.path)
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 px-6 py-2">
        <div className="max-w-7xl mx-auto text-xs text-gray-500">
          {location.pathname === '/dashboard' && '📊 Dashboard'}
          {location.pathname === '/logs' && '📋 Live Logs'}
          {location.pathname === '/keys' && '🔑 API Keys'}
          {location.pathname === '/settings' && '⚙️ Settings'}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
