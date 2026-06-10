import { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import { collection, onSnapshot } from "firebase/firestore";

export default function ReportsPage() {
  const [products, setProducts] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("stock");

  useEffect(() => {
    const u1 = onSnapshot(collection(db, "products"), (snap) =>
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const u2 = onSnapshot(collection(db, "adjustments"), (snap) =>
      setAdjustments(snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds))
    );
    const u3 = onSnapshot(collection(db, "purchaseOrders"), (snap) =>
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds))
    );
    return () => { u1(); u2(); u3(); };
  }, []);

  const totalStockValue = products.reduce((sum, p) => sum + ((p.stockQty || 0) * (p.costPrice || 0)), 0);
  const totalRetailValue = products.reduce((sum, p) => sum + ((p.stockQty || 0) * (p.sellingPrice || 0)), 0);
  const lowStock = products.filter((p) => (p.stockQty || 0) <= (p.reorderPoint || 0) && (p.stockQty || 0) > 0);
  const outOfStock = products.filter((p) => (p.stockQty || 0) <= 0);
  const totalPOValue = orders.filter((o) => o.status === "Received").reduce((sum, o) => sum + (o.total || 0), 0);

  const TABS = ["stock", "adjustments", "orders"];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">Reports</h2>
        <p className="text-slate-400 text-sm mt-0.5">Overview of your inventory data</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Products", value: products.length, color: "text-white" },
          { label: "Stock Cost Value", value: `₦${totalStockValue.toLocaleString()}`, color: "text-indigo-400" },
          { label: "Stock Retail Value", value: `₦${totalRetailValue.toLocaleString()}`, color: "text-emerald-400" },
          { label: "PO Value Received", value: `₦${totalPOValue.toLocaleString()}`, color: "text-cyan-400" },
        ].map((card) => (
          <div key={card.label} className="bg-[#1a1d27] border border-slate-700/50 rounded-xl p-5">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">{card.label}</p>
            <p className={`text-2xl font-bold mt-2 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-[#1a1d27] border border-amber-500/30 rounded-xl p-5">
          <p className="text-amber-400 text-sm font-semibold mb-3">⚠ Low Stock ({lowStock.length})</p>
          {lowStock.length === 0
            ? <p className="text-slate-500 text-sm">All products are above reorder point.</p>
            : lowStock.map((p) => (
              <div key={p.id} className="flex justify-between text-sm py-1.5 border-b border-slate-700/30 last:border-0">
                <span className="text-white">{p.name}</span>
                <span className="text-amber-400">{p.stockQty} left</span>
              </div>
            ))
          }
        </div>
        <div className="bg-[#1a1d27] border border-red-500/30 rounded-xl p-5">
          <p className="text-red-400 text-sm font-semibold mb-3">✕ Out of Stock ({outOfStock.length})</p>
          {outOfStock.length === 0
            ? <p className="text-slate-500 text-sm">No products are out of stock.</p>
            : outOfStock.map((p) => (
              <div key={p.id} className="flex justify-between text-sm py-1.5 border-b border-slate-700/30 last:border-0">
                <span className="text-white">{p.name}</span>
                <span className="text-red-400">0 units</span>
              </div>
            ))
          }
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition capitalize ${
              tab === t ? "bg-indigo-600 text-white" : "bg-[#1a1d27] text-slate-400 hover:text-white border border-slate-700"
            }`}>
            {t === "orders" ? "Purchase Orders" : t}
          </button>
        ))}
      </div>

      {/* Stock Tab */}
      {tab === "stock" && (
        <div className="bg-[#1a1d27] border border-slate-700/50 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                {["Product", "SKU", "Stock Qty", "Cost Price", "Selling Price", "Stock Value", "Status"].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition">
                  <td className="px-4 py-3 text-white font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">{p.sku}</td>
                  <td className="px-4 py-3 text-white">{p.stockQty || 0}</td>
                  <td className="px-4 py-3 text-slate-300">₦{Number(p.costPrice || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-300">₦{Number(p.sellingPrice || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-indigo-400 font-medium">₦{((p.stockQty || 0) * (p.costPrice || 0)).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {(p.stockQty || 0) <= 0
                      ? <span className="text-xs text-red-400 font-semibold">Out of Stock</span>
                      : (p.stockQty || 0) <= (p.reorderPoint || 0)
                      ? <span className="text-xs text-amber-400 font-semibold">Low Stock</span>
                      : <span className="text-xs text-emerald-400 font-semibold">In Stock</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Adjustments Tab */}
      {tab === "adjustments" && (
        <div className="bg-[#1a1d27] border border-slate-700/50 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                {["Product", "Type", "Qty", "Reason", "Date"].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {adjustments.length === 0 && (
                <tr><td colSpan={5} className="text-center text-slate-500 py-10">No adjustments yet.</td></tr>
              )}
              {adjustments.map((a) => (
                <tr key={a.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition">
                  <td className="px-4 py-3 text-white">{a.productName}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      a.type === "Add" ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
                    }`}>{a.type}</span>
                  </td>
                  <td className={`px-4 py-3 font-medium ${a.type === "Add" ? "text-emerald-400" : "text-red-400"}`}>
                    {a.type === "Add" ? "+" : "-"}{a.qty}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{a.reason}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{a.createdAt?.toDate?.().toLocaleDateString() || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Orders Tab */}
      {tab === "orders" && (
        <div className="bg-[#1a1d27] border border-slate-700/50 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                {["Order ID", "Supplier", "Total", "Status", "Date"].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr><td colSpan={5} className="text-center text-slate-500 py-10">No orders yet.</td></tr>
              )}
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition">
                  <td className="px-4 py-3 text-indigo-400 font-mono text-xs">{o.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-4 py-3 text-white">{o.supplierName}</td>
                  <td className="px-4 py-3 text-white font-medium">₦{Number(o.total || 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      o.status === "Received" ? "bg-emerald-500/20 text-emerald-300" :
                      o.status === "Sent" ? "bg-blue-500/20 text-blue-300" :
                      o.status === "Cancelled" ? "bg-red-500/20 text-red-300" :
                      "bg-slate-500/20 text-slate-300"
                    }`}>{o.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{o.createdAt?.toDate?.().toLocaleDateString() || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}