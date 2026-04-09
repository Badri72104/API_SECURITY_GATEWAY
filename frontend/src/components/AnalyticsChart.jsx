import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend
);

export default function AnalyticsChart() {
  const [analytics, setAnalytics] = useState([]);

  useEffect(() => {
    axios.get('/api/analytics').then(({ data }) => setAnalytics(data));
    const interval = setInterval(() => {
      axios.get('/api/analytics').then(({ data }) => setAnalytics(data));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const labels  = analytics.map(d => `${d._id}:00`);
  const totals  = analytics.map(d => d.total);
  const blocked = analytics.map(d => d.blocked);

  const data = {
    labels,
    datasets: [
      {
        label:           'Total Requests',
        data:            totals,
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderRadius:    4,
      },
      {
        label:           'Blocked',
        data:            blocked,
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderRadius:    4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        labels: { color: '#9ca3af' },
      },
    },
    scales: {
      x: { ticks: { color: '#9ca3af' }, grid: { color: '#1f2937' } },
      y: { ticks: { color: '#9ca3af' }, grid: { color: '#1f2937' } },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 
      dark:border-gray-800 rounded-xl p-6">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Requests — Last 24 Hours
      </h2>
      {analytics.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
          No data yet — make some requests first
        </div>
      ) : (
        <Bar data={data} options={options}/>
      )}
    </div>
  );
}