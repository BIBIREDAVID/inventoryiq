const STATS = ["Total Products", "Low Stock Alerts", "Pending Orders", "Total Locations"];

export default function Dashboard() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">Dashboard</h2>
        <p className="text-slate-400 text-sm mt-1">Welcome to InventoryIQ</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map((label) => (
          <div key={label} className="bg-[#1a1d27] border border-slate-700/50 rounded-xl p-5 hover:border-indigo-500/30 transition">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">{label}</p>
            <p className="text-3xl font-bold text-white mt-2">—</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#1a1d27] border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Recent Activity</h3>
          <p className="text-slate-500 text-sm">No activity yet. Data will appear here as you use the system.</p>
        </div>
        <div className="bg-[#1a1d27] border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Reorder Alerts</h3>
          <p className="text-slate-500 text-sm">No alerts. All stock levels are above reorder points.</p>
        </div>
      </div>
    </div>
  );
}