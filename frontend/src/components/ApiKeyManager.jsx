import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function ApiKeyManager() {
  const [keys, setKeys]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm]       = useState({
    name:       '',
    targetUrl:  '',
    rateLimit:  100,
    usageLimit: 10000,
  });

  const fetchKeys = async () => {
    const { data } = await axios.get('/api/keys');
    setKeys(data);
  };

  useEffect(() => {
    let isMounted = true;

    const loadKeys = async () => {
      try {
        const { data } = await axios.get('/api/keys');
        if (isMounted) {
          setKeys(data);
        }
      } catch (err) {
        if (isMounted) {
          toast.error(err.response?.data?.error || 'Failed to load API keys');
        }
      }
    };

    void loadKeys();

    return () => {
      isMounted = false;
    };
  }, []);

  const createKey = async () => {
    if (!form.name || !form.targetUrl) {
      toast.error('Name and Target URL are required');
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post('/api/keys', form);
      toast.success('Key created! Copy it now — it will not be shown again.');
      prompt('Copy your API key:', data.key);
      await fetchKeys();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create key');
    }
    setLoading(false);
  };

  const toggleKey = async (id, current) => {
    try {
      await axios.patch(`/api/keys/${id}/toggle`, { isActive: !current });
      await fetchKeys();
      toast.success(`Key ${!current ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error('Failed to toggle key');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-900 border border-gray-200
        dark:border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Create API Key
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Key name"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="border border-gray-300 dark:border-gray-700
              rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800
              text-gray-900 dark:text-white w-full"
          />
          <input
            type="text"
            placeholder="Target URL (e.g. https://api.example.com)"
            value={form.targetUrl}
            onChange={e => setForm({ ...form, targetUrl: e.target.value })}
            className="border border-gray-300 dark:border-gray-700
              rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800
              text-gray-900 dark:text-white w-full"
          />
          <input
            type="number"
            placeholder="Rate limit (req/min)"
            value={form.rateLimit}
            onChange={e => setForm({ ...form, rateLimit: parseInt(e.target.value) })}
            className="border border-gray-300 dark:border-gray-700
              rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800
              text-gray-900 dark:text-white w-full"
          />
          <input
            type="number"
            placeholder="Usage limit (total requests)"
            value={form.usageLimit}
            onChange={e => setForm({ ...form, usageLimit: parseInt(e.target.value) })}
            className="border border-gray-300 dark:border-gray-700
              rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800
              text-gray-900 dark:text-white w-full"
          />
        </div>
        <button
          onClick={createKey}
          disabled={loading}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white
            text-sm font-medium px-6 py-2 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Key'}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200
        dark:border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Active Keys
        </h2>
        {keys.length === 0 && (
          <p className="text-gray-500 text-sm">No keys created yet.</p>
        )}
        <div className="space-y-3">
          {keys.map(key => (
            <div
              key={key._id}
              className="flex items-center justify-between p-4
                border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {key.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {key.targetUrl} · {key.rateLimit} req/min ·
                  {key.usageCount}/{key.usageLimit} used
                </p>
                <p className="text-xs text-gray-400 mt-1 font-mono">
                  prefix: {key.prefix}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  key.isActive
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                }`}>
                  {key.isActive ? 'Active' : 'Disabled'}
                </span>
                <button
                  onClick={() => toggleKey(key._id, key.isActive)}
                  className="text-xs border border-gray-300 dark:border-gray-600
                    rounded px-3 py-1 text-gray-600 dark:text-gray-300
                    hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {key.isActive ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
