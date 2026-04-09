import { useRef, useEffect, useMemo } from 'react';
import { useGateway } from '../context/GatewayProvider';

const STATUS_COLORS = {
  2: 'text-green-400',
  3: 'text-blue-400',
  4: 'text-amber-400',
  5: 'text-red-400',
};

const BLOCK_COLORS = {
  IP_NOT_WHITELISTED:   'bg-purple-950/40',
  RATE_LIMIT_EXCEEDED:  'bg-amber-950/40',
};

export default function LiveLogViewer({ filters = {} }) {
  const { logs, dispatch } = useGateway();
  const bottomRef = useRef(null);

  // Filter logs based on current filters
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Status code filter
      if (filters.statusCode) {
        const statusClass = Math.floor(log.statusCode / 100);
        if (filters.statusCode === '2xx' && statusClass !== 2) return false;
        if (filters.statusCode === '3xx' && statusClass !== 3) return false;
        if (filters.statusCode === '4xx' && statusClass !== 4) return false;
        if (filters.statusCode === '5xx' && statusClass !== 5) return false;
      }

      // HTTP method filter
      if (filters.method) {
        const methods = filters.method.split(',');
        if (!methods.includes(log.method)) return false;
      }

      // Path filter (case-insensitive contains)
      if (filters.path) {
        if (!log.path.toLowerCase().includes(filters.path.toLowerCase())) return false;
      }

      // Blocked only filter
      if (filters.blockedOnly && !log.blocked) return false;

      return true;
    });
  }, [logs, filters]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredLogs]);

  return (
    <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 h-96 overflow-y-auto font-mono text-xs">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
          <span className="text-gray-400 text-sm font-sans font-medium">
            Live Requests
          </span>
          <span className="text-gray-600 text-xs font-sans">
            ({filteredLogs.length} of {logs.length} entries)
          </span>
        </div>
        <button
          onClick={() => dispatch({ type: 'CLEAR_LOGS' })}
          className="text-gray-500 hover:text-white text-xs font-sans
            border border-gray-700 rounded px-2 py-1"
        >
          Clear
        </button>
      </div>

      {filteredLogs.length === 0 && logs.length === 0 && (
        <div className="flex items-center justify-center h-64 text-gray-600 font-sans">
          Waiting for requests...
        </div>
      )}

      {filteredLogs.length === 0 && logs.length > 0 && (
        <div className="flex items-center justify-center h-64 text-gray-600 font-sans">
          No logs match the current filters
        </div>
      )}

      {filteredLogs.map((log, i) => {
        const colorClass = STATUS_COLORS[Math.floor(log.statusCode / 100)]
          || 'text-gray-400';
        const rowBg = log.blockReason
          ? (BLOCK_COLORS[log.blockReason] || 'bg-red-950/30')
          : '';
        return (
          <div
            key={i}
            className={`flex gap-3 py-1 border-b border-gray-900 ${rowBg}`}
          >
            <span className="text-gray-600 w-24 shrink-0">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            <span className="text-blue-400 w-12 shrink-0">
              {log.method}
            </span>
            <span className="text-gray-300 flex-1 truncate">
              {log.path}
            </span>
            <span className={`${colorClass} w-10 shrink-0 text-right`}>
              {log.statusCode}
            </span>
            <span className="text-gray-500 w-16 shrink-0 text-right">
              {log.latencyMs}ms
            </span>
            {log.blockReason && (
              <span className="text-red-400 shrink-0 truncate max-w-32">
                {log.blockReason}
              </span>
            )}
          </div>
        );
      })}
      <div ref={bottomRef}/>
    </div>
  );
}