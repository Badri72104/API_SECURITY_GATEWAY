import { useGateway } from '../context/GatewayProvider';
import AnalyticsChart from '../components/AnalyticsChart';

export function DashboardPage() {
  const { logs } = useGateway();

  return (
    <div className="space-y-8">
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
          <p className="text-2xl font-semibold mt-1 text-green-500">Online</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Gateway URL</p>
          <p className="text-sm font-mono mt-1 text-blue-500">localhost:4000/proxy</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Requests</p>
          <p className="text-2xl font-semibold mt-1 text-purple-500">{logs.length}</p>
        </div>
      </div>

      {/* Analytics Chart */}
      <AnalyticsChart />
    </div>
  );
}
