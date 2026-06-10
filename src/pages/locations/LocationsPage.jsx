import { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import { collection, addDoc, deleteDoc, doc, onSnapshot, serverTimestamp } from "firebase/firestore";

const TYPES = ["Warehouse", "Store", "Bin", "Shelf", "Zone"];

export default function LocationsPage() {
  const [locations, setLocations] = useState([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("Warehouse");
  const [zone, setZone] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "locations"), (snap) => {
      setLocations(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    await addDoc(collection(db, "locations"), {
      name, type, zone, createdAt: serverTimestamp()
    });
    setName(""); setType("Warehouse"); setZone("");
    setModalOpen(false);
  }

  async function handleDelete(id) {
    if (window.confirm("Delete this location?")) await deleteDoc(doc(db, "locations", id));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Locations</h2>
          <p className="text-slate-400 text-sm mt-0.5">{locations.length} locations</p>
        </div>
        <button onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition">
          + Add Location
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map((loc) => (
          <div key={loc.id} className="bg-[#1a1d27] border border-slate-700/50 rounded-xl p-5 hover:border-indigo-500/30 transition">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white font-semibold">{loc.name}</p>
                <p className="text-slate-400 text-sm mt-1">{loc.zone || "No zone"}</p>
              </div>
              <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-0.5 rounded-full">{loc.type}</span>
            </div>
            <button onClick={() => handleDelete(loc.id)}
              className="mt-4 text-xs text-red-400 hover:text-red-300 transition">
              Delete
            </button>
          </div>
        ))}
        {locations.length === 0 && (
          <p className="text-slate-500 text-sm col-span-3">No locations yet. Add your first location.</p>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1d27] border border-slate-700/50 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
              <h3 className="text-white font-semibold">Add Location</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Location Name *</label>
                <input required value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Main Warehouse"
                  className="w-full bg-[#0f1117] text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-indigo-500 placeholder-slate-600" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)}
                  className="w-full bg-[#0f1117] text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-indigo-500">
                  {TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Zone / Area</label>
                <input value={zone} onChange={(e) => setZone(e.target.value)}
                  placeholder="e.g. Zone A"
                  className="w-full bg-[#0f1117] text-white text-sm rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:border-indigo-500 placeholder-slate-600" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-700/50 transition">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition">
                  Add Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}