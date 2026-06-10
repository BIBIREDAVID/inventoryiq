import { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, serverTimestamp
} from "firebase/firestore";
import ProductModal from "../../components/products/ProductModal";
import BarcodeScanner from "../../components/products/BarcodeScanner";
import { exportToCSV } from "../../utils/exportCSV";
import CSVImport from "../../components/products/CSVImport";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "products"), (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const filtered = products.filter((p) =>
    [p.name, p.sku, p.upc, p.category].some((f) =>
      f?.toLowerCase().includes(search.toLowerCase())
    )
  );

  async function handleSave(data) {
    if (editing) {
      await updateDoc(doc(db, "products", editing.id), { ...data, updatedAt: serverTimestamp() });
    } else {
      await addDoc(collection(db, "products"), { ...data, createdAt: serverTimestamp() });
    }
    setModalOpen(false);
    setEditing(null);
  }

  async function handleDelete(id) {
    if (window.confirm("Delete this product?")) {
      await deleteDoc(doc(db, "products", id));
    }
  }

  async function handleDuplicate(product) {
    const { id, createdAt, ...data } = product;
    await addDoc(collection(db, "products"), {
      ...data,
      name: `${data.name} (Copy)`,
      sku: `${data.sku}-COPY`,
      stockQty: 0,
      createdAt: serverTimestamp(),
    });
  }

  function openEdit(product) {
    setEditing(product);
    setModalOpen(true);
  }

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  const STOCK_COLOR = (qty) => {
    if (qty <= 0) return "text-red-400 bg-red-500/10";
    if (qty <= 10) return "text-amber-400 bg-amber-500/10";
    return "text-emerald-400 bg-emerald-500/10";
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Product Catalogue</h2>
          <p className="text-slate-400 text-sm mt-0.5">{products.length} products total</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setScannerOpen(true)}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition flex items-center gap-2">
            📷 Scan
          </button>
          <button onClick={openAdd}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition">
            + Add Product
          </button>
          <button onClick={() => exportToCSV("products", products.map((p) => ({
              Name: p.name,
              SKU: p.sku,
              UPC: p.upc || "",
              Category: p.category || "",
              Unit: p.unitOfMeasure || "",
              "Cost Price": p.costPrice || 0,
              "Selling Price": p.sellingPrice || 0,
              "Stock Qty": p.stockQty || 0,
              "Reorder Point": p.reorderPoint || 0,
            })))}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition">
              ↓ Export CSV
            </button>
          <button onClick={() => setCsvImportOpen(true)}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition">
            ↑ Import CSV
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, SKU, UPC, or category..."
          className="w-full max-w-md bg-[#1a1d27] text-white text-sm border border-slate-700 rounded-lg px-4 py-2.5 focus:outline-none focus:border-indigo-500 placeholder-slate-500"
        />
      </div>

      {/* Table */}
      <div className="bg-[#1a1d27] border border-slate-700/50 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50">
              {["Product", "SKU", "Category", "Cost", "Price", "Stock", "Reorder At", ""].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} className="text-center text-slate-500 py-10">Loading...</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={8} className="text-center text-slate-500 py-10">
                {search ? "No products match your search." : "No products yet. Click + Add Product to get started."}
              </td></tr>
            )}
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {p.imageUrl
                        ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                        : <span className="text-base">📦</span>
                      }
                    </div>
                    <div>
                      <p className="text-white font-medium">{p.name}</p>
                      <p className="text-slate-500 text-xs">{p.upc || "No UPC"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-300 font-mono text-xs">{p.sku}</td>
                <td className="px-4 py-3">
                  <span className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full">{p.category || "—"}</span>
                </td>
                <td className="px-4 py-3 text-slate-300">₦{Number(p.costPrice || 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-white font-medium">₦{Number(p.sellingPrice || 0).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STOCK_COLOR(p.stockQty || 0)}`}>
                    {p.stockQty || 0} {p.unitOfMeasure || "units"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400">{p.reorderPoint || 0}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(p)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition">Edit</button>
                    <button onClick={() => handleDuplicate(p)}
                      className="text-xs text-slate-400 hover:text-white transition">Copy</button>
                    <button onClick={() => handleDelete(p.id)}
                      className="text-xs text-red-400 hover:text-red-300 transition">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <ProductModal
          product={editing}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditing(null); }}
        />
      )}
      {scannerOpen && (
        <BarcodeScanner
          onScan={(code) => { setSearch(code); setScannerOpen(false); }}
          onClose={() => setScannerOpen(false)}
        />
      )}
      {csvImportOpen && <CSVImport onClose={() => setCsvImportOpen(false)} />}
    </div>
  );
}