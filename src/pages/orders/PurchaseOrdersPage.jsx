import { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import {
  collection, addDoc, doc,
  onSnapshot, serverTimestamp, writeBatch, increment
} from "firebase/firestore";

const STATUSES = ["Draft", "Sent", "Received", "Cancelled"];
const STATUS_COLORS = {
  Draft: "bg-slate-500/20 text-slate-300",
  Sent: "bg-blue-500/20 text-blue-300",
  Received: "bg-emerald-500/20 text-emerald-300",
  Cancelled: "bg-red-500/20 text-red-300",
};

const EMPTY_FORM = { supplierId: "", expectedDate: "", notes: "", status: "Draft" };

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [items, setItems] = useState([{ productId: "", qty: 1, unitCost: 0 }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const u1 = onSnapshot(collection(db, "purchaseOrders"), (snap) =>
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds))
    );
    const u2 = onSnapshot(collection(db, "suppliers"), (snap) =>
      setSuppliers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const u3 = onSnapshot(collection(db, "products"), (snap) =>
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => { u1(); u2(); u3(); };
  }, []);

  function setField(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  function setItem(index, field, value) {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }

  function addItem() { setItems((prev) => [...prev, { productId: "", qty: 1, unitCost: 0 }]); }
  function removeItem(index) { setItems((prev) => prev.filter((_, i) => i !== index)); }

  const orderTotal = items.reduce((sum, i) => sum + (Number(i.qty) * Number(i.unitCost)), 0);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.supplierId) return alert("Please select a supplier");
    if (items.some((i) => !i.productId)) return alert("Please select a product for each line item");
    setSaving(true);
    const supplier = suppliers.find((s) => s.id === form.supplierId);
    await addDoc(collection(db, "purchaseOrders"), {
      ...form,
      supplierName: supplier?.name || "",
      items: items.map((i) => ({
        ...i,
        qty: Number(i.qty),
        unitCost: Number(i.unitCost),
        productName: products.find((p) => p.id === i.productId)?.name || "",
      })),
      total: orderTotal,
      createdAt: serverTimestamp(),
    });
    setForm(EMPTY_FORM);
    setItems([{ productId: "", qty: 1, unitCost: 0 }]);
    setModalOpen(false);
    setSaving(false);
  }

  async function handleReceive(order) {
    if (!window.confirm("Mark as Received? This will update stock levels.")) return;
    const batch = writeBatch(db);
    order.items.forEach((item) => {
      if (item.productId) {
        batch.update(doc(db, "products", item.productId), {
          stockQty: increment(Number(item.qty))
        });
      }
    });
    batch.update(doc(db, "purchaseOrders", order.id), {
      status: "Received", receivedAt: serverTimestamp()
    });
    await batch.commit();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Purchase Orders</h2>
          <p className="text-slate-400 text-sm mt-0.5">{orders.length} orders</p>
        </div>
        <button onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition">
          + New Order
        </button>
      </div>

      <div className="bg-[#1a1d27] border border-slate-700/50 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50">
              {["Order ID", "Supplier", "Items", "Total", "Status", "Date", ""].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr><td colSpan={7} className="text-center text-slate-500 py-10">No purchase orders yet.</td></tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition">
                <td className="px-4 py-3 text-indigo-400 font-mono text-xs">{o.id.slice(0, 8).toUpperCase()}</td>
                <td className="px-4 py-3 text-white font-medium">{o.supplierName}</td>
                <td className="px-4 py-3 text-slate-300">{o.items?.length} items</td>
                <td className="px-4 py-3 text-white font-medium">₦{Number(o.total || 0).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status]}`}>
                    {o.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">
                  {o.createdAt?.toDate?.().toLocaleDateString() || "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => setViewOrder(o)}
                      className="text-xs text-indigo-400 hover:text-indigo-300">View</button>
                    {o.status === "Sent" && (
                      <button onClick={() => handleReceive(o)}
                        className="text-xs text-emerald-400 hover:text-emerald-300">Receive</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Order Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1d27] border border-slate-700/50 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
              <h3 className="text-white font-semibold">New Purchase Order</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Supplier *</label>
                  <select value={form.supplierId} onChange={(e) => setField("supplierId", e.target.value)}
                    className="w-full bg-[#0f1117] text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-indigo-500">
                    <option value="">Select supplier</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Expected Date</label>
                  <input type="date" value={form.expectedDate} onChange={(e) => setField("expectedDate", e.target.value)}
                    className="w-full bg-[#0f1117] text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setField("status", e.target.value)}
                    className="w-full bg-[#0f1117] text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-indigo-500">
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">Line Items</p>
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <select value={item.productId} onChange={(e) => setItem(index, "productId", e.target.value)}
                          className="w-full bg-[#0f1117] text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-indigo-500">
                          <option value="">Select product</option>
                          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <input type="number" min="1" value={item.qty}
                          onChange={(e) => setItem(index, "qty", e.target.value)}
                          placeholder="Qty"
                          className="w-full bg-[#0f1117] text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-indigo-500" />
                      </div>
                      <div className="col-span-3">
                        <input type="number" min="0" value={item.unitCost}
                          onChange={(e) => setItem(index, "unitCost", e.target.value)}
                          placeholder="Unit cost"
                          className="w-full bg-[#0f1117] text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-indigo-500" />
                      </div>
                      <div className="col-span-1 text-slate-400 text-xs">
                        ₦{(Number(item.qty) * Number(item.unitCost)).toLocaleString()}
                      </div>
                      <div className="col-span-1 text-center">
                        {items.length > 1 && (
                          <button type="button" onClick={() => removeItem(index)}
                            className="text-red-400 hover:text-red-300 text-lg leading-none">×</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addItem}
                  className="mt-3 text-sm text-indigo-400 hover:text-indigo-300 transition">
                  + Add Line Item
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                <p className="text-white font-semibold">Total: ₦{orderTotal.toLocaleString()}</p>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setModalOpen(false)}
                    className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-700/50 transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold transition">
                    {saving ? "Saving..." : "Create Order"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Order Modal */}
      {viewOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1d27] border border-slate-700/50 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
              <h3 className="text-white font-semibold">Order #{viewOrder.id.slice(0, 8).toUpperCase()}</h3>
              <button onClick={() => setViewOrder(null)} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-slate-400 text-xs">Supplier</p><p className="text-white">{viewOrder.supplierName}</p></div>
                <div><p className="text-slate-400 text-xs">Status</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[viewOrder.status]}`}>{viewOrder.status}</span>
                </div>
                <div><p className="text-slate-400 text-xs">Expected Date</p><p className="text-white">{viewOrder.expectedDate || "—"}</p></div>
                <div><p className="text-slate-400 text-xs">Total</p><p className="text-white font-bold">₦{Number(viewOrder.total).toLocaleString()}</p></div>
              </div>
              <div>
                <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">Items</p>
                <div className="space-y-2">
                  {viewOrder.items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm bg-slate-800/50 rounded-lg px-3 py-2">
                      <span className="text-white">{item.productName}</span>
                      <span className="text-slate-400">{item.qty} × ₦{Number(item.unitCost).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
              {viewOrder.status === "Sent" && (
                <button onClick={() => { handleReceive(viewOrder); setViewOrder(null); }}
                  className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition">
                  Mark as Received & Update Stock
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}