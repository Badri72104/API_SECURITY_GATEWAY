import toast from 'react-hot-toast';
import { api } from '../lib/api';

export default function ExportButtons() {
  const downloadFile = async (url, filename, type) => {
    try {
      const res = await api.get(url, { responseType: 'blob' });
      const objectUrl = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(objectUrl);
      toast.success(`${type} downloaded`);
    } catch {
      toast.error(`Failed to download ${type}`);
    }
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={() => downloadFile('/api/export/csv', 'gateway-logs.csv', 'CSV')}
        className="flex items-center gap-2 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        Export CSV
      </button>
      <button
        onClick={() => downloadFile('/api/export/pdf', 'gateway-report.pdf', 'PDF')}
        className="flex items-center gap-2 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        Export PDF
      </button>
    </div>
  );
}
