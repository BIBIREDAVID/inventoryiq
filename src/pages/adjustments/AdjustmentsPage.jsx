import { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import {
  collection, addDoc, onSnapshot,
  doc, updateDoc, increment, serverTimestamp
} from "firebase/firestore";

const REASONS = ["Initial Stock", "Damaged Goods", "Stock Count Correction", "Returned Item", "Expired", "Theft/Loss", "Other"];
const TYPES = ["Add", "Remove"];

export default function AdjustmentsPage() {
  const [adjustments, setAdjustments] = useState([]);
  const [products, setProducts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ productId: "", type: "Add", qty: "", reason: "Initial Stock", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const u1 = onSnapshot(collection(db, "adjustments"), (snap) =>
      setAdjustments(snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds))
    );
    const u2 = onSnapshot(collection(db, "products"), (snap) =>
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => { u1(); u2(); };
  }, []);

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.productId) return alert("Please select a product");
    if (!form.qty || Number(form.qty) <= 0) return alert("Quantity must be greater than 0");
    setSaving(true);
    const product = products.find((p) => p.id === form.productId);
    const qtyChange = form.type === "Add" ? Number(form.qty) : -Number(form.qty);

    await addDoc(collection(db, "adjustments"), {
      productId: form.productId,
      productName: product?.name || "",
      type: form.type,
      qty: Number(form.qty),
      qtyChange,
      reason: form.reason,
      notes: form.notes,
      createdAt: serverTimestamp(),
    });

    await updateDoc(doc(db, "products", form.productId), {
      stockQty: increment(qtyChange)
    });

    setForm({ productId: "", type: "Add", qty: "", reason: "Initial Stock", notes: "" });
    setModalOpen(false);
    setSaving(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Stock Adjustments</h2>
          <p className="text-slate-400 text-sm mt-0.5">{adjustments.length} adjustments</p>
        </div>
        <button onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition">
          + New Adjustment
        </button>
      </div>

      <div className="bg-[#1a1d27] border border-slate-700/50 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50">
              {["Product", "Type", "Quantity", "Reason", "Notes", "Date"].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {adjustments.length === 0 && (
              <tr><td colSpan={6} className="text-center text-slate-500 py-10">No adjustments yet.</td></tr>
            )}
            {adjustments.map((a) => (
              <tr key={a.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition">
                <td className="px-4 py-3 text-white font-medium">{a.productName}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    a.type === "Add" ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
                  }`}>{a.type}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={a.type === "Add" ? "text-emerald-400" : "text-red-400"}>
                    {a.type === "Add" ? "+" : "-"}{a.qty}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-300">{a.reason}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">{a.notes || "—"}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">
                  {a.createdAt?.toDate?.().toLocaleDateString() || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1d27] border border-slate-700/50 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
              <h3 className="text-white font-semibold">New Stock Adjustment</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Product *</label>
                <select value={form.productId} onChange={(e) => set("productId", e.target.value)}
                  className="w-full bg-[#0f1117] text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-indigo-500">
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.stockQty || 0})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Type</label>
                  <select value={form.type} onChange={(e) => set("type", e.target.value)}
                    className="w-full bg-[#0f1117] text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-indigo-500">
                    {TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Quantity *</label>
                  <input type="number" min="1" value={form.qty} onChange={(e) => set("qty", e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#0f1117] text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-indigo-500 placeholder-slate-600" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Reason</label>
                <select value={form.reason} onChange={(e) => set("reason", e.target.value)}
                  className="w-full bg-[#0f1117] text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-indigo-500">
                  {REASONS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)}
                  rows={2} placeholder="Optional notes"
                  className="w-full bg-[#0f1117] text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-indigo-500 placeholder-slate-600 resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-700/50 transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold transition">
                  {saving ? "Saving..." : "Save Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}