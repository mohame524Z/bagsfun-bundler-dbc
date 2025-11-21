'use client';

export default function RPCManager() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800/50 rounded-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">📡 RPC Manager</h2>
          <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg">
            Add Custom RPC
          </button>
        </div>

        <div className="space-y-4">
          {[
            { name: 'Helius Primary', url: 'https://mainnet.helius-rpc.com', status: 'healthy', latency: 45 },
            { name: 'Helius Backup', url: 'https://mainnet.helius-rpc.com', status: 'healthy', latency: 62 },
            { name: 'QuickNode', url: 'https://...quiknode.pro', status: 'healthy', latency: 78 },
          ].map((rpc, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
              <div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${rpc.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <p className="text-white font-medium">{rpc.name}</p>
                  {i === 0 && (
                    <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded">Active</span>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-1">{rpc.url}</p>
                <p className="text-xs text-gray-500 mt-1">Latency: {rpc.latency}ms • Priority: {i + 1}</p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm">
                  Switch
                </button>
                <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Health Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800/50 rounded-xl p-6">
          <p className="text-gray-400 text-sm mb-2">Total Endpoints</p>
          <p className="text-3xl font-bold text-white">3</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-6">
          <p className="text-gray-400 text-sm mb-2">Healthy</p>
          <p className="text-3xl font-bold text-green-400">3/3</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-6">
          <p className="text-gray-400 text-sm mb-2">Avg Latency</p>
          <p className="text-3xl font-bold text-white">62ms</p>
        </div>
      </div>
    </div>
  );
}
