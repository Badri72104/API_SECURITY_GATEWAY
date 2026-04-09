import toast from 'react-hot-toast';

export default function ExportButtons() {
  const downloadCSV = async () => {
    try {
      const res  = await fetch('/api/export/csv');
      const blob = await res.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'gateway-logs.csv';
      a.click();
      toast.success('CSV downloaded');
    } catch {
      toast.error('Failed to download CSV');
    }
  };

  const downloadPDF = async () => {
    try {
      const res  = await fetch('/api/export/pdf');
      const blob = await res.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'gateway-report.pdf';
      a.click();
      toast.success('PDF downloaded');
    } catch {
      toast.error('Failed to download PDF');
    }
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={downloadCSV}
        className="flex items-center gap-2 border border-gray-300 
          dark:border-gray-700 rounded-lg px-4 py-2 text-sm 
          text-gray-700 dark:text-gray-300 hover:bg-gray-100 
          dark:hover:bg-gray-800"
      >
        Export CSV
      </button>
      <button
        onClick={downloadPDF}
        className="flex items-center gap-2 border border-gray-300 
          dark:border-gray-700 rounded-lg px-4 py-2 text-sm 
          text-gray-700 dark:text-gray-300 hover:bg-gray-100 
          dark:hover:bg-gray-800"
      >
        Export PDF
      </button>
    </div>
  );
}