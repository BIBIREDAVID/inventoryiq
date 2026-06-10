import { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import {
  collection, addDoc, deleteDoc, updateDoc,
  doc, onSnapshot, serverTimestamp
} from "firebase/firestore";

const EMPTY = { name: "", email: "", phone: "", address: "", contactPerson: "", notes: "" };

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "suppliers"), (snap) =>
      setSuppliers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, []);

  function openAdd() { setEditing(null); setForm(EMPTY); setModalOpen(true); }
  function openEdit(s) { setEditing(s); setForm(s); setModalOpen(true); }

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSave(e) {
    e.preventDefault();
    if (editing) {
      await updateDoc(doc(db, "suppliers", editing.id), { ...form, updatedAt: serverTimestamp() });
    } else {
      await addDoc(collection(db, "suppliers"), { ...form, createdAt: serverTimestamp() });
    }
    setModalOpen(false);
  }

  async function handleDelete(id) {
    if (window.confirm("Delete this supplier?")) await deleteDoc(doc(db, "suppliers", id));
  }

  const filtered = suppliers.filter((s) =>
    [s.name, s.email, s.contactPerson].some((f) =>
      f?.toLowerCase().includes(search.toLowerCase())
    )
  );

  const Field = ({ label, field, type = "text", placeholder = "" }) => (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
      <input type={type} value={form[field]} onChange={(e) => set(field, e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#0f1117] text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-indigo-500 placeholder-slate-600 transition" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Suppliers</h2>
          <p className="text-slate-400 text-sm mt-0.5">{suppliers.length} suppliers</p>
        </div>
        <button onClick={openAdd}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition">
          + Add Supplier
        </button>
      </div>

      <div className="mb-4">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search suppliers..."
          className="w-full max-w-md bg-[#1a1d27] text-white text-sm border border-slate-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-indigo-500 placeholder-slate-500" />
      </div>

      <div className="bg-[#1a1d27] border border-slate-700/50 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50">
              {["Supplier", "Contact Person", "Email", "Phone", ""].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="text-center text-slate-500 py-10">
                {search ? "No suppliers match." : "No suppliers yet."}
              </td></tr>
            )}
            {filtered.map((s) => (
              <tr key={s.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition">
                <td className="px-4 py-3">
                  <p className="text-white font-medium">{s.name}</p>
                  <p className="text-slate-500 text-xs">{s.address || "No address"}</p>
                </td>
                <td className="px-4 py-3 text-slate-300">{s.contactPerson || "—"}</td>
                <td className="px-4 py-3 text-slate-300">{s.email || "—"}</td>
                <td className="px-4 py-3 text-slate-300">{s.phone || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(s)} className="text-xs text-indigo-400 hover:text-indigo-300">Edit</button>
                    <button onClick={() => handleDelete(s.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1d27] border border-slate-700/50 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
              <h3 className="text-white font-semibold">{editing ? "Edit Supplier" : "Add Supplier"}</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><Field label="Supplier Name *" field="name" placeholder="e.g. Acme Ltd" /></div>
                <Field label="Contact Person" field="contactPerson" placeholder="e.g. John Doe" />
                <Field label="Phone" field="phone" placeholder="e.g. 08012345678" />
                <Field label="Email" field="email" type="email" placeholder="supplier@email.com" />
                <Field label="Address" field="address" placeholder="e.g. Lagos, Nigeria" />
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Notes</label>
                  <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)}
                    rows={2} placeholder="Optional notes"
                    className="w-full bg-[#0f1117] text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-indigo-500 placeholder-slate-600 resize-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-700/50 transition">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition">
                  {editing ? "Save Changes" : "Add Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}