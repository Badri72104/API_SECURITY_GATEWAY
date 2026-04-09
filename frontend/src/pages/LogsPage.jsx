import { useState } from 'react';
import LiveLogViewer from '../components/LiveLogViewer';
import LogFilter from '../components/LogFilter';

export function LogsPage() {
  const [filters, setFilters] = useState({
    statusCode: '',
    method: '',
    path: '',
    blockedOnly: false,
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <LogFilter filters={filters} onFiltersChange={setFilters} />

      {/* Live Log Viewer */}
      <LiveLogViewer filters={filters} />
    </div>
  );
}
