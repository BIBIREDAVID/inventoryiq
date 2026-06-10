import { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import { collection, onSnapshot } from "firebase/firestore";

export default function StockPage() {
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const u1 = onSnapshot(collection(db, "products"), (snap) =>
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const u2 = onSnapshot(collection(db, "locations"), (snap) =>
      setLocations(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => { u1(); u2(); };
  }, []);

  const filtered = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const STOCK_COLOR = (qty) => {
    if (qty <= 0) return "text-red-400 bg-red-500/10";
    if (qty <= 10) return "text-amber-400 bg-amber-500/10";
    return "text-emerald-400 bg-emerald-500/10";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Stock Levels</h2>
          <p className="text-slate-400 text-sm mt-0.5">{products.length} products · {locations.length} locations</p>
        </div>
      </div>

      <div className="mb-4">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by product name or SKU..."
          className="w-full max-w-md bg-[#1a1d27] text-white text-sm border border-slate-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-indigo-500 placeholder-slate-500" />
      </div>

      <div className="bg-[#1a1d27] border border-slate-700/50 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50">
              {["Product", "SKU", "Category", "Stock Qty", "Reorder Point", "Status"].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center text-slate-500 py-10">
                {search ? "No products match." : "No products yet. Add products first."}
              </td></tr>
            )}
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition">
                <td className="px-4 py-3 text-white font-medium">{p.name}</td>
                <td className="px-4 py-3 text-slate-300 font-mono text-xs">{p.sku}</td>
                <td className="px-4 py-3">
                  <span className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full">{p.category || "—"}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STOCK_COLOR(p.stockQty || 0)}`}>
                    {p.stockQty || 0} {p.unitOfMeasure || "units"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400">{p.reorderPoint || 0}</td>
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
    </div>
  );
}