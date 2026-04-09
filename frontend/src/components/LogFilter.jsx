import { useState } from 'react';

export default function LogFilter({ filters, onFiltersChange }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleStatusChange = (value) => {
    onFiltersChange({ ...filters, statusCode: value });
  };

  const handleMethodChange = (method) => {
    const methods = filters.method ? filters.method.split(',') : [];
    const index = methods.indexOf(method);
    
    if (index > -1) {
      methods.splice(index, 1);
    } else {
      methods.push(method);
    }
    
    onFiltersChange({ ...filters, method: methods.join(',') });
  };

  const handlePathChange = (value) => {
    onFiltersChange({ ...filters, path: value });
  };

  const handleBlockedOnlyChange = (value) => {
    onFiltersChange({ ...filters, blockedOnly: value });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      statusCode: '',
      method: '',
      path: '',
      blockedOnly: false,
    });
  };

  const isFiltered = filters.statusCode || filters.method || filters.path || filters.blockedOnly;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div
        className="px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">🔍</span>
          <h3 className="font-semibold">
            Advanced Log Filters
            {isFiltered && (
              <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                Active
              </span>
            )}
          </h3>
        </div>
        <button className="text-gray-500 dark:text-gray-400">
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {/* Filters Content */}
      {isExpanded && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Code Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Status Code
              </label>
              <select
                value={filters.statusCode}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status Codes</option>
                <option value="2xx">2xx (Success)</option>
                <option value="3xx">3xx (Redirect)</option>
                <option value="4xx">4xx (Client Error)</option>
                <option value="5xx">5xx (Server Error)</option>
              </select>
            </div>

            {/* HTTP Method Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                HTTP Methods
              </label>
              <div className="flex gap-2 flex-wrap">
                {['GET', 'POST', 'PATCH', 'DELETE'].map((method) => (
                  <button
                    key={method}
                    onClick={() => handleMethodChange(method)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      filters.method?.includes(method)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Path Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Path Contains
              </label>
              <input
                type="text"
                value={filters.path}
                onChange={(e) => handlePathChange(e.target.value)}
                placeholder="/api/users"
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Blocked Only Filter */}
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={filters.blockedOnly}
                  onChange={(e) => handleBlockedOnlyChange(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-700"
                />
                <span className="text-gray-700 dark:text-gray-300">Blocked only</span>
              </label>
            </div>
          </div>

          {/* Clear Button */}
          {isFiltered && (
            <div className="flex justify-end">
              <button
                onClick={handleClearFilters}
                className="text-sm px-3 py-1 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
              >
                ✕ Clear Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Filter Summary Badge */}
      {isFiltered && !isExpanded && (
        <div className="px-6 py-2 bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-700 dark:text-blue-300">
          Filtering applied • Click to expand
        </div>
      )}
    </div>
  );
}
