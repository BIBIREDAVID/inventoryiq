import { useState, useEffect } from "react";
import { db, auth } from "../../firebase/config";
import {
  collection, addDoc, deleteDoc, updateDoc,
  doc, onSnapshot, serverTimestamp
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

const ROLES = ["admin", "manager", "staff"];
const ROLE_COLORS = {
  admin: "bg-indigo-500/20 text-indigo-300",
  manager: "bg-cyan-500/20 text-cyan-300",
  staff: "bg-emerald-500/20 text-emerald-300",
};
const EMPTY = { name: "", email: "", password: "", role: "staff" };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) =>
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, []);

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); setError(""); }

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return setError("All fields are required");
    if (form.password.length < 6) return setError("Password must be at least 6 characters");
    setSaving(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await addDoc(collection(db, "users"), {
        uid: result.user.uid,
        name: form.name,
        email: form.email,
        role: form.role,
        createdAt: serverTimestamp(),
      });
      setForm(EMPTY);
      setModalOpen(false);
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    }
    setSaving(false);
  }

  async function handleRoleChange(user, newRole) {
    await updateDoc(doc(db, "users", user.id), { role: newRole });
  }

  async function handleDelete(user) {
    if (window.confirm(`Delete ${user.name}? This removes them from the system.`)) {
      await deleteDoc(doc(db, "users", user.id));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Users</h2>
          <p className="text-slate-400 text-sm mt-0.5">{users.length} users</p>
        </div>
        <button onClick={() => { setForm(EMPTY); setError(""); setModalOpen(true); }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition">
          + Add User
        </button>
      </div>

      <div className="bg-[#1a1d27] border border-slate-700/50 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50">
              {["Name", "Email", "Role", "Created", ""].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr><td colSpan={5} className="text-center text-slate-500 py-10">No users yet.</td></tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                      {u.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-white font-medium">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-300">{u.email}</td>
                <td className="px-4 py-3">
                  <select value={u.role} onChange={(e) => handleRoleChange(u, e.target.value)}
                    className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer ${ROLE_COLORS[u.role]} bg-transparent`}>
                    {ROLES.map((r) => <option key={r} value={r} className="bg-[#1a1d27] text-white">{r}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">
                  {u.createdAt?.toDate?.().toLocaleDateString() || "—"}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(u)}
                    className="text-xs text-red-400 hover:text-red-300 transition">Delete</button>
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
              <h3 className="text-white font-semibold">Add New User</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">{error}</div>
              )}
              {[
                { label: "Full Name", field: "name", type: "text", placeholder: "e.g. John Doe" },
                { label: "Email", field: "email", type: "email", placeholder: "john@company.com" },
                { label: "Password", field: "password", type: "password", placeholder: "Min 6 characters" },
              ].map(({ label, field, type, placeholder }) => (
                <div key={field}>
                  <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
                  <input type={type} value={form[field]} onChange={(e) => set(field, e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-[#0f1117] text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-indigo-500 placeholder-slate-600" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Role</label>
                <select value={form.role} onChange={(e) => set("role", e.target.value)}
                  className="w-full bg-[#0f1117] text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-indigo-500">
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-700/50 transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold transition">
                  {saving ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}