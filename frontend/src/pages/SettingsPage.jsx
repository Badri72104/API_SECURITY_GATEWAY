import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export function SettingsPage() {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Username
            </label>
            <input
              type="text"
              value={user?.username || ''}
              disabled
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Theme Settings Section */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Theme</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Current: <span className="capitalize font-mono">{theme}</span>
            </p>
          </div>
          <button
            onClick={toggle}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Toggle Theme
          </button>
        </div>
      </div>

      {/* Gateway Configuration */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Gateway Configuration</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Server URL
            </label>
            <input
              type="text"
              value="http://localhost:4000"
              disabled
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-mono text-sm"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Can be configured via environment variables during deployment
            </p>
          </div>
        </div>
      </div>

      {/* Alert Thresholds */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Alert Configuration</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Usage Alert Threshold
            </label>
            <input
              type="range"
              min="50"
              max="100"
              step="5"
              defaultValue="90"
              className="w-full"
              disabled
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Alerts trigger at 90% API key usage (currently hardcoded in backend)
            </p>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">About</h2>
        <p className="text-sm text-blue-800 dark:text-blue-300">
          API Gateway v1.0 • Enhanced Dashboard
        </p>
        <p className="text-xs text-blue-700 dark:text-blue-400 mt-2">
          Backend: Node.js + Express | Frontend: React + Tailwind CSS
        </p>
      </div>
    </div>
  );
}
