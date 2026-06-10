import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { collection, onSnapshot } from "firebase/firestore";

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
  const pendingOrders = orders.filter((o) => o.status === "Draft" || o.status === "Sent");

  const STATS = [
    { label: "Total Products", value: products.length, color: "text-white" },
    { label: "Low Stock Alerts", value: lowStock.length, color: lowStock.length > 0 ? "text-amber-400" : "text-white" },
    { label: "Pending Orders", value: pendingOrders.length, color: pendingOrders.length > 0 ? "text-indigo-400" : "text-white" },
    { label: "Total Locations", value: locations.length, color: "text-white" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">Dashboard</h2>
        <p className="text-slate-400 text-sm mt-1">Welcome to InventoryIQ</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map((s) => (
          <div key={s.label} className="bg-[#1a1d27] border border-slate-700/50 rounded-xl p-5 hover:border-indigo-500/30 transition">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">{s.label}</p>
            <p className={`text-3xl font-bold mt-2 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activity */}
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