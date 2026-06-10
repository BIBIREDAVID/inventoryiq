import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { collection, onSnapshot } from "firebase/firestore";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0f1117] border border-slate-700 rounded-lg px-3 py-2 text-sm">
        <p className="text-slate-400 mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }} className="font-semibold">
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [locations, setLocations] = useState([]);
  const [adjustments, setAdjustments] = useState([]);

  useEffect(() => {
    const u1 = onSnapshot(collection(db, "products"), (snap) =>
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const u2 = onSnapshot(collection(db, "purchaseOrders"), (snap) =>
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const u3 = onSnapshot(collection(db, "locations"), (snap) =>
      setLocations(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const u4 = onSnapshot(collection(db, "adjustments"), (snap) =>
      setAdjustments(snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds)
        .slice(0, 5))
    );
    return () => { u1(); u2(); u3(); u4(); };
  }, []);

  const lowStock = products.filter((p) => (p.stockQty || 0) <= (p.reorderPoint || 0) && (p.stockQty || 0) > 0);
  const outOfStock = products.filter((p) => (p.stockQty || 0) <= 0);
  const pendingOrders = orders.filter((o) => o.status === "Draft" || o.status === "Sent");
  const totalStockValue = products.reduce((sum, p) => sum + ((p.stockQty || 0) * (p.costPrice || 0)), 0);
  const totalRetailValue = products.reduce((sum, p) => sum + ((p.stockQty || 0) * (p.sellingPrice || 0)), 0);

  // Top 5 most stocked
  const top5 = [...products]
    .sort((a, b) => (b.stockQty || 0) - (a.stockQty || 0))
    .slice(0, 5)
    .map((p) => ({ name: p.name?.length > 12 ? p.name.slice(0, 12) + "…" : p.name, stock: p.stockQty || 0 }));

  // Top 5 least stocked (exclude zero)
  const bottom5 = [...products]
    .filter((p) => (p.stockQty || 0) > 0)
    .sort((a, b) => (a.stockQty || 0) - (b.stockQty || 0))
    .slice(0, 5)
    .map((p) => ({ name: p.name?.length > 12 ? p.name.slice(0, 12) + "…" : p.name, stock: p.stockQty || 0 }));

  // Stock movement from adjustments (last 7 days)
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" });
  });

  const movementData = last7.map((day) => {
    const dayAdjustments = adjustments.filter((a) => {
      if (!a.createdAt?.toDate) return false;
      const aDay = a.createdAt.toDate().toLocaleDateString("en-GB", { weekday: "short", day: "numeric" });
      return aDay === day;
    });
    return {
      day,
      added: dayAdjustments.filter((a) => a.type === "Add").reduce((s, a) => s + a.qty, 0),
      removed: dayAdjustments.filter((a) => a.type === "Remove").reduce((s, a) => s + a.qty, 0),
    };
  });

  // Category breakdown
  const categoryMap = {};
  products.forEach((p) => {
    const cat = p.category || "Uncategorized";
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });
  const categoryData = Object.entries(categoryMap).map(([name, count]) => ({ name, count }));

  const STATS = [
    { label: "Total Products", value: products.length, sub: `${outOfStock.length} out of stock`, color: "text-white" },
    { label: "Low Stock Alerts", value: lowStock.length, sub: "below reorder point", color: lowStock.length > 0 ? "text-amber-400" : "text-white" },
    { label: "Pending Orders", value: pendingOrders.length, sub: "draft or sent", color: pendingOrders.length > 0 ? "text-indigo-400" : "text-white" },
    { label: "Total Locations", value: locations.length, sub: "warehouses & bins", color: "text-white" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">Dashboard</h2>
        <p className="text-slate-400 text-sm mt-1">Welcome to InventoryIQ</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STATS.map((s) => (
          <div key={s.label} className="bg-[#1a1d27] border border-slate-700/50 rounded-xl p-5 hover:border-indigo-500/30 transition">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">{s.label}</p>
            <p className={`text-3xl font-bold mt-2 ${s.color}`}>{s.value}</p>
            <p className="text-slate-500 text-xs mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Value Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#1a1d27] border border-indigo-500/20 rounded-xl p-5">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Total Stock Cost Value</p>
          <p className="text-3xl font-bold text-indigo-400 mt-2">₦{totalStockValue.toLocaleString()}</p>
          <p className="text-slate-500 text-xs mt-1">based on cost price</p>
        </div>
        <div className="bg-[#1a1d27] border border-emerald-500/20 rounded-xl p-5">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Total Stock Retail Value</p>
          <p className="text-3xl font-bold text-emerald-400 mt-2">₦{totalRetailValue.toLocaleString()}</p>
          <p className="text-slate-500 text-xs mt-1">based on selling price</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Top 5 Most Stocked */}
        <div className="bg-[#1a1d27] border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Top 5 Most Stocked</h3>
          {top5.length === 0
            ? <p className="text-slate-500 text-sm">No products yet.</p>
            : <ResponsiveContainer width="100%" height={200}>
                <BarChart data={top5} barSize={28}>
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.1)" }} />
                  <Bar dataKey="stock" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
          }
        </div>

        {/* Top 5 Least Stocked */}
        <div className="bg-[#1a1d27] border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Top 5 Least Stocked</h3>
          {bottom5.length === 0
            ? <p className="text-slate-500 text-sm">No products yet.</p>
            : <ResponsiveContainer width="100%" height={200}>
                <BarChart data={bottom5} barSize={28}>
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(245,158,11,0.1)" }} />
                  <Bar dataKey="stock" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
          }
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Stock Movement */}
        <div className="bg-[#1a1d27] border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Stock Movement (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={movementData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }} />
              <Line type="monotone" dataKey="added" stroke="#10b981" strokeWidth={2} dot={false} name="Added" />
              <Line type="monotone" dataKey="removed" stroke="#ef4444" strokeWidth={2} dot={false} name="Removed" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="bg-[#1a1d27] border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Products by Category</h3>
          {categoryData.length === 0
            ? <p className="text-slate-500 text-sm">No products yet.</p>
            : <ResponsiveContainer width="100%" height={200}>
                <BarChart data={categoryData} barSize={28} layout="vertical">
                  <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.1)" }} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Products" />
                </BarChart>
              </ResponsiveContainer>
          }
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Adjustments */}
        <div className="bg-[#1a1d27] border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Recent Adjustments</h3>
          {adjustments.length === 0
            ? <p className="text-slate-500 text-sm">No activity yet.</p>
            : adjustments.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0">
                <div>
                  <p className="text-white text-sm font-medium">{a.productName}</p>
                  <p className="text-slate-500 text-xs">{a.reason}</p>
                </div>
                <span className={`text-sm font-semibold ${a.type === "Add" ? "text-emerald-400" : "text-red-400"}`}>
                  {a.type === "Add" ? "+" : "-"}{a.qty}
                </span>
              </div>
            ))
          }
        </div>

        {/* Reorder Alerts */}
        <div className="bg-[#1a1d27] border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Reorder Alerts</h3>
          {lowStock.length === 0
            ? <p className="text-slate-500 text-sm">No alerts. All stock levels are above reorder points.</p>
            : lowStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0">
                <div>
                  <p className="text-white text-sm font-medium">{p.name}</p>
                  <p className="text-slate-500 text-xs">Reorder at {p.reorderPoint} units</p>
                </div>
                <span className="text-amber-400 text-sm font-semibold">{p.stockQty} left</span>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}